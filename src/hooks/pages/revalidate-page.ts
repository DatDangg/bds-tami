import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { internalPath, LEGAL_PAGE_ROUTES } from "../../lib/content/content-paths";
import { locales } from "../../i18n/routing";
import { isPubliclyVisible, revalidateWithNext, type RevalidatePaths } from "../revalidate-content";

/** Đường dẫn nội bộ vi + en của trang pháp lý theo `kind` (route cố định, không slug). */
function legalPagePaths(kind: unknown): string[] {
  const route = LEGAL_PAGE_ROUTES[kind as keyof typeof LEGAL_PAGE_ROUTES];
  return route ? locales.map((locale) => internalPath(route, locale)) : [];
}

/**
 * Làm mới cache trang pháp lý khi bản ghi đang hoặc vừa hiển thị công khai (xuất bản, ẩn, xoá mềm, khôi phục, đổi nội dung).
 * Không dùng `createRevalidateContent` vì nó dựng đường dẫn từ slug còn `pages` không có slug.
 */
export function createRevalidatePage(revalidate: RevalidatePaths = revalidateWithNext) {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPubliclyVisible(doc, ["published"]) || isPubliclyVisible(previousDoc, ["published"])) {
      await revalidate(legalPagePaths(doc.kind), req);
    }
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPubliclyVisible(doc, ["published"])) await revalidate(legalPagePaths(doc.kind), req);
    return doc;
  };
  return { afterChange, afterDelete };
}
