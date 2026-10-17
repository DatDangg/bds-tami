import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { locales, type pathnames } from "../../i18n/routing";
import { internalPath } from "../../lib/content/content-paths";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { revalidateWithNext, type RevalidatePaths } from "../revalidate-content";
import type { CategoryScope } from "./scope-collections";

type PathnameKey = keyof typeof pathnames;

/**
 * Trang công khai phụ thuộc danh mục của từng scope (ERD §2): danh sách của loại nội dung (chip/tab danh mục nằm ở đây) và trang
 * danh mục (`/danh-muc/[category]`, chỉ ba loại có). Scope chưa có trang thì chỉ làm mới danh sách khi trang đó được làm.
 */
const SCOPE_PAGES: Record<CategoryScope, { list: PathnameKey; category?: PathnameKey }> = {
  news: { list: "/tin-tuc", category: "/tin-tuc/danh-muc/[category]" },
  rental: { list: "/cho-thue", category: "/cho-thue/danh-muc/[category]" },
  property_post: { list: "/tin-bds", category: "/tin-bds/danh-muc/[category]" },
  project: { list: "/du-an" },
  job: { list: "/tuyen-dung" },
};

const isScope = (value: unknown): value is CategoryScope => typeof value === "string" && Object.hasOwn(SCOPE_PAGES, value);

const slugList = (...values: unknown[]): string[] => values.filter((value): value is string => typeof value === "string" && value !== "");

/** Đường dẫn nội bộ (xem `internalPath`) cần làm mới khi một danh mục đổi: danh sách + trang danh mục (mọi slug, cả vi và en). */
export function categoryPaths(scope: CategoryScope, slugs: { vi: string[]; en: string[] }): string[] {
  const pages = SCOPE_PAGES[scope];
  const paths: string[] = locales.map((locale) => internalPath(pages.list, locale));
  const { category } = pages;
  if (category) {
    for (const locale of locales) for (const slug of slugs[locale]) paths.push(internalPath(category, locale, slug));
  }
  return [...new Set(paths)];
}

/**
 * Hook `afterChange`/`afterDelete` của `categories` (collection `route: null` nên không có hook làm mới chung): sửa/đổi tên/đổi slug/
 * xoá mềm/khôi phục danh mục làm mới danh sách và trang danh mục của loại nội dung, vì tab và tiêu đề danh mục hiện ở đó.
 * Mọi thay đổi đều làm mới (danh mục không có `status`): tên đổi cũng phải lên web ngay.
 */
export function createRevalidateCategory(revalidate: RevalidatePaths = revalidateWithNext) {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (!isScope(doc.scope)) return doc;
    // `doc` chỉ mang slug của locale request; slug locale còn lại phải đọc thêm.
    const allLocales = await preserveRequestLocale(req, () =>
      req.payload.findByID({ collection: "categories", id: doc.id, locale: "all", depth: 0, trash: true, overrideAccess: true, select: { slug: true }, req }),
    );
    const slugs = (allLocales as { slug?: { vi?: string | null; en?: string | null } | null }).slug ?? {};
    const previousSlug = req.locale && req.locale !== "all" ? previousDoc?.slug : undefined;
    await revalidate(
      categoryPaths(doc.scope, {
        vi: slugList(slugs.vi, req.locale === "vi" ? previousSlug : undefined),
        en: slugList(slugs.en, req.locale === "en" ? previousSlug : undefined),
      }),
      req,
    );
    return doc;
  };

  // Xoá hẳn: `doc` chỉ có slug của locale request, locale kia chỉ làm mới danh sách.
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (!isScope(doc.scope)) return doc;
    const locale = req.locale === "en" ? "en" : "vi";
    await revalidate(categoryPaths(doc.scope, { vi: [], en: [], [locale]: slugList(doc.slug) }), req);
    return doc;
  };

  return { afterChange, afterDelete };
}
