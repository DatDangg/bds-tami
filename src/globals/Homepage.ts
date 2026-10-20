import type { Field, GlobalConfig, TextFieldSingleValidation, UploadFieldSingleValidation } from "payload";
import { upload } from "payload/shared";

import { hideFromNonAdmin, isAdmin } from "../access";
import { navLinkField } from "../fields/nav-link";
import { seoField } from "../fields/seo";
import { translationGroup } from "../fields/translation";
import { createRevalidateHomepageGlobal, type HomepageRevalidators } from "../hooks/homepage/revalidate-homepage";
import { isFilled } from "../hooks/require-english-fields";
import { detectManualEnglishGlobal } from "../hooks/translation/detect-manual-en";
import { enqueueTranslation } from "../hooks/translation/enqueue-translation";
import { defaultLocale } from "../i18n/routing";
import { ADMIN_GLOBAL_LABELS } from "../lib/admin/collection-labels";
import { announcementBarBlock, enabledField, heroSearchBlock, NEWS_BLOCK_LABEL, newsBlock, RENTALS_BLOCK_LABEL, rentalsBlock, titleField } from "./homepage/blocks";
import { formTabs } from "../lib/admin/form-layout";
import { textRowLabel } from "../lib/admin/row-label";

const MB = 1024 * 1024;
export const HERO_VIDEO_MAX_BYTES = 15 * MB;
export const HERO_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const HERO_SLIDES_MIN = 1;
export const HERO_SLIDES_MAX = 8;
export const FEATURED_PROJECTS_MAX = 6;

/** Khối của trang chủ sắp xếp được (hero luôn đứng đầu, không nằm trong `blockOrder`). */
export { HERO_CHIP_PROJECTS_MAX, HOME_NEWS_POSTS_MAX, RENTAL_CATEGORIES_MAX } from "./homepage/blocks";

export const HOMEPAGE_BLOCKS = ["about", "featuredProjects", "services", "featuredOffers", "partners", "ctaBanner", "rentals", "news"] as const;

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

const imageUpload = (name: string, label: string, required = false, description?: string): Field => ({
  name,
  type: "upload",
  label,
  relationTo: "media",
  required,
  filterOptions: { mimeType: { contains: "image/" } },
  ...(description ? { admin: { description } } : {}),
});

const ctaLabelField: Field = { name: "ctaLabel", type: "text", label: "Chữ trên nút", localized: true };
const ctaLinkField = () => navLinkField("ctaLink", { label: "Liên kết của nút" });

/** Nhãn tiếng Việt của từng khối trang chủ (option của `blockOrder` + nhãn hàng). */
const BLOCK_LABELS: Record<(typeof HOMEPAGE_BLOCKS)[number], string> = {
  about: "Giới thiệu",
  featuredProjects: "Dự án nổi bật",
  services: "Dịch vụ",
  featuredOffers: "Ưu đãi nổi bật",
  partners: "Đối tác",
  ctaBanner: "Khối mời tư vấn",
  rentals: RENTALS_BLOCK_LABEL,
  news: NEWS_BLOCK_LABEL,
};

const heroBlock: Field = {
  name: "hero",
  type: "group",
  label: "Banner đầu trang",
  fields: [
    {
      name: "slides",
      type: "array",
      label: "Slide",
      labels: { singular: "Slide", plural: "Slide" },
      required: true,
      minRows: HERO_SLIDES_MIN,
      maxRows: HERO_SLIDES_MAX,
      admin: { components: { RowLabel: textRowLabel({ field: "title", fallback: "Slide" }) } },
      fields: [
        // Poster + ảnh mobile; video chỉ phát ở ≥ 1024px.
        imageUpload("image", "Ảnh nền", true),
        {
          name: "video",
          type: "upload",
          label: "Video nền (MP4/WebM ≤ 15MB)",
          relationTo: "media",
          filterOptions: { mimeType: { in: [...HERO_VIDEO_MIME_TYPES] } },
          validate: validateHeroVideo,
          admin: { description: "Chỉ phát trên màn hình lớn; ảnh nền dùng làm poster và cho di động." },
        },
        { ...titleField, label: "Tiêu đề" },
        { name: "subtitle", type: "text", label: "Phụ đề", localized: true },
        ctaLabelField,
        ctaLinkField(),
      ],
    },
  ],
};

const aboutBlock: Field = {
  name: "about",
  type: "group",
  label: BLOCK_LABELS.about,
  fields: [
    enabledField,
    titleField,
    { name: "content", type: "richText", label: "Nội dung giới thiệu", localized: true },
    imageUpload("image", "Ảnh minh hoạ"),
    {
      name: "stats",
      type: "array",
      label: "Số liệu nổi bật",
      labels: { singular: "Số liệu", plural: "Số liệu" },
      admin: { components: { RowLabel: textRowLabel({ field: "label", fallback: "Số liệu" }) } },
      fields: [
        { name: "value", type: "text", label: "Giá trị", required: true, admin: { description: "Vd: 10+, 1.500" } },
        { name: "label", type: "text", label: "Diễn giải", localized: true, required: true, admin: { description: "Vd: Năm kinh nghiệm" } },
      ],
    },
  ],
};

