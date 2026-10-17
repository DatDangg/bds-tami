import type { TextField } from "payload";

import { trimText } from "../hooks/trim-text";
import { PAGE_LINK_KEY_LIST, validateNavLink } from "../lib/content/nav-link";

/** Link dùng chung ngôn ngữ (ERD §4.15): khoá trang hoặc URL http(s) tuyệt đối. Không localized. */
export function navLinkField(name = "link", overrides: Partial<TextField> = {}): TextField {
  return {
    name,
    type: "text",
    validate: validateNavLink,
    hooks: { beforeValidate: [trimText] },
    admin: { description: `Khoá trang (${PAGE_LINK_KEY_LIST.join(", ")}) hoặc địa chỉ https://...` },
    ...overrides,
  } as TextField;
}
