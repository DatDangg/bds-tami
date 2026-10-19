import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import { CONTENT_ROUTES, internalPath } from "../../lib/content/content-paths";
import { locales } from "../../i18n/routing";
import { relationId } from "../../lib/payload/relation-id";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { isPubliclyVisible, type RevalidatePaths, revalidateWithNext } from "../revalidate-content";

interface ProjectListingOptions {
  /** Trường quan hệ tới dự án: `project` (tin cho thuê) hoặc `relatedProject` (tin BĐS). */
  field: "project" | "relatedProject";
  /** Trạng thái khách thấy được của collection (tin cho thuê thêm `rented`). */
  publicStatuses: readonly string[];
  revalidate?: RevalidatePaths;
}

/** Đường dẫn nội bộ chi tiết dự án (mọi slug của cả vi và en) cho các dự án này. Dự án đã xoá hẳn thì không có đường dẫn (bỏ qua). */
async function projectDetailPaths(req: PayloadRequest, projectIds: string[]): Promise<string[]> {
  const { docs } = await preserveRequestLocale(req, () =>
    req.payload.find({
      collection: "projects",
      where: { id: { in: projectIds } },
      locale: "all",
      depth: 0,
      pagination: false,
      trash: true,
      overrideAccess: true,
      select: { slug: true },
      req,
    }),
  );
  const paths = docs.flatMap((project) => {
    const slugs = (project as { slug?: Record<string, string | null> | string | null }).slug;
    if (!slugs || typeof slugs === "string") return [];
    return locales.flatMap((locale) => (slugs[locale] ? [internalPath(CONTENT_ROUTES.projects.detail, locale, slugs[locale])] : []));
  });
  return [...new Set(paths)];
}

/**
 * Khối "Tin liên quan" của chi tiết dự án (BL-020 P4) hiện tin cho thuê / tin BĐS thuộc dự án, nên khi một tin đang hoặc vừa công khai đổi
 * (xuất bản, sửa, ẩn, xoá, ĐỔI DỰ ÁN) thì làm mới trang chi tiết của dự án MỚI lẫn dự án CŨ (cả vi và en). Chỉ đường dẫn của đúng các dự án đó, không
 * đụng danh sách hay trang chủ. Tin chưa từng công khai (nháp sửa tiếp) không làm gì.
 */
export function createRevalidateProjectOnListing({ field, publicStatuses, revalidate = revalidateWithNext }: ProjectListingOptions) {
  const refresh = async (req: PayloadRequest, ...docs: Array<Record<string, unknown> | undefined>) => {
    const projectIds = [...new Set(docs.flatMap((doc) => relationId(doc?.[field]) ?? []))];
    if (projectIds.length === 0) return;
    const paths = await projectDetailPaths(req, projectIds);
    if (paths.length > 0) await revalidate(paths, req);
  };

  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPubliclyVisible(doc, publicStatuses) || isPubliclyVisible(previousDoc, publicStatuses)) await refresh(req, doc, previousDoc);
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPubliclyVisible(doc, publicStatuses)) await refresh(req, doc);
    return doc;
  };
  return { afterChange, afterDelete };
}
