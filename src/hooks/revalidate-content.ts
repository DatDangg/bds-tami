import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionSlug, PayloadRequest } from "payload";

import { type ContentRoute, contentPaths } from "../lib/content/content-paths";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";
import type { ContentDoc } from "./content-doc";

/** Làm mới cache các đường dẫn nội bộ của trang. Tách ra để test thay bằng bản ghi nhận. */
export type RevalidatePaths = (paths: string[], req: PayloadRequest) => Promise<void> | void;

/**
 * Mặc định: `revalidatePath` của Next. Ngoài ngữ cảnh Next (job, script, test) hàm này ném lỗi vì thiếu work store;
 * khi đó chỉ ghi cảnh báo, không làm hỏng thao tác lưu nội dung (cache hết hạn theo `s-maxage=60`, ARCHITECTURE §5.1).
 */
export const revalidateWithNext: RevalidatePaths = async (paths, req) => {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const path of paths) revalidatePath(path);
  } catch (error) {
    req.payload.logger.warn({ err: error, paths }, "Không làm mới được cache trang công khai (ngoài ngữ cảnh Next)");
  }
};

export interface RevalidateContentOptions {
  route: ContentRoute;
  /** Trạng thái khách thấy được (mặc định chỉ `published`; `rentals` thêm `rented`). */
  publicStatuses?: readonly string[];
  revalidate?: RevalidatePaths;
}


export function isPubliclyVisible(doc: ContentDoc | undefined, publicStatuses: readonly string[]): boolean {
  return Boolean(doc) && !doc?.deletedAt && publicStatuses.includes(String(doc?.status));
}

function slugList(...values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === "string" && value !== "");
}

/**
 * Hook `afterChange`/`afterDelete` làm mới cache trang công khai cho CẢ vi và en (ARCHITECTURE §5.1):
 * chi tiết (gồm slug cũ nếu vừa đổi), danh sách, và trang chủ khi bài nổi bật. Chỉ chạy khi bản ghi đang hoặc
 * vừa hiển thị công khai (xuất bản, ẩn, xoá mềm, khôi phục, đổi slug). Đường dẫn là đường dẫn nội bộ `/${locale}...` (xem `internalPath`).
 */
export function createRevalidateContent(options: RevalidateContentOptions) {
  const { route, publicStatuses = ["published"], revalidate = revalidateWithNext } = options;

  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req, collection }) => {
    const visibleNow = isPubliclyVisible(doc, publicStatuses);
    const visibleBefore = isPubliclyVisible(previousDoc, publicStatuses);
    if (!visibleNow && !visibleBefore) return doc;

    // `doc` chỉ mang locale của request; slug của locale còn lại phải đọc thêm.
    const allLocales = await preserveRequestLocale(req, () =>
      req.payload.findByID({
        collection: collection.slug as CollectionSlug,
        id: doc.id,
        locale: "all",
        depth: 0,
        trash: true,
        overrideAccess: true,
        // Slug collection là động nên kiểu `select` theo collection không suy ra được.
        select: { slug: true } as never,
        req,
      }),
    );
    const slugs = (allLocales as { slug?: { vi?: string | null; en?: string | null } | null }).slug ?? {};
    const previousSlug = req.locale && req.locale !== "all" ? previousDoc?.slug : undefined;
    const paths = contentPaths(route, {
      slugs: {
        vi: slugList(slugs.vi, req.locale === "vi" ? previousSlug : undefined),
        en: slugList(slugs.en, req.locale === "en" ? previousSlug : undefined),
      },
      featured: Boolean(doc.isFeatured || previousDoc?.isFeatured),
    });
    await revalidate(paths, req);
    return doc;
  };

  // Xoá hẳn một bản đang công khai (không qua xoá mềm): `doc` chỉ có slug của locale request, locale kia chỉ làm mới danh sách.
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (!isPubliclyVisible(doc, publicStatuses)) return doc;
    const locale = req.locale === "en" ? "en" : "vi";
    await revalidate(
      contentPaths(route, { slugs: { [locale]: slugList(doc.slug) }, featured: Boolean(doc.isFeatured) }),
      req,
    );
    return doc;
  };

  return { afterChange, afterDelete };
}
