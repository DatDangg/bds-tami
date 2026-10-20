import { APIError, type CollectionBeforeDeleteHook } from "payload";

/** Collection nội dung có trường `ward` trỏ tới phường/xã. */
const WARD_REFERENCING_COLLECTIONS = [
  { slug: "rentals", label: "tin cho thuê" },
  { slug: "property-posts", label: "tin bất động sản" },
] as const;

/**
 * Chặn xoá phường/xã còn tin tham chiếu. `rentals.ward_id` là NOT NULL còn FK là `ON DELETE SET NULL`, nên nếu cứ xoá thì Postgres báo lỗi
 * ràng buộc (500 khó hiểu); `property-posts.ward_id` tuỳ chọn nhưng xoá sẽ âm thầm xoá khu vực của tin. Tính cả tin đã xoá mềm (thùng rác
 * vẫn giữ tham chiếu).
 */
export const blockDeleteWhileHasRentals: CollectionBeforeDeleteHook = async ({ id, req }) => {
  for (const { slug, label } of WARD_REFERENCING_COLLECTIONS) {
    // Một số config test chỉ nạp một phần collection.
    if (!req.payload.collections[slug]) continue;
    const { totalDocs } = await req.payload.count({
      collection: slug,
      where: { ward: { equals: id } },
      trash: true,
      overrideAccess: true,
      req,
    });
    if (totalDocs > 0) {
      throw new APIError(`Không xoá được phường/xã đang có ${totalDocs} ${label}. Hãy chuyển các tin sang phường/xã khác trước.`, 409, undefined, true);
    }
  }
};
