import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { isPubliclyVisible } from "../revalidate-content";
import { type HomepageRevalidators, revalidateHomepage } from "./revalidate-homepage";

/**
 * Thẻ Dịch vụ nằm trên trang chủ (ERD §4.15 `homepage.services`): lưu/xoá dịch vụ đang hoặc vừa công khai thì làm mới trang chủ.
 * `isFeatured` của dịch vụ bị omit nên hook dùng chung `createRevalidateContent` không chạm trang chủ.
 */
export function createRevalidateHomepageOnService(revalidators?: HomepageRevalidators) {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPubliclyVisible(doc, ["published"]) || isPubliclyVisible(previousDoc, ["published"])) {
      await revalidateHomepage(req, revalidators);
    }
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPubliclyVisible(doc, ["published"])) await revalidateHomepage(req, revalidators);
    return doc;
  };
  return { afterChange, afterDelete };
}

/**
 * Dự án và ưu đãi (property-posts) chọn tay vào trang chủ: bản ghi đang công khai bị ẩn, xoá mềm hoặc xoá hẳn thì làm mới trang chủ ngay
 * (tag + `/vi` `/en`), không để bản đã ẩn còn hiện tới hết ISR 60s. Chỉ phản ứng khi bản ghi RỜI trạng thái công khai: xuất bản/sửa bài
 * không nổi bật không chạm trang chủ (bài nổi bật đã được `createRevalidateContent` làm mới).
 */
export function createRevalidateHomepageOnUnpublish(revalidators?: HomepageRevalidators) {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPubliclyVisible(previousDoc, ["published"]) && !isPubliclyVisible(doc, ["published"])) {
      await revalidateHomepage(req, revalidators);
    }
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPubliclyVisible(doc, ["published"])) await revalidateHomepage(req, revalidators);
    return doc;
  };
  return { afterChange, afterDelete };
}
