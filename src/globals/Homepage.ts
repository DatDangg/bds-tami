import type { Field, GlobalConfig, TextFieldSingleValidation, UploadFieldSingleValidation } from "payload";
import { upload } from "payload/shared";

import { hideFromNonAdmin, isAdmin } from "../access";
import { navLinkField } from "../fields/nav-link";
import { seoField } from "../fields/seo";
import { translationGroup } from "../fields/translation";
import { createRevalidateHomepageGlobal, type HomepageRevalidators } from "../hooks/homepage/revalidate-homepage";
import { isFilled } from "../hooks/require-english-fields";
import { defaultLocale } from "../i18n/routing";

const MB = 1024 * 1024;
export const HERO_VIDEO_MAX_BYTES = 15 * MB;
export const HERO_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const HERO_SLIDES_MIN = 1;
export const HERO_SLIDES_MAX = 8;
export const FEATURED_PROJECTS_MAX = 6;

/** Khối của trang chủ sắp xếp được (hero luôn đứng đầu, không nằm trong `blockOrder`). */
export const HOMEPAGE_BLOCKS = ["about", "featuredProjects", "services", "featuredOffers", "partners", "ctaBanner"] as const;

/**
 * Video hero: chỉ MP4/WebM ≤ 15MB. Upload vào `media` đã chặn theo magic bytes + dung lượng (ERD §4.12); đây là lớp kiểm lại
 * ở server cho quan hệ (API/seed không đi qua form upload): chạy validator `upload` mặc định (id hợp lệ + `filterOptions`) rồi
 * đọc `mimeType`/`filesize` thật của media.
 */
const validateHeroVideo: UploadFieldSingleValidation = async (value, options) => {
  // Form-state của admin gọi validator ở mỗi lần gõ: chỉ kiểm sâu (truy vấn DB) lúc lưu.
  if (options.event === "onChange") return true;
  const base = await upload(value, options);
  if (base !== true) return base;
  if (value == null) return true;
  // `find` thay vì `findByID`: id đã bị xoá thì trả lỗi validate rõ ràng, không ném NotFound.
  const found = await options.req.payload.find({
    collection: "media",
    where: { id: { equals: value as string } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req: options.req,
  });
  const media = found.docs[0];
  if (!media) return "Video hero không tồn tại (có thể đã bị xoá).";
  const mimeType = String(media.mimeType ?? "");
  if (!(HERO_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)) return "Video hero chỉ nhận MP4 hoặc WebM.";
  if ((media.filesize ?? 0) > HERO_VIDEO_MAX_BYTES) return "Video hero không được vượt quá 15MB.";
  return true;
};

const CTA_TITLE_REQUIRED_MESSAGE = "Cần tiêu đề (tiếng Việt) khi bật khối kêu gọi hành động.";

/**
 * `title` của `ctaBanner` bắt buộc khi khối bật, tính theo bản `vi` (ERD §4.15; chưa có bản `en` thì phía hiển thị ẩn khối ở `/en`).
 * `enabled` không localized nên bật từ tab EN cũng phải kiểm: đọc title `vi` đã lưu (KHÔNG truyền `req`: Local API ghi đè `req.locale` thành `vi`,
 * làm lệnh lưu bản en đang chạy bị ghi nhầm sang `vi`; bản `vi` đã lưu ở request trước nên đọc ngoài transaction vẫn đúng).
 */
const validateCtaTitle: TextFieldSingleValidation = async (value, { siblingData, req }) => {
  const enabled = (siblingData as { enabled?: boolean } | undefined)?.enabled === true;
  if (!enabled) return true;
  if (!req.locale || req.locale === defaultLocale) return isFilled(value) ? true : CTA_TITLE_REQUIRED_MESSAGE;
  const saved = await req.payload.findGlobal({ slug: "homepage", locale: defaultLocale, fallbackLocale: false, depth: 0, overrideAccess: true });
  return isFilled(saved.ctaBanner?.title) ? true : CTA_TITLE_REQUIRED_MESSAGE;
};

const validateBlockOrder = (value: unknown): true | string => {
  const blocks = ((value as { block?: string }[] | null | undefined) ?? []).map((row) => row.block);
  return new Set(blocks).size === blocks.length ? true : "Mỗi khối chỉ xuất hiện một lần trong thứ tự.";
};

const imageUpload = (name: string, required = false): Field => ({
  name,
  type: "upload",
  relationTo: "media",
  required,
  filterOptions: { mimeType: { contains: "image/" } },
});

const enabledField: Field = { name: "enabled", type: "checkbox", defaultValue: true };
const titleField: Field = { name: "title", type: "text", localized: true };

const heroBlock: Field = {
  name: "hero",
  type: "group",
  fields: [
    {
      name: "slides",
      type: "array",
      required: true,
      minRows: HERO_SLIDES_MIN,
      maxRows: HERO_SLIDES_MAX,
      fields: [
        // Poster + ảnh mobile; video chỉ phát ở ≥ 1024px.
        imageUpload("image", true),
        {
          name: "video",
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { in: [...HERO_VIDEO_MIME_TYPES] } },
          validate: validateHeroVideo,
        },
        titleField,
        { name: "subtitle", type: "text", localized: true },
        { name: "ctaLabel", type: "text", localized: true },
        navLinkField("ctaLink"),
      ],
    },
  ],
};

