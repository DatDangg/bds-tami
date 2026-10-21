import type { ArrayField, CollapsibleField, Field, GlobalConfig, GroupField, TextFieldSingleValidation, UploadFieldSingleValidation } from "payload";
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
import { parseVideoUrl } from "../components/media/video-url";
import { announcementBarBlock, enabledField, heroSearchBlock, NEWS_BLOCK_LABEL, newsBlock, RENTALS_BLOCK_LABEL, rentalsBlock, STRENGTHS_BLOCK_LABEL, strengthIconField, strengthsBlock, titleField } from "./homepage/blocks";
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

export { STRENGTH_ICONS, type StrengthIcon } from "./homepage/blocks";

export const HOMEPAGE_BLOCKS = ["strengths", "about", "featuredProjects", "services", "featuredOffers", "partners", "ctaBanner", "rentals", "news"] as const;

/** Thứ tự khối mặc định cho bản ghi mới (và khi `blockOrder` trống): chỉ các khối trong mockup BL-044; khối khác admin thêm lại để bật (D4). */
export const HOMEPAGE_DEFAULT_BLOCK_ORDER = ["strengths", "about", "featuredProjects", "ctaBanner"] as const satisfies readonly (typeof HOMEPAGE_BLOCKS)[number][];

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

/** Video "Khám phá TAMI HOMES" (BL-044 D3) chỉ nhúng YouTube: kiểm ở server bằng cùng parser của trang hiển thị (link khác → ẩn nút). */
const validateYoutubeUrl: TextFieldSingleValidation = (value) => {
  if (typeof value !== "string" || value.trim() === "") return true;
  return parseVideoUrl(value)?.provider === "youtube" ? true : "Chỉ nhận liên kết YouTube (youtube.com/watch?v=, youtu.be/ hoặc youtube.com/embed/).";
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
  strengths: STRENGTHS_BLOCK_LABEL,
  about: "Giới thiệu",
  featuredProjects: "Dự án nổi bật",
  services: "Dịch vụ",
  featuredOffers: "Ưu đãi nổi bật",
  partners: "Đối tác",
  ctaBanner: "Khối mời tư vấn",
  rentals: RENTALS_BLOCK_LABEL,
  news: NEWS_BLOCK_LABEL,
};

const heroBlock: GroupField = {
  name: "hero",
  type: "group",
  label: "Banner đầu trang",
  fields: [
    // Eyebrow + chú thích là chữ CHUNG cho mọi slide (BL-044 Q4).
    { name: "eyebrow", type: "text", label: "Dòng chữ nhỏ trên tiêu đề", localized: true, admin: { description: 'Vd: "TAMI HOMES". Hiện trên mọi slide, viết hoa giãn chữ.' } },
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
        { name: "titleAccent", type: "text", label: "Dòng 2 của tiêu đề (màu vàng)", localized: true },
        { name: "subtitle", type: "text", label: "Phụ đề", localized: true },
        ctaLabelField,
        ctaLinkField(),
      ],
    },
    { name: "caption", type: "textarea", label: "Chú thích góc dưới phải", localized: true, admin: { description: "≤ 2 dòng, hiện ở góc dưới phải banner trên mọi slide." } },
  ],
};

const aboutBlock: GroupField = {
  name: "about",
  type: "group",
  label: BLOCK_LABELS.about,
  fields: [
    enabledField,
    // Bố cục mockup BL-044 (render ở task T02): eyebrow → tiêu đề + dòng vàng → nội dung → số liệu có icon → nút; cụm ảnh chồng bên trái.
    { name: "eyebrow", type: "text", label: "Dòng chữ nhỏ trên tiêu đề", localized: true, admin: { description: 'Để trống thì dùng "Về chúng tôi".' } },
    titleField,
    { name: "titleAccent", type: "text", label: "Phần tiêu đề màu vàng", localized: true, admin: { description: 'Vd: tiêu đề "Về" + phần vàng "TAMI HOMES".' } },
    { name: "content", type: "richText", label: "Nội dung giới thiệu", localized: true },
    imageUpload("image", "Ảnh minh hoạ"),
    imageUpload("secondaryImage", "Ảnh phụ (đè góc trên trái ảnh minh hoạ)"),
    { name: "imageCaption", type: "textarea", label: "Chú thích trên ảnh", localized: true, admin: { description: "Thẻ trắng nhỏ đè góc dưới trái ảnh; vài dòng ngắn." } },
    { name: "videoUrl", type: "text", label: "Liên kết video YouTube", validate: validateYoutubeUrl, admin: { description: "Nút play mở video trong hộp thoại. Để trống thì ẩn nút." } },
    { name: "videoLabel", type: "text", label: "Chữ cạnh nút play", localized: true, admin: { description: 'Để trống thì dùng "Khám phá TAMI HOMES".' } },
    {
      name: "stats",
      type: "array",
      label: "Số liệu nổi bật",
      labels: { singular: "Số liệu", plural: "Số liệu" },
      admin: { components: { RowLabel: textRowLabel({ field: "label", fallback: "Số liệu" }) } },
      fields: [
        strengthIconField(false),
        { name: "value", type: "text", label: "Giá trị", required: true, admin: { description: "Vd: 10+, 1.500" } },
        { name: "label", type: "text", label: "Diễn giải", localized: true, required: true, admin: { description: "Vd: Năm kinh nghiệm" } },
      ],
    },
    ctaLabelField,
    ctaLinkField(),
    imageUpload("decorImage", "Ảnh trang trí mép phải", false, "Chỉ hiện trên màn hình rất rộng (≥ 1280px), không mang nội dung."),
  ],
};

