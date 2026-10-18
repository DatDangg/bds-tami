import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from "payload";

import { writeAuditLog } from "../../lib/audit/write-audit-log";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { readStoredTranslation } from "../translation/compute-source-hash";
import { hasManualEnglishEdit } from "../translation/detect-manual-en";
import { leavesOfDoc, TRANSLATION_JOB_CONTEXT_KEY, type TranslationTargetRef } from "../translation/translation-targets";

/** Cờ `req.context` do endpoint duyệt đặt: dấu hiệu DUY NHẤT cho phép `hasEnglish` của trang pháp lý chuyển false -> true. */
export const APPROVE_ENGLISH_CONTEXT_KEY = "approveEnglish";

type Doc = Record<string, unknown>;

/**
 * Bản `en` "trước" và "sau" của lần ghi này, hoặc `null` khi request không động tới bản `en`. Ghi locale `en`: `originalDoc` đã là bản `en`.
 * Ghi locale `all` (chỉ Local API/script): lấy nhánh `en` của từng trường trong `data` và đọc bản `en` đã lưu. Ghi locale `vi` không đổi bản `en`.
 */
async function englishBeforeAfter(req: PayloadRequest, data: Doc, originalDoc: Doc): Promise<{ before: Doc; after: Doc } | null> {
  if (req.locale === "en") return { before: originalDoc, after: data };
  if (req.locale !== "all") return null;
  const after: Doc = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null && "en" in value) after[key] = (value as { en: unknown }).en;
  }
  const before = await preserveRequestLocale(req, () =>
    req.payload.findByID({ collection: "pages", id: originalDoc.id as string, locale: "en", fallbackLocale: false, trash: true, depth: 0, overrideAccess: true, req }),
  );
  return { before: before as unknown as Doc, after };
}

/**
 * Admin sửa tay nội dung EN (title/content) của trang pháp lý ĐÃ duyệt (BR-08): bản sửa chưa ai duyệt nên `hasEnglish` về `false` (ẩn `/en`) và
 * `translation.status = pending_review` tới khi duyệt lại qua `POST /api/admin/translations/pages/:id/approve`. Cùng tiêu chí "EN thật sự đổi" với
 * `detectManualEnglish` (chạy trước, đã đặt `enSource = manual`): gửi lại y nguyên, chỉ sửa VI hay trường không dịch (`version`, `effectiveDate`) không hạ.
 * Không hạ khi chính lệnh duyệt hoặc job dịch ghi (job tự hạ theo luồng riêng ở `translate-content-save.ts`).
 */
export const revokeEnglishOnManualEdit: CollectionBeforeChangeHook = async ({ data, originalDoc, req, context, collection }) => {
  if (originalDoc?.hasEnglish !== true || !data) return data;
  if (context[TRANSLATION_JOB_CONTEXT_KEY] === true || context[APPROVE_ENGLISH_CONTEXT_KEY] === true) return data;
  const english = await englishBeforeAfter(req, data, originalDoc);
  if (!english) return data;

  const target: TranslationTargetRef = { kind: "collection", slug: collection.slug };
  const edited = hasManualEnglishEdit(leavesOfDoc(req.payload, target, english.before), leavesOfDoc(req.payload, target, english.after), english.after);
  if (!edited) return data;

  const stored = (data.translation ?? originalDoc.translation ?? {}) as Doc;
  return { ...data, hasEnglish: false, translation: { ...stored, status: "pending_review" } };
};

/**
 * Chặn "duyệt ngầm" (BR-08): form admin mở sẵn còn giữ `hasEnglish = true` cũ sẽ gửi lại giá trị đó khi Lưu, sau khi job dịch đã hạ về false cho bản AI mới.
 * Mọi request không mang cờ duyệt mà đòi bật `hasEnglish` (REST, form, Local API) đều bị giữ nguyên giá trị đang lưu. Không chặn việc tắt (true -> false) và
 * không đụng lần ghi của job dịch (chỉ hạ về false).
 */
export const guardEnglishApproval: CollectionBeforeChangeHook = ({ data, originalDoc, context }) => {
  if (data?.hasEnglish !== true || originalDoc?.hasEnglish === true) return data;
  if (context[APPROVE_ENGLISH_CONTEXT_KEY] === true) return data;
  return { ...data, hasEnglish: originalDoc?.hasEnglish ?? false };
};

/**
 * Admin duyệt bản EN của trang pháp lý (BR-08): `hasEnglish` chuyển false -> true. Ghi audit `content.approve_translation` cùng transaction (fail-closed, PERMISSION §6)
 * và chuyển `translation.status` sang `done` (từ `pending_review`, `none`... kể cả bản EN admin sửa tay) (nhóm `translation` chỉ hệ thống ghi nên dùng `overrideAccess`).
 * Chỉ `isAdmin` được ghi `hasEnglish` (access trường), nên hook không tự kiểm vai trò. Chỉ tới được qua endpoint duyệt (xem `guardEnglishApproval`).
 */
export const approveEnglish: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, context, collection }) => {
  if (operation !== "update" || context[TRANSLATION_JOB_CONTEXT_KEY] === true) return doc;
  if (doc.hasEnglish !== true || previousDoc?.hasEnglish === true) return doc;

  await writeAuditLog({
    actor: req.user,
    action: "content.approve_translation",
    collection: collection.slug,
    docId: doc.id,
    summary: `Duyệt bản tiếng Anh ${collection.slug} ${String(doc.kind ?? doc.id)}`,
    req,
  });

  const stored = readStoredTranslation(doc);
  if (stored.status === "done") return doc;
  await preserveRequestLocale(req, () =>
    req.payload.update({
      collection: "pages",
      id: doc.id,
      data: { translation: { ...stored, status: "done" } } as never,
      depth: 0,
      overrideAccess: true,
      req,
      context: { [TRANSLATION_JOB_CONTEXT_KEY]: true },
    }),
  );
  return doc;
};
