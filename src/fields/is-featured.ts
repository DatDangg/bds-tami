import type { CheckboxField } from "payload";

import { isAdmin } from "../access";

/** Khối nổi bật trên trang chủ do admin quyết (PERMISSION §4). Sale gửi lên bị bỏ qua. */
export function isFeaturedField(): CheckboxField {
  return {
    name: "isFeatured",
    type: "checkbox",
    label: "Nổi bật trên trang chủ",
    defaultValue: false,
    index: true,
    access: { create: isAdmin, update: isAdmin },
    admin: { position: "sidebar" },
  };
}
