import type { PropertyPost } from "../../payload-types";

/**
 * Phân loại tin BĐS (BL-052 `/tin-bds`) — MỘT nguồn cho thẻ danh sách (`toPostCardData`) và trang chi tiết (`toPostDetailSpecs`), để một tin không là
 * "voucher" ở thẻ nhưng "BĐS" ở chi tiết. Thuần (chỉ type), dùng được ở mọi nơi.
 */

const hasText = (value: string | null | undefined): value is string => typeof value === "string" && value.trim() !== "";
const positive = (value: number | null | undefined): number | null => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);

/** Hạn ưu đãi hợp lệ (parse được) hoặc `null`. */
export function validOfferEndAt(post: Pick<PropertyPost, "offer">): string | null {
  const endAt = post.offer?.endAt;
  return hasText(endAt) && !Number.isNaN(new Date(endAt).getTime()) ? endAt : null;
}

/** Tin có ưu đãi: hạn ưu đãi hợp lệ hoặc mã voucher. */
export function hasPostOffer(post: Pick<PropertyPost, "offer">): boolean {
  return validOfferEndAt(post) !== null || hasText(post.offer?.voucherCode);
}

/** Tin voucher: có ưu đãi VÀ không có giá (`priceVnd`) lẫn diện tích (`areaM2`) dương → thẻ / thanh thông số theo ưu đãi thay vì giá / diện tích. */
export function isVoucherPost(post: Pick<PropertyPost, "offer" | "priceVnd" | "areaM2">): boolean {
  return hasPostOffer(post) && positive(post.priceVnd) === null && positive(post.areaM2) === null;
}
