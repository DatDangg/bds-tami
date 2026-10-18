import type { CollectionAfterChangeHook, GlobalAfterChangeHook, PayloadRequest } from "payload";

import { type TranslateContentInput, TRANSLATE_CONTENT_SLUG, TRANSLATION_DEBOUNCE_MS } from "../../lib/translation/job-input";
import { hasSourceChanged } from "../../lib/translation/leaves";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { computeSourceHash, readStoredTranslation } from "./compute-source-hash";
import {
  isPublishedForTranslation,
  isTranslatableCollection,
  isTranslatableGlobal,
  TRANSLATION_JOB_CONTEXT_KEY,
  type TranslationTargetRef,
} from "./translation-targets";

type Doc = Record<string, unknown>;

export interface EnqueueTranslationOptions {
  debounceMs?: number;
  now?: () => Date;
}

/** `site-settings.translationEnabled` (mặc định bật; BR-08 "tắt nhanh"): chỉ admin đọc nên phải `overrideAccess`. */
export async function isTranslationEnabled(req: PayloadRequest): Promise<boolean> {
  const settings = await preserveRequestLocale(req, () =>
    req.payload.findGlobal({ slug: "site-settings", depth: 0, select: { translationEnabled: true }, overrideAccess: true, req }),
  );
  return settings.translationEnabled !== false;
}

/** Job dịch của CHÍNH bản ghi này đã xếp nhưng chưa chạy (chưa lấy, chưa lỗi cuối): lần lưu mới chỉ cần lùi giờ chạy của nó. */
async function findPendingJob(req: PayloadRequest, input: TranslateContentInput): Promise<{ id: string | number } | undefined> {
  const found = await preserveRequestLocale(req, () =>
    req.payload.find({
      collection: "payload-jobs",
      where: {
        and: [
          { taskSlug: { equals: TRANSLATE_CONTENT_SLUG } },
          { completedAt: { exists: false } },
          { processing: { not_equals: true } },
          { hasError: { not_equals: true } },
          { "input.kind": { equals: input.kind } },
          { "input.slug": { equals: input.slug } },
          ...(input.docId ? [{ "input.docId": { equals: input.docId } }] : []),
        ],
      },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req,
    }),
  );
  return found.docs[0];
}

/**
 * Xếp (hoặc lùi giờ) MỘT job dịch cho bản ghi: idempotent theo (loại, slug, id). Bên gọi truyền `req` KHÔNG nằm trong transaction của lần lưu (xem `detachFromTransaction`).
 * Lần lưu thứ N trong cửa sổ debounce chỉ đẩy `waitUntil` của job đã xếp ra sau `debounceMs` kể từ lần lưu cuối.
 */
export async function queueTranslation(req: PayloadRequest, input: TranslateContentInput, options: EnqueueTranslationOptions = {}): Promise<void> {
  const { debounceMs = TRANSLATION_DEBOUNCE_MS, now = () => new Date() } = options;
  const waitUntil = new Date(now().getTime() + debounceMs);
  const pending = await findPendingJob(req, input);
  if (pending) {
    await preserveRequestLocale(req, () =>
      req.payload.update({ collection: "payload-jobs", id: pending.id, data: { waitUntil: waitUntil.toISOString() }, depth: 0, overrideAccess: true, req }),
    );
    return;
  }
  await req.payload.jobs.queue({ task: TRANSLATE_CONTENT_SLUG, input, waitUntil, req });
}

interface ChangeArgs {
  req: PayloadRequest;
  target: TranslationTargetRef;
  doc: Doc;
  context: Record<string, unknown>;
  options: EnqueueTranslationOptions;
}

/**
 * Bản sao của `req` không mang `transactionID`: mọi truy vấn của nó chạy trên kết nối riêng, NGOÀI transaction của lần lưu. Lý do: trên Postgres một câu lệnh lỗi
 * (vd bảng job thiếu, enum lỗi thời, mất kết nối) làm hỏng (abort) cả transaction, nên nếu việc xếp job nằm trong đó thì `try/catch` ở `queueSafely` không cứu được lần lưu.
 * Đánh đổi: lần lưu rollback sau đó vẫn để lại job; job chạy thấy `sourceHash` không đổi → `unchanged`, không tốn tiền. Bản sao cũng cách ly `locale` với request gốc.
 */
function detachFromTransaction(req: PayloadRequest): PayloadRequest {
  return { ...req, transactionID: undefined } as PayloadRequest;
}

/**
 * Quyết định có xếp job dịch sau một lần lưu không. KHÔNG xếp khi: lần ghi do chính job dịch (không vòng lặp), request ghi locale `en` (sửa bản EN không kích
 * hoạt dịch lại), bản vi chưa xuất bản (nháp/ẩn/xoá mềm), `translationEnabled = false`, hoặc không có gì để làm (không trường nào đổi so với `sourceHash`
 * đã lưu và bản ghi không ở trạng thái `none`/`failed`). Trường hợp `enSource = manual` mà nguồn đổi vẫn xếp: job đặt `viChangedAfterManual`, không dịch.
 */
async function maybeQueue({ req, target, doc, context, options }: ChangeArgs): Promise<void> {
  if (context[TRANSLATION_JOB_CONTEXT_KEY] === true || req.locale === "en") return;
  if (!isPublishedForTranslation(target, doc)) return;
  const stored = readStoredTranslation(doc);
  const changed = hasSourceChanged(stored.sourceHash, computeSourceHash(req.payload, target, doc));
  const needsFirstOrRetry = stored.enSource !== "manual" && (stored.status === undefined || stored.status === "none" || stored.status === "failed");
  if (!changed && !needsFirstOrRetry) return;
  const outsideTransaction = detachFromTransaction(req);
  if (!(await isTranslationEnabled(outsideTransaction))) return;
  await queueTranslation(outsideTransaction, { kind: target.kind, slug: target.slug, docId: target.kind === "collection" ? String(doc.id) : undefined }, options);
}

/**
 * Dịch là việc phụ (D7: lỗi dịch không được làm hỏng nội dung): lỗi khi xếp job chỉ được log (tên lỗi, không nội dung), lần lưu vẫn thành công (việc xếp job chạy ngoài transaction của lần lưu, xem `detachFromTransaction`). Lần lưu sau
 * thấy hash lệch (hoặc trạng thái `failed`/`none`) sẽ xếp lại. Cũng là lý do cấu hình thiếu `site-settings`/task dịch (fixture test) không làm vỡ hook.
 */
async function queueSafely(args: ChangeArgs): Promise<void> {
  try {
    await maybeQueue(args);
  } catch (error) {
    args.req.payload.logger?.warn({ errorName: error instanceof Error ? error.name : "UnknownError", slug: args.target.slug }, "Dịch: không xếp được job dịch sau khi lưu");
  }
}

export function createEnqueueTranslation(options: EnqueueTranslationOptions = {}) {
  const collectionAfterChange: CollectionAfterChangeHook = async ({ doc, req, collection, context }) => {
    if (isTranslatableCollection(collection.slug)) await queueSafely({ req, target: { kind: "collection", slug: collection.slug }, doc, context, options });
    return doc;
  };
  const globalAfterChange: GlobalAfterChangeHook = async ({ doc, req, global, context }) => {
    if (isTranslatableGlobal(global.slug)) await queueSafely({ req, target: { kind: "global", slug: global.slug }, doc, context, options });
    return doc;
  };
  return { collectionAfterChange, globalAfterChange };
}

export const enqueueTranslation = createEnqueueTranslation();
