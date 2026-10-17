import type { CollectionAfterChangeHook } from "payload";

import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";

/**
 * Bản `privacy` đang `published` là nguồn của `site-settings.privacyPolicyVersion` = `consentVersion` của form (BR-30):
 * lead/hồ sơ lưu đúng phiên bản chính sách khách đã thấy lúc đồng ý. Ghi bằng `overrideAccess` (trường đó `update: denyAll`) và
 * `req` của thao tác (cùng transaction: lưu trang lỗi thì phiên bản không đổi). `updateGlobal` tự gọi hook làm mới tag
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
