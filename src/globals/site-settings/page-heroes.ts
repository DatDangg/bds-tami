import type { Field } from "payload";

import { textRowLabel } from "../../lib/admin/row-label";
import { strengthIconField } from "../homepage/blocks";

/** Trang con có chữ hero riêng (BL-045); khoá khớp `PageHeroKey` ở `lib/content/page-banner.ts`. */
export const PAGE_HERO_KEYS = ["projects", "rentals", "news", "propertyPosts", "careers", "contact"] as const;
export type PageHeroTextKey = (typeof PAGE_HERO_KEYS)[number];

const PAGE_HERO_LABELS: Record<PageHeroTextKey, string> = {
  projects: "Dự án",
  rentals: "Cho thuê",
  news: "Tin tức",
  propertyPosts: "Đăng tin BĐS",
  careers: "Tuyển dụng",
  contact: "Liên hệ",
};

function heroTextGroup(key: PageHeroTextKey): Field {
  return {
    name: key,
    type: "group",
    label: PAGE_HERO_LABELS[key],
    admin: { description: "Để trống thì dùng chữ mặc định của trang." },
    fields: [
      { name: "eyebrow", type: "text", label: "Dòng chữ nhỏ trên tiêu đề", localized: true },
      { name: "title", type: "text", label: "Tiêu đề (dòng 1)", localized: true },
      { name: "titleAccent", type: "text", label: "Dòng 2 tiêu đề, màu vàng", localized: true },
      { name: "description", type: "textarea", label: "Mô tả", localized: true, admin: { description: "Tối đa 2 dòng." } },
    ],
  };
}

/** Chữ hero 6 trang con (vi + en), `site-settings` tab "Ảnh banner". */
export const pageHeroesField: Field = {
  name: "pageHeroes",
  type: "group",
  label: "Chữ banner trang con",
  admin: { description: "Tiêu đề, dòng vàng và mô tả hiện trên ảnh banner của từng trang. Chữ nhập riêng cho tiếng Việt và tiếng Anh." },
  fields: PAGE_HERO_KEYS.map(heroTextGroup),
};

/** Cờ bật/tắt dải Điểm mạnh dưới danh sách ở trang Dự án. */
export const showProjectStrengthsField: Field = {
  name: "showProjectStrengths",
  type: "checkbox",
  label: "Hiện dải Điểm mạnh ở trang Dự án",
  defaultValue: true,
};

/** Dải ý của trang Tuyển dụng (Q9): 2–6 mục, mỗi mục biểu tượng + tiêu đề + mô tả ngắn. */
export const careersPerksField: Field = {
  name: "careersPerks",
  type: "array",
  label: "Dải ý trang Tuyển dụng",
  labels: { singular: "Ý", plural: "Ý" },
  minRows: 2,
  maxRows: 6,
  admin: { description: "2–6 mục; chưa đủ 2 mục (có chữ ở ngôn ngữ đang xem) thì ẩn dải.", components: { RowLabel: textRowLabel({ field: "title", fallback: "Ý" }) } },
  fields: [
    strengthIconField(true),
    { name: "title", type: "text", label: "Tiêu đề", localized: true, required: true },
    { name: "description", type: "text", label: "Mô tả ngắn", localized: true },
  ],
};

/** Quy trình ứng tuyển trang Tuyển dụng (BL-054, Quyết định 8): ≤ 6 bước; 0 bước (có chữ ở ngôn ngữ đang xem) thì ẩn khối. */
export const careersProcessField: Field = {
  name: "careersProcess",
  type: "array",
  label: "Quy trình ứng tuyển",
  labels: { singular: "Bước", plural: "Bước" },
  maxRows: 6,
  admin: { description: "Tối đa 6 bước, theo thứ tự hiển thị; để trống thì ẩn khối Quy trình ứng tuyển.", components: { RowLabel: textRowLabel({ field: "title", fallback: "Bước" }) } },
  fields: [
    strengthIconField(true),
    { name: "title", type: "text", label: "Tiêu đề", localized: true, required: true },
    { name: "description", type: "textarea", label: "Mô tả", localized: true },
  ],
};
