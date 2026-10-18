import { isValidLocation, type LatLng } from "../../components/media/map-geometry";
import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { Locale } from "../../i18n/routing";
import type { Media, Project, Province, Ward } from "../../payload-types";
import { formatFileSize } from "../format";
import { lexicalPlainText } from "../news/read-time";
import { populatedMedia } from "../news/news-view";

export const PDF_MIME_TYPE = "application/pdf";

/** Mục "Chủ đầu tư" của lưới thông số: `website` chỉ có khi là http(s) (link ra ngoài, mở tab mới). */
export interface DeveloperView {
  name: string;
  website: string | null;
}

export interface FloorPlanView {
  id: string;
  title: string;
  image: MediaImage;
}

export interface DocumentView {
  id: string;
  name: string;
  href: string;
  sizeLabel: string | null;
}

export interface AmenityView {
  id: string;
  name: string;
}

export interface ProjectDetailView {
  title: string;
  summary: string;
  salesStatus: Project["salesStatus"];
  /** "Phường, Tỉnh" ngắn cho hero (rỗng khi chưa có tỉnh/phường đã populate). */
  areaLabel: string | null;
  address: string | null;
  /** Ảnh đại diện của hero = ảnh đầu thư viện (ERD §4.5); `null` khi mọi ảnh đã bị xoá → hero placeholder. */
  hero: MediaImage | null;
  gallery: MediaImage[];
  developer: DeveloperView | null;
  categoryName: string | null;
  scale: { totalUnits?: number; blocks?: number; floors?: number; landAreaM2?: number };
  handoverTime: string | null;
  areaFromM2: number | null;
  areaToM2: number | null;
  priceFromVnd: number | null;
  hasOverview: boolean;
  amenities: AmenityView[];
  floorPlans: FloorPlanView[];
  documents: DocumentView[];
  hasLegal: boolean;
  hasPolicy: boolean;
  location: LatLng | null;
}

const positive = (value: number | null | undefined): number | undefined => (typeof value === "number" && value > 0 ? value : undefined);

const hasText = (value: string | null | undefined): value is string => typeof value === "string" && value.trim() !== "";

const hasUrlAndWidth = (size: { url?: string | null; width?: number | null } | undefined): boolean => Boolean(size?.url && size.width);

/**
 * `ResponsiveImage` chỉ dựng được ảnh có ít nhất một cỡ (đã sinh hoặc ảnh gốc) đủ URL + bề rộng. Cùng quy tắc với `listCandidates` của nó,
 * viết lại ở đây vì file đó là Client Component (`"use client"`): Server Component không gọi được hàm export từ module client.
 */
function hasRenderableSize(media: Media): boolean {
  return [media.sizes?.thumb, media.sizes?.card, media.sizes?.large, { url: media.url, width: media.width }].some(hasUrlAndWidth);
}

/** Ảnh dùng được: đã populate, là ảnh (không phải PDF) và có URL/cỡ để dựng `<img>`. Ảnh bị xoá (FK set null) hoặc chỉ còn id thì bỏ. */
export function renderableImage(value: Media | string | null | undefined): Media | null {
  const media = populatedMedia(value);
  if (!media) return null;
  if (typeof media.mimeType === "string" && !media.mimeType.startsWith("image/")) return null;
  return hasRenderableSize(media) ? media : null;
}

/** Link tệp an toàn: đường dẫn nội bộ (một dấu `/`) hoặc http(s). Chặn `javascript:`, `data:`, `//host`. */
export function safeFileHref(raw: string | null | undefined): string | null {
  const href = raw?.trim();
  if (!href || /[\u0000-\u001f\u007f\s]/.test(href)) return null;
  if (href.startsWith("/")) return href.startsWith("//") || href.startsWith("/\\") ? null : href;
  try {
    const { protocol } = new URL(href);
    return protocol === "https:" || protocol === "http:" ? href : null;
  } catch {
    return null;
  }
}

function documentName(media: Media): string {
  const fromFilename = media.filename?.replace(/\.[^.]+$/, "");
  return [media.caption, media.alt, fromFilename].find(hasText)?.trim() ?? "PDF";
}

function toDocuments(items: Project["documents"], locale: Locale): DocumentView[] {
  return (items ?? []).flatMap((item) => {
    const media = populatedMedia(item);
    const href = media?.mimeType === PDF_MIME_TYPE ? safeFileHref(media.url) : null;
    if (!media || !href) return [];
    return [{ id: media.id, name: documentName(media), href, sizeLabel: media.filesize ? formatFileSize(media.filesize, locale) : null }];
  });
}

function toFloorPlans(items: Project["floorPlans"], projectTitle: string): FloorPlanView[] {
  return (items ?? []).flatMap((plan, index) => {
    const media = renderableImage(plan.image);
    if (!media || !hasText(plan.title)) return [];
    return [{ id: plan.id ?? String(index), title: plan.title, image: { ...media, alt: media.alt?.trim() || `${plan.title} - ${projectTitle}` } }];
  });
}

