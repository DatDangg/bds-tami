import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { PropertyPost, Rental } from "../../payload-types";
import { offerNotEndedWhere } from "../content/offer-status";
import { findPublicList } from "../content/public-queries";
import { POST_CARD_FIELDS } from "../posts/post-queries";
import { RENTAL_CARD_FIELDS, withCoverImages } from "../rentals/rental-queries";

/** Số thẻ mỗi nhóm của khối "Tin liên quan" trên chi tiết dự án (BL-020 P4). Không có link "Xem thêm": danh sách chưa lọc được theo dự án qua URL. */
export const PROJECT_LISTINGS_PER_GROUP = 4;

const LISTING_SORT = ["-publishedAt", "-createdAt"];

export interface ProjectListings {
  rentals: Rental[];
  posts: PropertyPost[];
}

/**
 * Tin cho thuê còn trống (`published`) và tin BĐS còn hạn thuộc dự án (`rentals.project`, `property-posts.relatedProject`, đều có index), mới nhất trước,
 * mỗi nhóm tối đa `PROJECT_LISTINGS_PER_GROUP`. Hai truy vấn chạy song song, đều qua `findPublicList` (đã xuất bản, chưa xoá mềm, `/en` chỉ tin có bản EN)
 * nên cùng quy tắc với trang danh sách. Thẻ cho thuê cần ảnh: `withCoverImages` lấy bằng 2 truy vấn gộp (không theo từng tin).
 * Chỉ tin cho thuê `published` (như "tin tương tự": không gợi ý căn đã thuê); bài ưu đãi đã kết thúc không đưa vào khối này.
 */
export async function findProjectListings(payload: Payload, locale: Locale, projectId: string, now: Date): Promise<ProjectListings> {
  const [rentalPage, postPage] = await Promise.all([
    findPublicList<Rental>(payload, "rentals", locale, {
      where: { and: [{ project: { equals: projectId } }, { status: { equals: "published" } }] },
      sort: LISTING_SORT,
      limit: PROJECT_LISTINGS_PER_GROUP,
      depth: 1,
      select: RENTAL_CARD_FIELDS,
    }),
    findPublicList<PropertyPost>(payload, "property-posts", locale, {
      where: { and: [{ relatedProject: { equals: projectId } }, offerNotEndedWhere(now)] },
      sort: LISTING_SORT,
      limit: PROJECT_LISTINGS_PER_GROUP,
      depth: 1,
      select: POST_CARD_FIELDS,
    }),
  ]);
  return { rentals: await withCoverImages(payload, rentalPage.docs, locale), posts: postPage.docs };
}
