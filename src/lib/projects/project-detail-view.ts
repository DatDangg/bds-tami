import { isValidLocation, type LatLng } from "../../components/media/map-geometry";
import type { MediaImage } from "../../components/media/ResponsiveImage";
import { parseVideoUrl } from "../../components/media/video-url";
import type { Locale } from "../../i18n/routing";
import type { Media, Project, Province, Ward } from "../../payload-types";
import { PROPERTY_TYPES, type PropertyType } from "../../shared/listing-options";
import { formatArea, formatFileSize, formatNumber } from "../format";
import { lexicalPlainText } from "../news/read-time";
import { populatedMedia } from "../news/news-view";

const SQUARE_METERS_PER_HECTARE = 10_000;

/** Diện tích đất m² → số ha đã định dạng theo ngôn ngữ, tối đa 2 chữ số lẻ ("36,21" · "36.21"); đơn vị "ha" do chuỗi i18n thêm. */
export function formatHectares(squareMeters: number, locale: Locale): string {
  return formatNumber(squareMeters / SQUARE_METERS_PER_HECTARE, locale);
}

/** Khoảng diện tích "55 – 136 m²"; một đầu hoặc hai đầu bằng nhau → "55 m²"; không có → `null`. */
export function formatAreaRange(from: number | null, to: number | null, locale: Locale): string | null {
  const [low, high] = [from, to].filter((value): value is number => value !== null).sort((a, b) => a - b);
  if (low === undefined) return null;
  return high === undefined || high === low ? formatArea(low, locale) : `${formatNumber(low, locale)} – ${formatArea(high, locale)}`;
}

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
  description: string | null;
}

/** Thẻ "Sản phẩm" trong Tổng quan (BL-052): số lượng + loại + khoảng diện tích; số 0 / âm coi như chưa nhập. */
export interface ProductView {
  id: string;
  type: string;
  count: number | null;
  areaFrom: number | null;
  areaTo: number | null;
}

export interface HighlightView {
  id: string;
  title: string;
  description: string | null;
}

/** Nhóm tiện ích quanh dự án (cùng giá trị với trường `category` của schema), theo thứ tự hiển thị của các tab. */
export type NearbyCategory = NonNullable<Project["nearbyAmenities"]>[number]["category"];
export const NEARBY_CATEGORY_ORDER: readonly NearbyCategory[] = ["education", "healthcare", "shopping", "park", "transport", "other"];

export interface NearbyItemView {
  id: string;
  name: string;
  distance: string | null;
  location: LatLng | null;
}

/** Chỉ các nhóm có dòng (tab rỗng không hiện), đúng thứ tự `NEARBY_CATEGORY_ORDER`. */
export interface NearbyGroupView {
  category: NearbyCategory;
  items: NearbyItemView[];
}

export type PriceAvailability = NonNullable<NonNullable<Project["priceTable"]>[number]["availability"]>;

export interface PriceRowView {
  id: string;
  unitType: string;
  areaFrom: number | null;
  areaTo: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  availability: PriceAvailability | null;
  note: string | null;
}

export interface FaqView {
  id: string;
  question: string;
  answer: string;
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
  /** Giá "Giá từ" hiển thị (BL-052): xem `projectPriceFromVnd`. */
  displayPriceFromVnd: number | null;
  /** Loại sản phẩm theo thứ tự `PROPERTY_TYPES` (nhãn i18n `listingOptions.propertyType`). */
  productTypes: PropertyType[];
  products: ProductView[];
  /** Link video đã qua whitelist YouTube/TikTok (`parseVideoUrl`); khác → `null`, không nút video. */
  videoUrl: string | null;
  hasOverview: boolean;
  amenities: AmenityView[];
  /** Ảnh lớn khối Tiện ích nổi bật; thiếu / đã xoá → `null` (danh sách rộng hết). */
  amenitiesImage: MediaImage | null;
  floorPlans: FloorPlanView[];
  documents: DocumentView[];
  hasLegal: boolean;
  hasPolicy: boolean;
  location: LatLng | null;
  highlights: HighlightView[];
  nearby: NearbyGroupView[];
  priceRows: PriceRowView[];
  /** Ngày cập nhật bảng giá (ISO) — chỉ có nghĩa khi có `priceRows`. */
  priceUpdatedAt: string | null;
  faqs: FaqView[];
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

/** 0 và số âm coi như chưa nhập (hiện "Liên hệ" / "—"), không hiện "Từ 0 ₫". */
const numberOrNull = (value: number | null | undefined): number | null => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);

