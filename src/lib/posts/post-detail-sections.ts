/** Mã mục của thanh mục con trang chi tiết Đăng tin BĐS, theo thứ tự hiển thị (design-spec S09). Ảnh bìa nằm đầu trang nên không có mục riêng. */
export const POST_SECTION_IDS = ["overview", "offer", "content", "gallery"] as const;
export type PostSectionId = (typeof POST_SECTION_IDS)[number];

interface PostSectionPresence {
  hasOffer: boolean;
  hasContent: boolean;
  hasGallery: boolean;
}

/** Mục có dữ liệu mới vào thanh mục con (cùng điều kiện dựng khối trong `PostDetail`). Tổng quan luôn có: nó chứa tiêu đề bài. */
export function visiblePostSections(presence: PostSectionPresence): PostSectionId[] {
  const present: Record<PostSectionId, boolean> = {
    overview: true,
    offer: presence.hasOffer,
    content: presence.hasContent,
    gallery: presence.hasGallery,
  };
  return POST_SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích thanh mục con và neo `#...`), không dịch theo ngôn ngữ. */
export const POST_SECTION_DOM_ID: Record<PostSectionId, string> = {
  overview: "overview",
  offer: "offer",
  content: "content",
  gallery: "gallery",
};
