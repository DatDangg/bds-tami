import type { Field, RelationshipFieldManyValidation } from "payload";
import { relationship } from "payload/shared";

import { navLinkField } from "../../fields/nav-link";

export const HERO_CHIP_PROJECTS_MAX = 6;
export const RENTAL_CATEGORIES_MAX = 4;
export const HOME_NEWS_POSTS_MAX = 3;
export const RENTALS_BLOCK_LABEL = "Cho thuê";
export const NEWS_BLOCK_LABEL = "Tin tức";
export const STRENGTHS_BLOCK_LABEL = "Điểm mạnh";
export const STRENGTH_ITEMS_MIN = 2;
export const STRENGTH_ITEMS_MAX = 6;

/**
 * Icon cho mục Điểm mạnh và số liệu Về TAMI (BL-044): giá trị lưu là tên kebab, map sang component Phosphor ở `components/home/strength-icons.ts`.
 * `file-check` giữ tên theo spec dù Phosphor không có `FileCheck` (hiển thị bằng `ClipboardText`).
 */
// `medal` + `users-three` (BL-047): icon số liệu Về TAMI theo mockup trang chủ (huy chương "năm kinh nghiệm", nhóm người "khách hàng").
export const STRENGTH_ICONS = ["map-pin", "buildings", "headset", "file-check", "shield-check", "clock", "users", "star", "medal", "users-three"] as const;
export type StrengthIcon = (typeof STRENGTH_ICONS)[number];

const STRENGTH_ICON_LABELS: Record<StrengthIcon, string> = {
  "map-pin": "Ghim vị trí",
  buildings: "Toà nhà",
  headset: "Tai nghe (hỗ trợ)",
  "file-check": "Giấy tờ",
  "shield-check": "Khiên bảo vệ",
  clock: "Đồng hồ",
  users: "Khách hàng",
  star: "Ngôi sao",
  medal: "Huy chương",
  "users-three": "Nhóm khách hàng",
};

export const strengthIconField = (required: boolean): Field => ({
  name: "icon",
  type: "select",
  label: "Biểu tượng",
  required,
  options: STRENGTH_ICONS.map((icon) => ({ label: STRENGTH_ICON_LABELS[icon], value: icon })),
});
/** Khối không có trong "Thứ tự khối" thì không hiện (bản ghi trang chủ có từ trước chưa có hai khối này): nhắc ở admin thay vì tự thêm lúc render. */
export const BLOCK_ORDER_NOTE = "Khối chỉ hiện khi có trong mục Thứ tự khối.";

export const enabledField = { name: "enabled", type: "checkbox", label: "Hiển thị khối này", defaultValue: true } as const satisfies Field;
export const titleField = { name: "title", type: "text", label: "Tiêu đề khối", localized: true } as const satisfies Field;

/** Danh mục của khối Cho thuê phải thuộc scope `rental`: `filterOptions` cho ô chọn trong admin, `validate` kiểm lại ở server (API/seed cũng bị chặn). */
const validateRentalCategories: RelationshipFieldManyValidation = async (value, options) => {
  if (options.event === "onChange") return true;
  const base = await relationship(value, options);
  if (base !== true) return base;
  const ids = ((value as unknown[] | null | undefined) ?? []).map((item) => (typeof item === "object" && item !== null ? (item as { id?: string }).id : item)) as string[];
  if (ids.length === 0) return true;
  const found = await options.req.payload.find({
    collection: "categories",
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
    select: { scope: true },
    overrideAccess: true,
    req: options.req,
  });
  const allRental = found.docs.length === ids.length && found.docs.every((category) => category.scope === "rental");
  return allRental ? true : 'Chỉ chọn danh mục thuộc loại "Cho thuê".';
};

export const announcementBarBlock: Field = {
  name: "announcementBar",
  type: "group",
  label: "Thanh thông báo (đầu trang chủ)",
  fields: [
    // Mặc định tắt: chỉ hiện khi admin chủ động bật. Khoá "khách đã đóng" tính từ nội dung nên đổi chữ/liên kết thì hiện lại.
    { ...enabledField, defaultValue: false },
    { name: "text", type: "text", label: "Nội dung thông báo", localized: true },
    navLinkField("link", { label: "Liên kết (tuỳ chọn)" }),
  ],
};

export const heroSearchBlock: Field = {
  name: "heroSearch",
  type: "group",
  label: "Ô tìm kiếm trên banner",
  fields: [
    enabledField,
    { name: "placeholder", type: "text", label: "Chữ gợi ý trong ô tìm kiếm", localized: true, admin: { description: "Để trống thì dùng chữ mặc định của website." } },
    // Trống thì phía hiển thị lấy dự án `isFeatured` mới nhất.
    { name: "chipProjects", type: "relationship", label: "Dự án gợi ý dưới ô tìm kiếm", relationTo: "projects", hasMany: true, maxRows: HERO_CHIP_PROJECTS_MAX, admin: { description: "Để trống thì tự lấy các dự án nổi bật mới nhất." } },
  ],
};

/** Dải 4 điểm mạnh dưới ô tìm kiếm (BL-044). Không có tiêu đề khối; `/en` bỏ mục thiếu `title` EN, < 2 mục thì ẩn khối. */
export const strengthsBlock: Field = {
  name: "strengths",
  type: "group",
  label: STRENGTHS_BLOCK_LABEL,
  admin: { description: BLOCK_ORDER_NOTE },
  fields: [
    enabledField,
    {
      name: "items",
      type: "array",
      label: "Mục",
      labels: { singular: "Mục", plural: "Mục" },
      minRows: STRENGTH_ITEMS_MIN,
      maxRows: STRENGTH_ITEMS_MAX,
      admin: { description: "2–6 mục; mỗi mục gồm biểu tượng, tiêu đề ngắn và một dòng mô tả." },
      fields: [
        strengthIconField(true),
        { name: "title", type: "text", label: "Tiêu đề", localized: true, required: true },
        { name: "description", type: "text", label: "Mô tả ngắn", localized: true },
      ],
    },
  ],
};

export const rentalsBlock: Field = {
  name: "rentals",
  type: "group",
  label: RENTALS_BLOCK_LABEL,
  admin: { description: BLOCK_ORDER_NOTE },
  fields: [
    enabledField,
    titleField,
    // Trống thì phía hiển thị lấy các danh mục cho thuê đang có tin.
    {
      name: "categories",
      type: "relationship",
      label: "Danh mục cho thuê hiển thị",
      relationTo: "categories",
      hasMany: true,
      maxRows: RENTAL_CATEGORIES_MAX,
      filterOptions: { scope: { equals: "rental" } },
      validate: validateRentalCategories,
      admin: { description: "Tối đa 4. Để trống thì tự lấy các danh mục cho thuê đang có tin." },
    },
  ],
};

export const newsBlock: Field = {
  name: "news",
  type: "group",
  label: NEWS_BLOCK_LABEL,
  admin: { description: BLOCK_ORDER_NOTE },
  fields: [
    enabledField,
    titleField,
    { name: "intro", type: "textarea", label: "Giới thiệu ngắn", localized: true },
    // Trống thì phía hiển thị lấy 3 bài mới nhất.
    { name: "posts", type: "relationship", label: "Bài viết hiển thị", relationTo: "news", hasMany: true, maxRows: HOME_NEWS_POSTS_MAX, admin: { description: "Tối đa 3. Để trống thì tự lấy 3 bài mới nhất." } },
  ],
};
