import type { DateField, FieldHook } from "payload";

import { denyAll } from "../access";

/**
 * Gán thời điểm xuất bản ở lần đầu `status` thành `published`; đã có giá trị thì giữ (ẩn rồi xuất bản lại không
 * đổi ngày). Dùng `beforeChange` vì access chặn sửa tay đã xoá giá trị client gửi ở bước `beforeValidate`.
 */
const stampFirstPublish: FieldHook = ({ value, data, originalDoc, previousValue }) => {
  const existing = previousValue ?? value;
  if (existing) return existing;
  const status = data?.status ?? originalDoc?.status;
  return status === "published" ? new Date().toISOString() : value;
};

/** Chỉ đọc với mọi người ở Must (hẹn giờ mở ở task riêng, FR-ADM-16); hệ thống ghi qua hook. */
export function publishedAtField(): DateField {
  return {
    name: "publishedAt",
    type: "date",
    label: "Ngày xuất bản",
    index: true,
    access: { create: denyAll, update: denyAll },
    hooks: { beforeChange: [stampFirstPublish] },
    admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } },
  };
}
