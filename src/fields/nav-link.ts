import type { TextField } from "payload";

import { trimText } from "../hooks/trim-text";
import { validateNavLink } from "../lib/content/nav-link";

const NAV_LINK_DESCRIPTION = "Chọn trang trong website, hoặc chọn “Địa chỉ khác” để dán địa chỉ đầy đủ (https://…).";

/**
 * Link dùng chung ngôn ngữ (ERD §4.15): khoá trang hoặc URL http(s) tuyệt đối. Không localized.
 * Giá trị lưu vẫn là chuỗi text như cũ; chỉ ô nhập ở admin là ô chọn trang (A10, BL-051).
 */
export function navLinkField(name = "link", overrides: Partial<TextField> = {}): TextField {
  return {
    name,
    type: "text",
    label: "Liên kết",
    validate: validateNavLink,
    hooks: { beforeValidate: [trimText] },
    admin: { description: NAV_LINK_DESCRIPTION, components: { Field: "/components/admin/NavLinkField#NavLinkField" } },
    ...overrides,
  } as TextField;
}
