"use client";

import type { DefaultCellComponentProps } from "payload";

import { mediaTypeLabel } from "../../lib/admin/media-type-label";

/** Ô "Loại tệp" của Thư viện: nhãn ngắn tiếng Việt thay vì MIME thô. Trong lưới thẻ (CSS `_media-grid.scss`) hiện như thẻ nhỏ. */
export function MediaTypeCell({ cellData }: DefaultCellComponentProps) {
  const label = mediaTypeLabel(cellData);
  return <span className="tami-media-type">{label || "—"}</span>;
}
