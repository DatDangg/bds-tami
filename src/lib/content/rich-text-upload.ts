import type { MediaImage } from "@/components/media/ResponsiveImage";

/** Media của node `upload` Lexical mà `RichText` dựng được thành ảnh. */
export type RenderableUploadMedia = MediaImage & { height?: number | null; caption?: string | null; mimeType?: string | null };

/**
 * Tiêu chí DUY NHẤT cho "node upload có hiển thị được không" (BL-057): `RichText.renderUpload` (dựng ảnh) và
 * `rich-text-lead.splitOverview` (đếm nội dung thêm cho nút "Xem thêm") cùng dùng, để media đã xoá / chưa populate /
 * không phải ảnh / collection khác không bị tính là nội dung rồi mở ra trống.
 * Điều kiện: `relationTo === "media"`, value đã populate (object) có `url`, `mimeType` rỗng hoặc `image/*`.
 */
export function renderableUploadImage(node: { relationTo?: unknown; value?: unknown }): RenderableUploadMedia | null {
  if (node.relationTo !== "media") return null;
  const value = node.value;
  if (typeof value !== "object" || value === null) return null;
  const media = value as RenderableUploadMedia;
  if (!media.url) return null;
  if (media.mimeType && !media.mimeType.startsWith("image/")) return null;
  return media;
}
