/**
 * Mã mục (tab dính) của trang chi tiết Đăng tin BĐS theo thứ tự hiển thị (BL-052 "Chi tiết Tin BĐS", cùng khung chi tiết Dự án / Cho thuê): Tổng quan (nội dung + lưới
 * thông tin) · Ưu đãi (cạnh cột liên hệ) rồi các dải Vị trí · Hình ảnh, cuối trang "Tin liên quan". Ảnh bìa là nền hero nên không có mục riêng.
 */
export const POST_SECTION_IDS = ["overview", "offer", "location", "gallery", "related"] as const;
export type PostSectionId = (typeof POST_SECTION_IDS)[number];

interface PostSectionPresence {
  hasOffer: boolean;
  hasLocation: boolean;
  hasGallery: boolean;
  hasRelated: boolean;
}

/** Mục có dữ liệu mới vào thanh tab (cùng điều kiện dựng khối trong `PostDetail`). Tổng quan luôn có. */
export function visiblePostSections(presence: PostSectionPresence): PostSectionId[] {
  const present: Record<PostSectionId, boolean> = {
    overview: true,
    offer: presence.hasOffer,
    location: presence.hasLocation,
    gallery: presence.hasGallery,
    related: presence.hasRelated,
  };
  return POST_SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích thanh tab và neo `#...`), không dịch theo ngôn ngữ. */
export const POST_SECTION_DOM_ID: Record<PostSectionId, string> = {
  overview: "overview",
  offer: "offer",
  location: "location",
  gallery: "gallery",
  related: "related",
};
