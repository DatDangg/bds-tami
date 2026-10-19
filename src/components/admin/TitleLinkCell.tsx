"use client";

import { DefaultCell, useTableColumns } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { LinkedCell } from "./LinkedCell";

/** Cột đầu là ảnh đại diện (ThumbnailCell, trang trí) → tiêu đề là cột mang link của hàng. */
const THUMBNAIL_ACCESSORS = ["gallery", "cover"];

/**
 * Payload chỉ đánh dấu link cho CỘT ĐẦU. Khi cột đầu đang hiển thị là ảnh đại diện, tiêu đề phải thay nó làm link (một link/hàng,
 * bấm/Tab được); các trường hợp khác (tiêu đề đứng đầu, hoặc người dùng xếp cột khác lên đầu) theo cờ `link` của Payload để không trùng link.
 * Trong ListDrawer, LinkedCell biến link thành nút chọn bản ghi.
 */
export function TitleLinkCell(props: DefaultCellComponentProps) {
  const { columns } = useTableColumns();
  const firstActive = columns?.find((column) => column.active)?.accessor;
  const forceLink = firstActive !== undefined && THUMBNAIL_ACCESSORS.includes(firstActive);
  return (
    <LinkedCell cell={props} forceLink={forceLink}>
      <DefaultCell {...props} link={false} />
    </LinkedCell>
  );
}
