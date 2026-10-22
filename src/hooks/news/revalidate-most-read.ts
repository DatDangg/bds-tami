import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { NEWS_MOST_READ_TAG } from "../../lib/news/news-cache-tags";
import { isPubliclyVisible } from "../revalidate-content";
import { type RevalidateTags, revalidateTagsWithNext } from "../revalidate-global";

/**
 * Khối "Đọc nhiều" cache tới 10 phút (`loadMostReadNews`): bài đang hoặc vừa công khai đổi (xuất bản, sửa tiêu đề / ảnh, ẩn,
 * xoá mềm, xoá hẳn) thì làm mới tag ngay, để bài đã ẩn không còn nằm trong top. Sửa bản nháp thì không.
 */
export function createRevalidateMostRead(tags: RevalidateTags = revalidateTagsWithNext) {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPubliclyVisible(doc, ["published"]) || isPubliclyVisible(previousDoc, ["published"])) {
      await tags([NEWS_MOST_READ_TAG], req);
    }
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPubliclyVisible(doc, ["published"])) await tags([NEWS_MOST_READ_TAG], req);
    return doc;
  };
  return { afterChange, afterDelete };
}