const aboutBlock: Field = {
  name: "about",
  type: "group",
  fields: [
    enabledField,
    titleField,
    { name: "content", type: "richText", localized: true },
    imageUpload("image"),
    {
      name: "stats",
      type: "array",
      fields: [
        { name: "value", type: "text", required: true },
        { name: "label", type: "text", localized: true, required: true },
      ],
    },
  ],
};

const featuredProjectsBlock: Field = {
  name: "featuredProjects",
  type: "group",
  fields: [
    enabledField,
    titleField,
    // Trống thì phía hiển thị lấy dự án `isFeatured` mới nhất.
    { name: "projects", type: "relationship", relationTo: "projects", hasMany: true, maxRows: FEATURED_PROJECTS_MAX },
  ],
};

const servicesBlock: Field = {
  name: "services",
  type: "group",
  fields: [enabledField, titleField, { name: "items", type: "relationship", relationTo: "services", hasMany: true }],
};

const featuredOffersBlock: Field = {
  name: "featuredOffers",
  type: "group",
  fields: [
    enabledField,
    titleField,
    // Trống thì phía hiển thị lấy tin `isFeatured` còn hạn.
    { name: "posts", type: "relationship", relationTo: "property-posts", hasMany: true },
  ],
};

// Danh sách đối tác lấy từ `developers.showAsPartner`.
const partnersBlock: Field = { name: "partners", type: "group", fields: [enabledField, titleField] };

const ctaBannerBlock: Field = {
  name: "ctaBanner",
  type: "group",
  fields: [
    { name: "enabled", type: "checkbox", defaultValue: false },
    { name: "title", type: "text", localized: true, validate: validateCtaTitle },
    { name: "description", type: "textarea", localized: true },
    // Trống thì phía hiển thị dùng chuỗi "Nhận tư vấn".
    { name: "ctaLabel", type: "text", localized: true },
    navLinkField("ctaLink"),
    imageUpload("backgroundImage"),
  ],
};

const blockOrderField: Field = {
  name: "blockOrder",
  type: "array",
  defaultValue: HOMEPAGE_BLOCKS.map((block) => ({ block })),
  validate: validateBlockOrder,
  fields: [{ name: "block", type: "select", required: true, options: HOMEPAGE_BLOCKS.map((block) => ({ label: block, value: block })) }],
};

/**
 * Trang chủ (ERD §4.15, FR-PUB-01, FR-ADM-08): admin bật/tắt, sắp xếp khối và sửa nội dung. Khách đọc; CHỈ admin ghi.
 * Chữ localized; link, ảnh, quan hệ dùng chung hai ngôn ngữ. Lưu → làm mới tag `global:homepage` + `/vi`, `/en`.
 * `revalidators` chỉ để test ghi đè.
 */
export function createHomepage(revalidators?: HomepageRevalidators): GlobalConfig {
  return {
    slug: "homepage",
    label: "Trang chủ",
    admin: { hidden: hideFromNonAdmin },
    access: { read: () => true, update: isAdmin },
    hooks: { afterChange: [createRevalidateHomepageGlobal(revalidators)] },
    fields: [
      heroBlock,
      aboutBlock,
      featuredProjectsBlock,
      servicesBlock,
      featuredOffersBlock,
      partnersBlock,
      ctaBannerBlock,
      blockOrderField,
      seoField(),
      translationGroup(),
    ],
  };
}

export const Homepage = createHomepage();
