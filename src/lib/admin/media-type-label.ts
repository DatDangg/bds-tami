const TYPE_NAMES: Record<string, string> = { image: "Ảnh", video: "Video" };

/**
 * Nhãn loại tệp dễ đọc cho ô lưới Thư viện (BL-051 A9): `image/webp` → "Ảnh · WEBP", `application/pdf` → "PDF", `video/mp4` → "Video · MP4".
 * Không nhận ra / trống → chuỗi trống để ô không hiện gì.
 */
export function mediaTypeLabel(mimeType: unknown): string {
  if (typeof mimeType !== "string") return "";
  const [group, subtype = ""] = mimeType.toLowerCase().split("/");
  if (!group || !subtype) return "";
  const format = subtype === "jpeg" ? "JPG" : subtype.toUpperCase();
  const name = TYPE_NAMES[group];
  return name ? `${name} · ${format}` : format;
}