const trimmedOrNull = (value: string | null | undefined): string | null => (hasText(value) ? value.trim() : null);

/** Dòng thiếu chữ (vd bản EN chưa dịch: `/en` không rơi về tiếng Việt) bị bỏ, không hiện ô trống. */
function toHighlights(items: Project["highlights"]): HighlightView[] {
  return (items ?? []).flatMap((item, index) => (hasText(item.title) ? [{ id: item.id ?? String(index), title: item.title.trim(), description: trimmedOrNull(item.description) }] : []));
}

function toNearby(items: Project["nearbyAmenities"]): NearbyGroupView[] {
  const rows = (items ?? []).flatMap((item, index) =>
    hasText(item.name) ? [{ category: item.category, view: { id: item.id ?? String(index), name: item.name.trim(), distance: trimmedOrNull(item.distance), location: toLocation(item.location) } }] : [],
  );
  return NEARBY_CATEGORY_ORDER.flatMap((category) => {
    const groupItems = rows.filter((row) => row.category === category).map((row) => row.view);
    return groupItems.length > 0 ? [{ category, items: groupItems }] : [];
  });
}

function toPriceRows(items: Project["priceTable"]): PriceRowView[] {
  return (items ?? []).flatMap((item, index) =>
    hasText(item.unitType)
      ? [
          {
            id: item.id ?? String(index),
            unitType: item.unitType.trim(),
            areaFrom: numberOrNull(item.areaFrom),
            areaTo: numberOrNull(item.areaTo),
            priceFrom: numberOrNull(item.priceFrom),
            priceTo: numberOrNull(item.priceTo),
            availability: item.availability ?? null,
            note: trimmedOrNull(item.note),
          },
        ]
      : [],
  );
}

/** Chỉ câu hỏi có đủ cả câu hỏi và trả lời ở ngôn ngữ đang xem (cùng tập dùng cho accordion và JSON-LD). */
function toFaqs(items: Project["faqs"]): FaqView[] {
  return (items ?? []).flatMap((item, index) => (hasText(item.question) && hasText(item.answer) ? [{ id: item.id ?? String(index), question: item.question.trim(), answer: item.answer.trim() }] : []));
}

/**
 * Giá "Giá từ" của trang chi tiết (BL-052): giá thấp nhất > 0 của bảng giá (`priceTable[].priceFrom`), không có thì `priceFromVnd`, không có nữa → `null` ("Liên hệ").
 * Đọc thẳng `priceTable` (số không localized) nên `/en` cùng giá dù dòng bảng giá thiếu chữ EN. Thuần — P1-T04/T05 gom về helper chung của thẻ / danh sách.
 */
export function projectPriceFromVnd(doc: Pick<Project, "priceTable" | "priceFromVnd">): number | null {
  const fromTable = (doc.priceTable ?? []).flatMap((row) => numberOrNull(row.priceFrom) ?? []);
  return fromTable.length > 0 ? Math.min(...fromTable) : numberOrNull(doc.priceFromVnd);
}

function toProducts(items: Project["products"]): ProductView[] {
  return (items ?? []).flatMap((item, index) =>
    hasText(item.type) ? [{ id: item.id ?? String(index), type: item.type.trim(), count: numberOrNull(item.count), areaFrom: numberOrNull(item.areaFrom), areaTo: numberOrNull(item.areaTo) }] : [],
  );
}

