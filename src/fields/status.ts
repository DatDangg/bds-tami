import type { SelectField } from "payload";

/** Trạng thái dùng chung (ERD §1). `rentals` thêm `rented`. */
export const CONTENT_STATUSES = ["draft", "published", "hidden"] as const;
export const RENTAL_STATUSES = [...CONTENT_STATUSES, "rented"] as const;

export type ContentStatus = (typeof RENTAL_STATUSES)[number];

const LABELS: Record<ContentStatus, string> = {
  draft: "Nháp",
  published: "Đã xuất bản",
  hidden: "Ẩn",
  rented: "Đã thuê",
};

/** Trường `status` riêng (không dùng `_status` drafts của Payload) để khớp BR-01/BR-02. */
export function statusField(values: readonly ContentStatus[] = CONTENT_STATUSES): SelectField {
  return {
    name: "status",
    type: "select",
    label: "Trạng thái",
    required: true,
    index: true,
    defaultValue: "draft",
    options: values.map((value) => ({ label: LABELS[value], value })),
    admin: { position: "sidebar" },
  };
}
