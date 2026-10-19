import type { Field, RowField, TabsField } from "payload";

/**
 * Bố cục form admin (BL-015 T06, FR-ADM-19). CHỈ dùng vỏ giao diện KHÔNG TÊN (tab không `name`, `row`): chúng không thêm
 * một cấp vào dữ liệu nên đường dẫn field, `siblingData`, hook và validate giữ nguyên, không sinh migration.
 * Tuyệt đối không truyền `name` cho tab và không bọc field vào `group` ở đây (đổi đường dẫn dữ liệu).
 */
export interface FormTab {
  label: string;
  fields: Field[];
}

/** Một bộ tab không tên; `withContentDefaults` thêm tab SEO + Bản dịch vào bộ tab ở cấp gốc của collection. */
export function formTabs(tabs: readonly FormTab[]): TabsField {
  return { type: "tabs", tabs: tabs.map(({ label, fields }) => ({ label, fields })) };
}

/** Hàng ngang (2 cột trên màn rộng, xuống dòng trên mobile) cho các field ngắn đi cặp. */
export function formRow(...fields: Field[]): RowField {
  return { type: "row", fields };
}

/**
 * Trải phẳng vỏ bố cục không tên (tab không tên, `row`, `collapsible`) để duyệt field theo tên như khi chưa có bố cục.
 * Tab CÓ tên là một cấp dữ liệu riêng nên bị bỏ qua (không trả về field nào); BL-015 không dùng tab có tên.
 */
export function flattenLayoutFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field): Field[] => {
    if (field.type === "row" || field.type === "collapsible") return flattenLayoutFields(field.fields);
    if (field.type === "tabs") {
      return field.tabs.flatMap((tab) => ("name" in tab && typeof tab.name === "string" ? [] : flattenLayoutFields(tab.fields)));
    }
    return [field];
  });
}

/** Field có tên theo `name` ở cấp dữ liệu gốc, tìm xuyên vỏ bố cục không tên. */
export function findLayoutField(fields: readonly Field[], name: string): Field | undefined {
  return flattenLayoutFields(fields).find((field) => "name" in field && field.name === name);
}
