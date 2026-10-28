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

/**
 * Bản cho Tin tức (hẹn giờ, BL-091): giá trị người dùng gửi lên được dùng nguyên (kể cả quá khứ / tương lai); không gửi (`undefined`, vd cập nhật
 * từng phần qua API) → giữ giá trị đã lưu; để trống (`null` / "") mà `status = published` → bây giờ; để trống khi chưa xuất bản → để trống.
 */
const stampScheduledPublish: FieldHook = ({ value, data, originalDoc, previousValue }) => {
  const submitted = value === undefined ? previousValue : value;
  if (submitted) return submitted;
  const status = data?.status ?? originalDoc?.status;
  if (status === "published") return new Date().toISOString();
  return submitted === undefined ? value : null;
};

export interface PublishedAtOptions {
  /** Chỉ Tin tức: ô sửa được để hẹn giờ xuất bản (FR-ADM-16). Các collection khác giữ chỉ-đọc + hệ thống ghi qua hook. */
  scheduled?: boolean;
}

const SCHEDULED_COMPONENTS = {
  Cell: "/components/admin/ScheduledPublishDisplay#ScheduledPublishCell",
  afterInput: ["/components/admin/ScheduledPublishDisplay#ScheduledPublishNotice"],
};

/** Mặc định chỉ đọc với mọi người (hệ thống ghi qua hook); `scheduled` mở cho ai sửa được bài (access cấp collection quyết định). */
export function publishedAtField({ scheduled = false }: PublishedAtOptions = {}): DateField {
  if (scheduled) {
    return {
      name: "publishedAt",
      type: "date",
      label: "Ngày xuất bản",
      index: true,
      hooks: { beforeChange: [stampScheduledPublish] },
      admin: {
        position: "sidebar",
        description: "Để trống thì tự điền khi xuất bản lần đầu; chọn giờ trong tương lai để hẹn giờ.",
        date: { pickerAppearance: "dayAndTime" },
        components: SCHEDULED_COMPONENTS,
      },
    };
  }
  return {
    name: "publishedAt",
    type: "date",
    label: "Ngày xuất bản",
    index: true,
    access: { create: denyAll, update: denyAll },
    hooks: { beforeChange: [stampFirstPublish] },
    admin: { position: "sidebar", readOnly: true, description: "Tự điền khi xuất bản lần đầu.", date: { pickerAppearance: "dayAndTime" } },
  };
}
