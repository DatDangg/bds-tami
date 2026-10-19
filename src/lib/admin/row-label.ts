import type { TextRowLabelProps } from "../../components/admin/row-labels/TextRowLabel";

/** Đường dẫn component nhãn hàng array dùng chung (xem `components/admin/row-labels/TextRowLabel.tsx`). */
export const TEXT_ROW_LABEL = "/components/admin/row-labels/TextRowLabel#TextRowLabel";

/** Cấu hình `admin.components.RowLabel` cho một array: hiện giá trị `field` của hàng, trống thì "<fallback> N". */
export function textRowLabel(clientProps: TextRowLabelProps) {
  return { path: TEXT_ROW_LABEL, clientProps };
}
