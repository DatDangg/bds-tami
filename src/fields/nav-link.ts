import type { TextField } from "payload";

import { trimText } from "../hooks/trim-text";
import { PAGE_LINK_KEY_LIST, type PageLinkKey, validateNavLink } from "../lib/content/nav-link";

/** Nghĩa tiếng Việt của từng mã trang (mã giữ nguyên vì là giá trị lưu); `Record` bắt buộc bổ sung khi thêm mã mới. */
const PAGE_LINK_KEY_MEANINGS: Record<PageLinkKey, string> = {
  home: "Trang chủ",
  projects: "Dự án",
  rentals: "Cho thuê",
  "property-posts": "Tin bất động sản",
  news: "Tin tức",
  careers: "Tuyển dụng",
  contact: "Liên hệ",
  "privacy-policy": "Chính sách bảo mật",
  "terms-of-use": "Điều khoản sử dụng",
};

const NAV_LINK_DESCRIPTION = `Mã trang có sẵn: ${PAGE_LINK_KEY_LIST.map((key) => `${key} (${PAGE_LINK_KEY_MEANINGS[key]})`).join(", ")} — hoặc địa chỉ đầy đủ https://…`;

/** Link dùng chung ngôn ngữ (ERD §4.15): khoá trang hoặc URL http(s) tuyệt đối. Không localized. */
export function navLinkField(name = "link", overrides: Partial<TextField> = {}): TextField {
  return {
    name,
    type: "text",
    label: "Liên kết",
    validate: validateNavLink,
    hooks: { beforeValidate: [trimText] },
    admin: { description: NAV_LINK_DESCRIPTION },
    ...overrides,
  } as TextField;
}
