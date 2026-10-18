import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook, PayloadRequest } from "payload";

import { hashLeafValue, type TranslatableLeaf } from "../../lib/translation/leaves";
import { isFilled } from "../require-english-fields";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { computeSourceHash } from "./compute-source-hash";
import { isTranslatableCollection, isTranslatableGlobal, leavesOfDoc, TRANSLATION_JOB_CONTEXT_KEY, type TranslationTargetRef } from "./translation-targets";

type Doc = Record<string, unknown>;

/** Bản `vi` hiện tại (đọc riêng vì request đang ghi ở locale `en`; `trash` để bản xoá mềm cũng đọc được). */
async function readViDoc(req: PayloadRequest, target: TranslationTargetRef, id: string | number | undefined): Promise<Doc | null> {
  const options = { locale: "vi", fallbackLocale: false, depth: 0, overrideAccess: true, req } as const;
  return preserveRequestLocale(req, async () => {
    if (target.kind === "global") return (await req.payload.findGlobal({ slug: target.slug as never, ...options })) as unknown as Doc;
    if (id === undefined) return null;
    return (await req.payload.findByID({ collection: target.slug as never, id, trash: true, ...options })) as unknown as Doc | null;
  });
}

/**
 * Có trường chữ EN nào bị người sửa không. `""`, `null` và thiếu coi như nhau (form gửi `""` cho trường chưa nhập không phải sửa tay). Trường đã có chữ mà giờ
 * trống/khác → sửa tay. Trường có trong bản đã lưu nhưng KHÔNG có trong `data` chỉ tính là bị xoá khi trường cấp cao của nó có trong `data` (PATCH một phần như
 * `{ title }` không được làm trường khác thành "xoá"). Quyết định: xoá trắng chữ EN đã có = sửa tay (admin chủ động bỏ bản dịch, job không tự dịch lại; "Dịch lại bằng AI" = force).
 */
export function hasManualEnglishEdit(beforeLeaves: readonly TranslatableLeaf[], afterLeaves: readonly TranslatableLeaf[], data: Doc): boolean {
  const filledHash = (leaf: TranslatableLeaf | undefined) => (leaf && isFilled(leaf.value) ? hashLeafValue(leaf.value) : undefined);
  const before = new Map(beforeLeaves.map((leaf) => [leaf.key, leaf]));
  const after = new Map(afterLeaves.map((leaf) => [leaf.key, leaf]));
  for (const [key, leaf] of after) {
    if (filledHash(before.get(key)) !== filledHash(leaf)) return true;
  }
  return beforeLeaves.some((leaf) => !after.has(leaf.key) && isFilled(leaf.value) && String(leaf.path[0]) in data);
}

interface DetectArgs {
  req: PayloadRequest;
  target: TranslationTargetRef;
  data: Doc;
  originalDoc: Doc | undefined;
  context: Record<string, unknown>;
}

/**
 * Người (không phải job dịch) sửa bản `en` của một trường chữ được phép dịch → `translation.enSource = manual` (BR-08): từ đó job không dịch đè.
 * Chỉ xét request ghi locale `en` và chỉ khi có trường dịch được thật sự KHÁC bản `en` đã lưu (form admin gửi lại cả bản ghi nên không so thì mọi lần
 * lưu `en` đều thành "sửa tay"). `sourceHash` được đặt lại bằng bản `vi` hiện tại (người sửa tay đã nhìn bản `vi` mới nhất) và `viChangedAfterManual`
 * về `false`; nếu `vi` đổi tiếp sau đó, job đặt cờ để admin biết bản `en` có thể lỗi thời. Ghi `locale = all` không được nhận diện ở đây
 * (collection có `slug` đã từ chối locale `all`; global ghi `all` chỉ do script nội bộ).
 */
async function detectManual({ req, target, data, originalDoc, context }: DetectArgs): Promise<Doc> {
  if (context[TRANSLATION_JOB_CONTEXT_KEY] === true || req.locale !== "en" || !originalDoc) return data;
  const edited = hasManualEnglishEdit(leavesOfDoc(req.payload, target, originalDoc), leavesOfDoc(req.payload, target, data), data);
  if (!edited) return data;

  const vi = await readViDoc(req, target, originalDoc.id as string | number | undefined);
  const stored = (originalDoc.translation ?? {}) as Doc;
  return {
    ...data,
    translation: { ...stored, enSource: "manual", viChangedAfterManual: false, sourceHash: computeSourceHash(req.payload, target, vi) },
  };
}

export const detectManualEnglish: CollectionBeforeChangeHook = async ({ data, originalDoc, req, collection, context }) => {
  if (!isTranslatableCollection(collection.slug)) return data;
  return detectManual({ req, target: { kind: "collection", slug: collection.slug }, data, originalDoc, context });
};

export const detectManualEnglishGlobal: GlobalBeforeChangeHook = async ({ data, originalDoc, req, global, context }) => {
  if (!isTranslatableGlobal(global.slug)) return data;
  return detectManual({ req, target: { kind: "global", slug: global.slug }, data, originalDoc, context });
};
