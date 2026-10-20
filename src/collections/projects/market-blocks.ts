import type { ArrayField, DateField, Field, NumberField, NumberFieldSingleValidation, SelectField } from "payload";
import { number } from "payload/shared";

import { formRow } from "../../lib/admin/form-layout";
import { textRowLabel } from "../../lib/admin/row-label";

/**
 * Khối nội dung trang chi tiết dự án kiểu market (BL-020 P5-T01, ERD §4.5): điểm nổi bật, tiện ích quanh dự án, bảng giá theo loại căn, FAQ.
 * Tất cả tuỳ chọn (mảng rỗng hợp lệ) và không nằm trong `englishRequiredFields` nên không chặn xuất bản bản EN của dự án cũ;
 * chữ localized được dịch tự động qua `TRANSLATABLE_FIELDS.projects`.
 */

export const NEARBY_CATEGORIES = ["education", "healthcare", "shopping", "park", "transport", "other"] as const;
export type NearbyCategory = (typeof NEARBY_CATEGORIES)[number];

const NEARBY_CATEGORY_LABELS: Record<NearbyCategory, string> = {
  education: "Giáo dục",
  healthcare: "Y tế",
  shopping: "Mua sắm",
  park: "Công viên",
  transport: "Giao thông",
  other: "Khác",
};

export const PRICE_AVAILABILITIES = ["available", "few_left", "sold_out"] as const;
export type PriceAvailability = (typeof PRICE_AVAILABILITIES)[number];

const PRICE_AVAILABILITY_LABELS: Record<PriceAvailability, string> = {
  available: "Còn căn",
  few_left: "Sắp hết căn",
  sold_out: "Hết căn",
};

export const MAX_HIGHLIGHTS = 8;
export const MAX_NEARBY_AMENITIES = 40;
export const MAX_PRICE_ROWS = 30;
export const MAX_FAQS = 20;

const rangeNumber = (name: string, label: string, validate?: NumberFieldSingleValidation): NumberField => ({ name, type: "number", label, min: 0, validate });

/** Cặp "từ – đến": khi cả hai có giá trị thì "đến" không được nhỏ hơn "từ" (validate chạy sau `min`/kiểu số mặc định của Payload). */
const notBelow = (fromName: string, message: string): NumberFieldSingleValidation => (value, options) => {
  const base = number(value, options);
  if (base !== true) return base;
  const from = (options.siblingData as Record<string, unknown> | undefined)?.[fromName];
  return typeof value === "number" && typeof from === "number" && value < from ? message : true;
};

const highlightsField: ArrayField = {
  name: "highlights",
  type: "array",
  label: "Điểm nổi bật",
  labels: { singular: "Điểm nổi bật", plural: "Điểm nổi bật" },
  maxRows: MAX_HIGHLIGHTS,
  admin: {
    description: `Các điểm bán hàng chính của dự án (tối đa ${MAX_HIGHLIGHTS}), hiển thị thành khối riêng trên trang chi tiết.`,
    components: { RowLabel: textRowLabel({ field: "title", fallback: "Điểm nổi bật" }) },
  },
  fields: [
    { name: "title", type: "text", label: "Tiêu đề", localized: true, required: true },
    { name: "description", type: "textarea", label: "Mô tả", localized: true },
    { name: "icon", type: "text", label: "Biểu tượng (tuỳ chọn)", admin: { description: "Tên biểu tượng hiển thị kèm điểm nổi bật." } },
  ],
};

const nearbyCategoryField: SelectField = {
  name: "category",
  type: "select",
  label: "Nhóm",
  required: true,
  defaultValue: "other",
  options: NEARBY_CATEGORIES.map((value) => ({ label: NEARBY_CATEGORY_LABELS[value], value })),
};

const nearbyAmenitiesField: ArrayField = {
  name: "nearbyAmenities",
  type: "array",
  label: "Tiện ích xung quanh",
  labels: { singular: "Tiện ích xung quanh", plural: "Tiện ích xung quanh" },
  maxRows: MAX_NEARBY_AMENITIES,
  admin: {
    description: "Trường học, bệnh viện, trung tâm thương mại, công viên, giao thông... gần dự án (tối đa 40).",
    components: { RowLabel: textRowLabel({ field: "name", fallback: "Tiện ích xung quanh" }) },
  },
  fields: [
    nearbyCategoryField,
    { name: "name", type: "text", label: "Tên địa điểm", localized: true, required: true },
    { name: "distance", type: "text", label: "Khoảng cách", admin: { description: "Ví dụ: 1,2 km hoặc 5 phút. Không dịch." } },
    { name: "location", type: "point", label: "Toạ độ bản đồ", admin: { description: "Tuỳ chọn, dùng để hiện điểm trên bản đồ." } },
  ],
};

const availabilityField: SelectField = {
  name: "availability",
  type: "select",
  label: "Tình trạng",
  options: PRICE_AVAILABILITIES.map((value) => ({ label: PRICE_AVAILABILITY_LABELS[value], value })),
};

const priceTableField: ArrayField = {
  name: "priceTable",
  type: "array",
  label: "Bảng giá theo loại căn",
  labels: { singular: "Loại căn", plural: "Loại căn" },
  maxRows: MAX_PRICE_ROWS,
  admin: {
    description: "Giá tham khảo theo loại căn (không quản lý từng căn). Nhớ cập nhật ngày cập nhật giá bên dưới.",
    components: { RowLabel: textRowLabel({ field: "unitType", fallback: "Loại căn" }) },
  },
  fields: [
    { name: "unitType", type: "text", label: "Loại căn", localized: true, required: true },
    formRow(
      rangeNumber("areaFrom", "Diện tích từ (m²)"),
      rangeNumber("areaTo", "Diện tích đến (m²)", notBelow("areaFrom", "Diện tích đến không được nhỏ hơn diện tích từ.")),
    ),
    formRow(
      rangeNumber("priceFrom", "Giá từ (VNĐ)"),
      rangeNumber("priceTo", "Giá đến (VNĐ)", notBelow("priceFrom", "Giá đến không được nhỏ hơn giá từ.")),
    ),
    availabilityField,
    { name: "note", type: "text", label: "Ghi chú", localized: true },
  ],
};

const priceUpdatedAtField: DateField = {
  name: "priceUpdatedAt",
  type: "date",
  label: "Ngày cập nhật bảng giá",
  admin: { date: { pickerAppearance: "dayOnly" }, description: "Hiển thị cạnh bảng giá để khách biết giá còn mới hay cũ." },
};

const faqsField: ArrayField = {
  name: "faqs",
  type: "array",
  label: "Câu hỏi thường gặp",
  labels: { singular: "Câu hỏi", plural: "Câu hỏi thường gặp" },
  maxRows: MAX_FAQS,
  admin: {
    description: `Tối đa ${MAX_FAQS} câu hỏi.`,
    components: { RowLabel: textRowLabel({ field: "question", fallback: "Câu hỏi" }) },
  },
  fields: [
    { name: "question", type: "text", label: "Câu hỏi", localized: true, required: true },
    { name: "answer", type: "textarea", label: "Trả lời", localized: true, required: true },
  ],
};

/** Field cho tab "Nội dung mở rộng" của form dự án. */
export const projectMarketBlockFields: Field[] = [highlightsField, nearbyAmenitiesField, priceTableField, priceUpdatedAtField, faqsField];
