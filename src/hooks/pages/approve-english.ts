import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from "payload";

import { writeAuditLog } from "../../lib/audit/write-audit-log";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { readStoredTranslation } from "../translation/compute-source-hash";
import { TRANSLATION_JOB_CONTEXT_KEY } from "../translation/translation-targets";

/** Cờ `req.context` do endpoint duyệt đặt: dấu hiệu DUY NHẤT cho phép `hasEnglish` của trang pháp lý chuyển false -> true. */
export const APPROVE_ENGLISH_CONTEXT_KEY = "approveEnglish";

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