const featuredProjectsBlock: GroupField = {
  name: "featuredProjects",
  type: "group",
  label: BLOCK_LABELS.featuredProjects,
  fields: [
    enabledField,
    { name: "eyebrow", type: "text", label: "Dòng chữ nhỏ trên tiêu đề", localized: true },
    titleField,
    { name: "description", type: "textarea", label: "Mô tả dưới tiêu đề", localized: true },
    // Trống thì phía hiển thị lấy dự án `isFeatured` mới nhất.
    { name: "projects", type: "relationship", label: "Dự án hiển thị", relationTo: "projects", hasMany: true, maxRows: FEATURED_PROJECTS_MAX, admin: { description: "Để trống thì tự lấy các dự án đánh dấu nổi bật mới nhất." } },
  ],
};

const servicesBlock: GroupField = {
  name: "services",
  type: "group",
  label: BLOCK_LABELS.services,
  fields: [enabledField, titleField, { name: "items", type: "relationship", label: "Dịch vụ hiển thị", relationTo: "services", hasMany: true }],
};

const featuredOffersBlock: GroupField = {
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
const partnersBlock: GroupField = { name: "partners", type: "group", label: BLOCK_LABELS.partners, fields: [enabledField, titleField] };

const ctaBannerBlock: GroupField = {
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

const blockOrderField: ArrayField = {
  name: "blockOrder",
  type: "array",
  label: "Thứ tự các khối",
  labels: { singular: "Khối", plural: "Khối" },
  defaultValue: HOMEPAGE_DEFAULT_BLOCK_ORDER.map((block) => ({ block })),
  validate: validateBlockOrder,
  admin: {
    description:
      "Banner đầu trang và ô tìm kiếm luôn đứng đầu; kéo thả để sắp xếp các khối còn lại. Bố cục mới chỉ gồm Điểm mạnh, Giới thiệu, Dự án nổi bật, Mời tư vấn — các khối khác (Dịch vụ, Ưu đãi, Cho thuê, Tin tức, Đối tác) bỏ khỏi danh sách (hoặc bỏ tích \"Hiện khối này trên web\" ở khối đó) để tắt, thêm lại để bật. Khối chỉ hiện khi có trong danh sách này.",
    components: { RowLabel: textRowLabel({ field: "block", fallback: "Khối", valueLabels: BLOCK_LABELS }) },
  },
  fields: [{ name: "block", type: "select", label: "Khối", required: true, options: HOMEPAGE_BLOCKS.map((block) => ({ label: BLOCK_LABELS[block], value: block })) }],
};

/**
 * Khối của form Trang chủ: khối thu gọn (collapsible KHÔNG tên) mang tiêu đề tên khối; nhãn của chính group đặt `false` để tiêu đề không lặp.
 * Vỏ không tên nên đường dẫn dữ liệu (`about.enabled`…), hook, validate và API giữ nguyên, không đổi schema.
 * "Thứ tự các khối" (`blockOrder`) KHÔNG bọc: nó điều khiển cả trang chứ không phải một khối, và mô tả hướng dẫn tắt khối của nó phải luôn thấy được.
 */
function homepageBlock(label: string, field: GroupField, initCollapsed: boolean): CollapsibleField {
  return { type: "collapsible", label, admin: { initCollapsed }, fields: [{ ...field, label: false }] };
}

type BlockEntry = [label: string, field: GroupField];

/** Khối đầu mỗi tab mở sẵn, các khối sau thu gọn (tab dài vẫn lướt được). */
const blocksOf = (entries: BlockEntry[]) => entries.map(([label, field], index) => homepageBlock(label, field, index > 0));

/** 5 tab không tên theo luồng trang (BL-051 A14): tab không `name` nên không thêm cấp vào dữ liệu. */
function homepageTabs() {
  return formTabs([
    { label: "Đầu trang & Banner", fields: blocksOf([["Thanh thông báo (đầu trang chủ)", announcementBarBlock], ["Banner đầu trang", heroBlock], ["Ô tìm kiếm trên banner", heroSearchBlock]]) },
    { label: "Giới thiệu & Uy tín", fields: blocksOf([[BLOCK_LABELS.about, aboutBlock], [STRENGTHS_BLOCK_LABEL, strengthsBlock], [BLOCK_LABELS.partners, partnersBlock]]) },
    {
      label: "Sản phẩm & Tin nổi bật",
      fields: blocksOf([
        [BLOCK_LABELS.featuredProjects, featuredProjectsBlock],
        [RENTALS_BLOCK_LABEL, rentalsBlock],
        [BLOCK_LABELS.services, servicesBlock],
        [BLOCK_LABELS.featuredOffers, featuredOffersBlock],
        [NEWS_BLOCK_LABEL, newsBlock],
      ]),
    },
    { label: "Chuyển đổi & Bố cục", fields: [...blocksOf([[BLOCK_LABELS.ctaBanner, ctaBannerBlock]]), blockOrderField] },
    { label: "SEO & Đa ngôn ngữ", fields: blocksOf([["SEO", seoField()], ["Bản dịch tiếng Anh", translationGroup()]]) },
  ]);
}

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
      homepageTabs(),
    ],
  };
}

export const Homepage = createHomepage();
