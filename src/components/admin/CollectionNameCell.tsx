"use client";

import type { DefaultCellComponentProps } from "payload";

import { collectionDisplayName } from "../../lib/admin/collection-labels";
import { LinkedCell } from "./LinkedCell";

/** Ô "Loại dữ liệu/nội dung" của danh sách admin: slug collection → tên tiếng Việt. Sort/filter vẫn theo giá trị gốc (BL-043). */
export function CollectionNameCell(props: DefaultCellComponentProps) {
  return <LinkedCell cell={props}>{collectionDisplayName(props.cellData)}</LinkedCell>;
}