const featuredProjectsBlock: Field = {
  name: "featuredProjects",
  type: "group",
  label: BLOCK_LABELS.featuredProjects,
  fields: [
    enabledField,
    titleField,
    // Trống thì phía hiển thị lấy dự án `isFeatured` mới nhất.
    { name: "projects", type: "relationship", label: "Dự án hiển thị", relationTo: "projects", hasMany: true, maxRows: FEATURED_PROJECTS_MAX, admin: { description: "Để trống thì tự lấy các dự án đánh dấu nổi bật mới nhất." } },
  ],
};

const servicesBlock: Field = {
  name: "services",
  type: "group",
  label: BLOCK_LABELS.services,
  fields: [enabledField, titleField, { name: "items", type: "relationship", label: "Dịch vụ hiển thị", relationTo: "services", hasMany: true }],
};

const featuredOffersBlock: Field = {
  name: "featuredOffers",
  type: "group",
  label: BLOCK_LABELS.featuredOffers,
  fields: [
    enabledField,
    titleField,
    // Trống thì phía hiển thị lấy tin `isFeatured` còn hạn.
    { name: "posts", type: "relationship", label: "Tin ưu đãi hiển thị", relationTo: "property-posts", hasMany: true, admin: { description: "Để trống thì tự lấy tin nổi bật còn hạn ưu đãi." } },
  ],
};

// Danh sách đối tác lấy từ `developers.showAsPartner`.
const partnersBlock: Field = { name: "partners", type: "group", label: BLOCK_LABELS.partners, fields: [enabledField, titleField] };

const ctaBannerBlock: Field = {
  name: "ctaBanner",
  type: "group",
  label: BLOCK_LABELS.ctaBanner,
  fields: [
    { ...enabledField, defaultValue: false },
    { ...titleField, validate: validateCtaTitle },
    { name: "description", type: "textarea", label: "Mô tả", localized: true },
    // Trống thì phía hiển thị dùng chuỗi "Nhận tư vấn".
    { ...ctaLabelField, admin: { description: 'Để trống thì dùng "Nhận tư vấn".' } },
    ctaLinkField(),
    imageUpload("backgroundImage", "Ảnh nền", false, "Chỉ dùng khi chưa đặt Ảnh minh hoạ."),
    imageUpload("image", "Ảnh minh hoạ", false, "Ảnh tràn viền phía sau banner; nếu đặt sẽ thay Ảnh nền."),
    { name: "secondaryLabel", type: "text", label: "Chữ trên nút phụ", localized: true },
    navLinkField("secondaryLink", { label: "Liên kết của nút phụ" }),
  ],
};

const blockOrderField: Field = {
  name: "blockOrder",
  type: "array",
  label: "Thứ tự các khối",
  labels: { singular: "Khối", plural: "Khối" },
  defaultValue: HOMEPAGE_BLOCKS.map((block) => ({ block })),
  validate: validateBlockOrder,
  admin: { description: "Banner đầu trang luôn đứng đầu; kéo thả để sắp xếp các khối còn lại. Khối chỉ hiện khi có trong danh sách này (thêm Cho thuê, Tin tức nếu chưa có).", components: { RowLabel: textRowLabel({ field: "block", fallback: "Khối", valueLabels: BLOCK_LABELS }) } },
  fields: [{ name: "block", type: "select", label: "Khối", required: true, options: HOMEPAGE_BLOCKS.map((block) => ({ label: BLOCK_LABELS[block], value: block })) }],
};

/**
 * Trang chủ (ERD §4.15, FR-PUB-01, FR-ADM-08): admin bật/tắt, sắp xếp khối và sửa nội dung. Khách đọc; CHỈ admin ghi.
 * Chữ localized; link, ảnh, quan hệ dùng chung hai ngôn ngữ. Lưu → làm mới tag `global:homepage` + `/vi`, `/en`.
 * `revalidators` chỉ để test ghi đè.
 */
export function createHomepage(revalidators?: HomepageRevalidators): GlobalConfig {
  return {
    slug: "homepage",
    label: ADMIN_GLOBAL_LABELS.homepage,
    admin: { hidden: hideFromNonAdmin, description: "Nội dung và thứ tự các khối trên trang chủ (chỉ admin sửa)." },
    access: { read: () => true, update: isAdmin },
    hooks: { beforeChange: [detectManualEnglishGlobal], afterChange: [createRevalidateHomepageGlobal(revalidators), enqueueTranslation.globalAfterChange] },
    fields: [
      formTabs([
        { label: "Thanh thông báo", fields: [announcementBarBlock] },
        { label: "Banner đầu trang", fields: [heroBlock, heroSearchBlock] },
        { label: "Giới thiệu", fields: [aboutBlock] },
        { label: "Dự án nổi bật", fields: [featuredProjectsBlock] },
        { label: "Dịch vụ", fields: [servicesBlock] },
        { label: "Ưu đãi", fields: [featuredOffersBlock] },
        { label: "Cho thuê", fields: [rentalsBlock] },
        { label: "Tin tức", fields: [newsBlock] },
        { label: "Đối tác", fields: [partnersBlock] },
        { label: "Mời tư vấn", fields: [ctaBannerBlock] },
        { label: "Thứ tự khối", fields: [blockOrderField] },
        { label: "SEO", fields: [seoField()] },
        { label: "Bản dịch", fields: [translationGroup()] },
      ]),
    ],
  };
}

export const Homepage = createHomepage();
