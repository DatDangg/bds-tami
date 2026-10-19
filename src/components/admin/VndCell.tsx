"use client";

import type { DefaultCellComponentProps } from "payload";

import { formatVnd } from "../../lib/format";
import { LinkedCell } from "./LinkedCell";

/** Ô tiền VNĐ của danh sách admin: `110.000.000 ₫`, trống → `—`. Chỉ đổi cách hiển thị; sort/filter của Payload vẫn theo số. */
export function VndCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const text = typeof cellData === "number" && Number.isFinite(cellData) ? formatVnd(cellData, "vi") : "—";
  return <LinkedCell cell={props}>{text}</LinkedCell>;
}