function toProductTypes(values: Project["productTypes"]): PropertyType[] {
  const chosen = new Set(values ?? []);
  return PROPERTY_TYPES.filter((value) => chosen.has(value));
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
  const amenitiesImage = renderableImage(doc.amenitiesImage);
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
    displayPriceFromVnd: projectPriceFromVnd(doc),
    productTypes: toProductTypes(doc.productTypes),
    products: toProducts(doc.products),
    videoUrl: parseVideoUrl(doc.videoUrl) ? (doc.videoUrl?.trim() ?? null) : null,
    hasOverview: lexicalPlainText(doc.overview).trim() !== "",
    amenities: (doc.amenities ?? []).flatMap((item, index) => (hasText(item.name) ? [{ id: item.id ?? String(index), name: item.name.trim(), description: trimmedOrNull(item.description) }] : [])),
    amenitiesImage: amenitiesImage ? { ...amenitiesImage, alt: amenitiesImage.alt?.trim() || title } : null,
    floorPlans: toFloorPlans(doc.floorPlans, title),
    documents: toDocuments(doc.documents, locale),
    hasLegal: lexicalPlainText(doc.legalInfo).trim() !== "",
    hasPolicy: lexicalPlainText(doc.salesPolicy).trim() !== "",
    location: toLocation(doc.location),
    highlights: toHighlights(doc.highlights),
    nearby: toNearby(doc.nearbyAmenities),
    priceRows: toPriceRows(doc.priceTable),
    priceUpdatedAt: trimmedOrNull(doc.priceUpdatedAt),
    faqs: toFaqs(doc.faqs),
  };
}

/**
 * Mã mục của thanh mục con, theo thứ tự hiển thị (BL-052, design `detail-du-an`): Tổng quan · Vị trí · Tiện ích · Hình ảnh, rồi các khối giữ lại
 * (Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp). "Hình ảnh" thêm lại khối ảnh mà BL-045 Q7 đã bỏ.
 */
export const SECTION_IDS = ["overview", "location", "amenities", "gallery", "highlights", "floorPlans", "pricing", "legal", "policy", "listings", "faq"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/**
 * Mục có dữ liệu mới vào thanh mục con. Tổng quan luôn có (mô tả ngắn `summary` bắt buộc ở bản vi và `en` khi xuất bản). "Tin liên quan" không nằm trong view
 * (đọc từ truy vấn riêng) nên trang báo qua `hasListings`.
 */
export function visibleSections(view: ProjectDetailView, { hasListings = false }: { hasListings?: boolean } = {}): SectionId[] {
  const present: Record<SectionId, boolean> = {
    overview: true,
    highlights: view.highlights.length > 0,
    location: view.location !== null || view.address !== null || view.nearby.length > 0,
    amenities: view.amenities.length > 0,
    // 1 ảnh đã là nền hero: khối Hình ảnh chỉ có nghĩa từ 2 ảnh.
    gallery: view.gallery.length > 1,
    floorPlans: view.floorPlans.length > 0,
    // Pháp lý gộp richText + tài liệu PDF: chỉ có tài liệu vẫn là một khối Pháp lý.
    legal: view.hasLegal || view.documents.length > 0,
    policy: view.hasPolicy,
    pricing: view.priceRows.length > 0,
    listings: hasListings,
    faq: view.faqs.length > 0,
  };
  return SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích của thanh mục con và neo `#...`), không dịch theo ngôn ngữ để link chia sẻ dùng được ở cả hai bản. */
export const SECTION_DOM_ID: Record<SectionId, string> = {
  overview: "overview",
  highlights: "highlights",
  location: "location",
  amenities: "amenities",
  gallery: "gallery",
  floorPlans: "floor-plans",
  legal: "legal",
  policy: "sales-policy",
  pricing: "pricing",
  listings: "related-listings",
  faq: "faq",
};

export const DOCUMENTS_DOM_ID = "documents";
export const LEAD_FORM_DOM_ID = "lead-form";
