const FALLBACK_NAME = "download";
const MAX_NAME_LENGTH = 120;

/** Giữ lại ASCII an toàn cho tham số `filename=`: mọi ký tự khác (dấu nháy, `;`, `/`, `\`, CR/LF, Unicode) thành `_`. */
function asciiFallbackName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, MAX_NAME_LENGTH);
  return cleaned || FALLBACK_NAME;
}

/** RFC 5987 `attr-char`: `encodeURIComponent` chừa `'()*` nên phải mã hoá thêm. */
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Header `Content-Disposition: attachment` từ tên file lưu trong DB (không tin: có thể chứa dấu nháy, `;`, CR/LF).
 * Tên ASCII đã làm sạch cho trình duyệt cũ, `filename*` (UTF-8, percent-encoded) cho tên gốc; không ký tự điều khiển nào lọt vào header.
 */
export function buildAttachmentDisposition(storedName: string | null | undefined): string {
  const name = (storedName ?? "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, MAX_NAME_LENGTH);
  const fallback = asciiFallbackName(name);
  if (!name) return `attachment; filename="${fallback}"`;
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeRfc5987(name)}`;
}
