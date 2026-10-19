"use client";

import { useRowLabel } from "@payloadcms/ui";

export interface TextRowLabelProps {
  /** Tên trường trong hàng lấy làm nhãn (vd `title`, `name`, `platform`). */
  field: string;
  /** Tiền tố khi hàng chưa có giá trị: "<fallback> <số thứ tự>" (vd "Mặt bằng 2"). */
  fallback: string;
  /** Đổi giá trị mã (select) sang chữ hiển thị, vd `{ facebook: "Facebook" }`. */
  valueLabels?: Record<string, string>;
}

/**
 * Nhãn hàng array dùng chung cho admin (BL-015 T02, design §5): hiện giá trị chính của hàng thay vì "Hàng 01" mặc định.
 * Cấu hình qua `admin.components.RowLabel = { path, clientProps }` nên một component phủ mọi array, không phải viết riêng từng cái.
 */
export function TextRowLabel({ field, fallback, valueLabels }: TextRowLabelProps) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown> | undefined>();
  const raw = data?.[field];
  const value = typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : "";
  const text = value ? (valueLabels?.[value] ?? value) : `${fallback} ${(rowNumber ?? 0) + 1}`;
  return <span>{text}</span>;
}