function toDeveloper(developer: Project["developer"]): DeveloperView | null {
  if (!developer || typeof developer !== "object" || !hasText(developer.name)) return null;
  const website = developer.website?.trim();
  const safeWebsite = website && /^https?:\/\//i.test(website) ? safeFileHref(website) : null;
  return { name: developer.name, website: safeWebsite };
}

function toLocation(point: Project["location"]): LatLng | null {
  // Payload `point` là [kinh độ, vĩ độ].
  const [lng, lat] = point ?? [];
  const location = { lat, lng };
  return isValidLocation(location) ? location : null;
}

function areaLabel(ward: Project["ward"], province: Project["province"]): string | null {
  const wardName = ward && typeof ward === "object" ? (ward as Ward).name : null;
  const provinceName = province && typeof province === "object" ? ((province as Province).shortName || (province as Province).name) : null;
  const parts = [wardName, provinceName].filter(hasText);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * View model trang chi tiết dự án (S03) từ doc đã populate `depth: 1`. Thuần (không đụng Payload) nên test được. Khối nào thiếu dữ
 * liệu thì rỗng/`null` để trang ẩn khối đó (không render tiêu đề trống). Ảnh gallery mất alt thì dùng "Tên dự án - n" (không để alt rỗng).
 */
export function toProjectDetailView(doc: Project, locale: Locale): ProjectDetailView {
  const title = doc.title ?? "";
  const gallery = (doc.gallery ?? []).flatMap((item, index) => {
    const media = renderableImage(item);
    return media ? [{ ...media, alt: media.alt?.trim() || `${title} - ${index + 1}` }] : [];
  });
  const category = doc.category && typeof doc.category === "object" && doc.category.name && (locale === "vi" || doc.category.hasEnglish === true) ? doc.category.name : null;
  const scale = doc.scale ?? {};
  return {
    title,
    summary: doc.summary ?? "",
    salesStatus: doc.salesStatus,
    areaLabel: areaLabel(doc.ward, doc.province),
    address: hasText(doc.address) ? doc.address.trim() : null,
    hero: gallery[0] ?? null,
    gallery,
    developer: toDeveloper(doc.developer),
    categoryName: category,
    scale: {
      ...(positive(scale.totalUnits) ? { totalUnits: positive(scale.totalUnits) } : {}),
      ...(positive(scale.blocks) ? { blocks: positive(scale.blocks) } : {}),
      ...(positive(scale.floors) ? { floors: positive(scale.floors) } : {}),
      ...(positive(scale.landAreaM2) ? { landAreaM2: positive(scale.landAreaM2) } : {}),
    },
    handoverTime: hasText(scale.handoverTime) ? scale.handoverTime.trim() : null,
    areaFromM2: positive(doc.areaFromM2) ?? null,
    areaToM2: positive(doc.areaToM2) ?? null,
    priceFromVnd: positive(doc.priceFromVnd) ?? null,
    hasOverview: lexicalPlainText(doc.overview).trim() !== "",
    amenities: (doc.amenities ?? []).flatMap((item, index) => (hasText(item.name) ? [{ id: item.id ?? String(index), name: item.name.trim() }] : [])),
    floorPlans: toFloorPlans(doc.floorPlans, title),
    documents: toDocuments(doc.documents, locale),
    hasLegal: lexicalPlainText(doc.legalInfo).trim() !== "",
    hasPolicy: lexicalPlainText(doc.salesPolicy).trim() !== "",
    location: toLocation(doc.location),
  };
}

/** Mã mục của thanh mục con, theo thứ tự hiển thị (design-spec S03 khối 3). */
export const SECTION_IDS = ["overview", "location", "amenities", "floorPlans", "legal", "policy", "gallery"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** Mục có dữ liệu mới vào thanh mục con. Tổng quan luôn có (mô tả ngắn `summary` bắt buộc ở bản vi và `en` khi xuất bản). */
export function visibleSections(view: ProjectDetailView): SectionId[] {
  const present: Record<SectionId, boolean> = {
    overview: true,
    location: view.location !== null || view.address !== null,
    amenities: view.amenities.length > 0,
    floorPlans: view.floorPlans.length > 0,
    legal: view.hasLegal,
    policy: view.hasPolicy,
    gallery: view.gallery.length > 0,
  };
  return SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích của thanh mục con và neo `#...`), không dịch theo ngôn ngữ để link chia sẻ dùng được ở cả hai bản. */
export const SECTION_DOM_ID: Record<SectionId, string> = {
  overview: "overview",
  location: "location",
  amenities: "amenities",
  floorPlans: "floor-plans",
  legal: "legal",
  policy: "sales-policy",
  gallery: "gallery",
};

export const DOCUMENTS_DOM_ID = "documents";
export const LEAD_FORM_DOM_ID = "lead-form";
