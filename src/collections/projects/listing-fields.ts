import type { ArrayField, SelectField } from "payload";

import { selectOptions } from "../../fields/listing-field-helpers";
import { formRow } from "../../lib/admin/form-layout";
import { textRowLabel } from "../../lib/admin/row-label";
import { PROJECT_FEATURE_ADMIN_LABELS, PROJECT_FEATURES, PROPERTY_TYPE_ADMIN_LABELS, PROPERTY_TYPES } from "../../shared/listing-options";
import { notBelow } from "./market-blocks";

/**
 * Trường dự án cho bộ lọc + trang chi tiết mới (BL-052). Tất cả tuỳ chọn, không nằm trong `englishRequiredFields` nên dự án cũ
 * để trống vẫn lưu / xuất bản được; chữ localized (`products.type`) dịch tự động qua `TRANSLATABLE_FIELDS.projects`.
 */

export const MAX_PRODUCTS = 8;

export const productTypesField: SelectField = {
  name: "productTypes",
  type: "select",
  label: "Loại sản phẩm",
  hasMany: true,
  index: true,
  options: selectOptions(PROPERTY_TYPES, PROPERTY_TYPE_ADMIN_LABELS),
  admin: { description: "Các loại sản phẩm dự án có (chọn nhiều). Dùng cho bộ lọc \"Loại hình\" ở trang Dự án." },
};

export const featuredAmenitiesField: SelectField = {
  name: "featuredAmenities",
  type: "select",
  label: "Tiện ích nổi bật (dùng cho bộ lọc)",
  hasMany: true,
  index: true,
  options: selectOptions(PROJECT_FEATURES, PROJECT_FEATURE_ADMIN_LABELS),
  admin: { description: "Chọn những điểm khách hay lọc khi tìm dự án. Khác danh sách \"Tiện ích\" bên dưới (hiện ở trang chi tiết)." },
};

export const productsField: ArrayField = {
  name: "products",
  type: "array",
  label: "Sản phẩm",
  labels: { singular: "Sản phẩm", plural: "Sản phẩm" },
  maxRows: MAX_PRODUCTS,
  admin: {
    description: `Các dòng sản phẩm của dự án (tối đa ${MAX_PRODUCTS}), hiện thành thẻ "Sản phẩm" ở phần Tổng quan trang chi tiết.`,
    components: { RowLabel: textRowLabel({ field: "type", fallback: "Sản phẩm" }) },
  },
  fields: [
    formRow(
      { name: "type", type: "text", label: "Tên loại sản phẩm", localized: true, required: true, admin: { placeholder: "VD: Căn hộ 2 phòng ngủ" } },
      { name: "count", type: "number", label: "Số lượng (căn)", min: 0, admin: { description: "Để trống nếu chưa công bố." } },
    ),
    formRow(
      { name: "areaFrom", type: "number", label: "Diện tích từ (m²)", min: 0 },
      { name: "areaTo", type: "number", label: "Diện tích đến (m²)", min: 0, validate: notBelow("areaFrom", "Diện tích đến không được nhỏ hơn diện tích từ.") },
    ),
  ],
};
