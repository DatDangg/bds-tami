import { APIError, type CollectionBeforeDeleteHook } from "payload";

/**
 * Chặn xoá phường/xã còn tin cho thuê tham chiếu. `rentals.ward_id` là NOT NULL còn FK là `ON DELETE SET NULL`, nên nếu cứ xoá
 * thì Postgres báo lỗi ràng buộc (500 khó hiểu). Tính cả tin đã xoá mềm (thùng rác vẫn giữ tham chiếu).
 */
export const blockDeleteWhileHasRentals: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (!req.payload.collections.rentals) return;
  const { totalDocs } = await req.payload.count({
    collection: "rentals",
    where: { ward: { equals: id } },
    trash: true,
    overrideAccess: true,
    req,
  });
  if (totalDocs > 0) {
    throw new APIError(`Không xoá được phường/xã đang có ${totalDocs} tin cho thuê. Hãy chuyển các tin sang phường/xã khác trước.`, 409, undefined, true);
  }
};
