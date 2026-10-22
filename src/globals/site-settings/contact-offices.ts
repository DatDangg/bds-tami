import type { Field } from "payload";

import { formRow } from "../../lib/admin/form-layout";
import { textRowLabel } from "../../lib/admin/row-label";

/** Hệ thống văn phòng trang Liên hệ (BL-054, Quyết định 4): `site-settings` tab "Liên hệ & mạng xã hội". */
export const officesField: Field = {
  name: "offices",
  type: "array",
  label: "Hệ thống văn phòng",
  labels: { singular: "Văn phòng", plural: "Văn phòng" },
  maxRows: 10,
  admin: {
    description: "Để trống thì website dùng Địa chỉ / Toạ độ / Hotline / Email ở trên.",
    components: { RowLabel: textRowLabel({ field: "name", fallback: "Văn phòng" }) },
  },
  fields: [
    { name: "name", type: "text", label: "Tên văn phòng", localized: true, required: true, admin: { placeholder: "VD: Trụ sở Hà Nội" } },
    { name: "address", type: "text", label: "Địa chỉ", localized: true, required: true },
    { name: "image", type: "upload", label: "Ảnh văn phòng", relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } },
    { name: "location", type: "point", label: "Toạ độ bản đồ" },
    formRow({ name: "phone", type: "text", label: "Điện thoại" }, { name: "email", type: "email", label: "Email" }),
  ],
};

/** Giờ làm việc (BL-054, Quyết định 5): trống thì ẩn thẻ Giờ làm việc ở trang Liên hệ. */
export const workingHoursField: Field = {
  name: "workingHours",
  type: "group",
  label: "Giờ làm việc",
  admin: { description: "Hiện ở thẻ Giờ làm việc trang Liên hệ; để trống thì ẩn thẻ." },
  fields: [
    formRow(
      { name: "hours", type: "text", label: "Giờ", localized: true, admin: { placeholder: "VD: 8:00 – 18:00" } },
      { name: "days", type: "text", label: "Ngày", localized: true, admin: { placeholder: "VD: Thứ 2 – Chủ nhật" } },
    ),
  ],
};
