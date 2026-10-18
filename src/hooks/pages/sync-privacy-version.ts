import { APIError, type CollectionAfterChangeHook } from "payload";

import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";

export const MISSING_SITE_NAME_MESSAGE =
  "Chưa điền \"Tên website\" (siteName, bản tiếng Việt) ở Cài đặt chung (site-settings). Điền và lưu mục đó trước khi xuất bản Chính sách bảo mật.";

/**
 * Bản `privacy` đang `published` là nguồn của `site-settings.privacyPolicyVersion` = `consentVersion` của form (BR-30):
 * lead/hồ sơ lưu đúng phiên bản chính sách khách đã thấy lúc đồng ý. Ghi bằng `overrideAccess` (trường đó `update: denyAll`) và
 * `req` của thao tác (cùng transaction: lưu trang lỗi thì phiên bản không đổi). Chưa điền `siteName` ở site-settings thì báo lỗi 400 rõ ràng
 * (nếu không `updateGlobal` ném lỗi validate `siteName` khó hiểu giữa lúc xuất bản trang). `updateGlobal` tự gọi hook làm mới tag
 * `global:site-settings` của chính global.
 *
 * Gỡ xuất bản / ẩn / xoá bản `privacy` KHÔNG xoá phiên bản: các consent đã lưu vẫn trỏ về phiên bản cuối đã công khai, và form
 * không được ghi `consentVersion` rỗng trong lúc admin sửa lại chính sách. Phiên bản chỉ đổi khi bản `privacy` được xuất bản (lại) với `version` khác.
 */
export const syncPrivacyPolicyVersion: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (doc.kind !== "privacy" || doc.status !== "published" || doc.deletedAt || !doc.version) return doc;

  // `locale: "vi"` cố định: `siteName` bắt buộc theo locale, nên không ghi theo locale `en` của request.
  const { payload } = req;
  await preserveRequestLocale(req, async () => {
    const current = await payload.findGlobal({ slug: "site-settings", locale: "vi", depth: 0, overrideAccess: true, req });
    if (current.privacyPolicyVersion === doc.version) return;
    if (!current.siteName) throw new APIError(MISSING_SITE_NAME_MESSAGE, 400, undefined, true);
    await payload.updateGlobal({
      slug: "site-settings",
      data: { privacyPolicyVersion: doc.version },
      locale: "vi",
      depth: 0,
      overrideAccess: true,
      req,
    });
  });
  return doc;
};
