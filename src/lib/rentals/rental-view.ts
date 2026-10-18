import { toTelHref } from "../../components/layout/shell-data";
import { approximateLocation, isValidLocation, type LatLng } from "../../components/media/map-geometry";
import type { MediaImage } from "../../components/media/ResponsiveImage";
import { parseVideoUrl } from "../../components/media/video-url";
import type { Locale } from "../../i18n/routing";
import type { Category, Project, Province, Rental, Ward } from "../../payload-types";
import { CONTENT_ROUTES, publicPath } from "../content/content-paths";
import { publicDetailPath } from "../content/redirect-paths";
import { formatDate } from "../format";
import { visibleCategory } from "../news/news-view";
import { lexicalPlainText } from "../news/read-time";
import { renderableImage } from "../projects/project-detail-view";
import type { SaleContact } from "./rental-queries";

export type RentalDirection = NonNullable<Rental["houseDirection"]>;
export type RentalFurnishing = NonNullable<Rental["furnishing"]>;
export type RentalPaymentCycle = NonNullable<NonNullable<Rental["rentalTerms"]>["paymentCycle"]>;
export type RentalService = NonNullable<NonNullable<Rental["rentalTerms"]>["includedServices"]>[number];

export interface RentalTermsView {
  minLeaseMonths: number | null;
  depositMonths: number | null;
  paymentCycle: RentalPaymentCycle | null;
  services: RentalService[];
  availableFromIso: string | null;
  availableFromLabel: string | null;
}

export interface RentalLink {
  label: string;
  href: string;
}

export interface RentalDetailView {
  code: string;
  title: string;
  /** `status = rented` (BR-01): trang vẫn mở nhưng đánh dấu "Đã thuê". */
  rented: boolean;
  /** Giá thuê/tháng (VNĐ); `null` khi "Thoả thuận" (tick thoả thuận hoặc chưa nhập giá). */
  priceMonthlyVnd: number | null;
  areaM2: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  houseDirection: RentalDirection | null;
  balconyDirection: RentalDirection | null;
  furnishing: RentalFurnishing | null;
  category: RentalLink | null;
  project: RentalLink | null;
  postedAtIso: string | null;
  postedAtLabel: string | null;
  /** "[số nhà + đường,] phường, tỉnh": số nhà/đường chỉ khi `showExactAddress`. */
  addressLine: string;
  gallery: MediaImage[];
  videoUrl: string | null;
  terms: RentalTermsView;
  hasTerms: boolean;
  hasDescription: boolean;
  legalNote: string | null;
  /**
   * Toạ độ ĐƯỢC PHÉP đưa vào props Client Component (`LazyMap`): tin ẩn địa chỉ thì đã làm tròn (`approximateLocation`, contract
   * layer-2-task-08); toạ độ thật không bao giờ rời khỏi hàm dựng view này.
   */
  map: { location: LatLng; approximate: boolean } | null;
}

const hasText = (value: string | null | undefined): value is string => typeof value === "string" && value.trim() !== "";
const positive = (value: number | null | undefined): number | null => (typeof value === "number" && value > 0 ? value : null);
const nonNegative = (value: number | null | undefined): number | null => (typeof value === "number" && value >= 0 ? value : null);

function placeNames(ward: Rental["ward"], province: Rental["province"]): string[] {
  const wardName = ward && typeof ward === "object" ? (ward as Ward).name : null;
  const provinceName = province && typeof province === "object" ? ((province as Province).shortName || (province as Province).name) : null;
  return [wardName, provinceName].filter(hasText);
}

function addressLine(doc: Rental): string {
  // `address` bị chặn ở cấp trường với khách khi `showExactAddress = false` (undefined) nên chỉ in khi tin cho phép.
  const street = doc.showExactAddress === true && hasText(doc.address) ? [doc.address.trim()] : [];
  return [...street, ...placeNames(doc.ward, doc.province)].join(", ");
}

function categoryLink(category: Category | null, locale: Locale): RentalLink | null {
  return category?.name && category.slug
    ? { label: category.name, href: publicPath("/cho-thue/danh-muc/[category]", locale, { category: category.slug }) }
    : null;
}

function projectLink(project: Rental["project"], locale: Locale): RentalLink | null {
  if (!project || typeof project !== "object") return null;
  const { title, slug, hasEnglish } = project as Project;
  // Dự án populate chỉ qua access.read (không lọc hasEnglish): ở /en bỏ dự án chưa có bản EN để khỏi link tới 404.
  if (!title || !slug || (locale === "en" && hasEnglish !== true)) return null;
  return { label: title, href: publicDetailPath(CONTENT_ROUTES.projects, locale, slug) };
}

function toTerms(terms: Rental["rentalTerms"], locale: Locale): RentalTermsView {
  const availableFrom = hasText(terms?.availableFrom) ? terms.availableFrom : null;
  return {
    minLeaseMonths: positive(terms?.minLeaseMonths),
    depositMonths: nonNegative(terms?.depositMonths),
    paymentCycle: terms?.paymentCycle ?? null,
    services: terms?.includedServices ?? [],
    availableFromIso: availableFrom,
    availableFromLabel: availableFrom ? formatDate(availableFrom, locale) : null,
  };
}

function hasAnyTerm(terms: RentalTermsView): boolean {
  return (
    terms.minLeaseMonths !== null ||
    terms.depositMonths !== null ||
    terms.paymentCycle !== null ||
    terms.services.length > 0 ||
    terms.availableFromLabel !== null
  );
}

/** Payload `point` là [kinh độ, vĩ độ]. */
function toLatLng(point: readonly number[] | null | undefined): LatLng | null {
  const [lng, lat] = point ?? [];
  const location = { lat, lng };
  return isValidLocation(location) ? location : null;
}

/**
 * Bản đồ của tin: ghim chính xác chỉ khi `showExactAddress` (toạ độ doc, khách đọc được); ngược lại dùng `hiddenLocation` (đọc server-side bằng
 * `overrideAccess`) ĐÃ làm tròn qua `approximateLocation`. Props Client Component bị serialize vào HTML công khai nên toạ độ thật không được lọt qua đây.
 */
function toMap(doc: Rental, hiddenLocation: readonly number[] | null | undefined): RentalDetailView["map"] {
  if (doc.showExactAddress === true) {
    const exact = toLatLng(doc.location);
    return exact ? { location: exact, approximate: false } : null;
  }
  const hidden = toLatLng(hiddenLocation ?? doc.location);
  return hidden ? { location: approximateLocation(hidden), approximate: true } : null;
}

/**
 * View model trang chi tiết tin cho thuê (S07) từ doc đã populate `depth: 1`. Thuần (không đụng Payload) nên test được. `hiddenLocation` là toạ độ đọc
 * server-side khi `location` bị chặn với khách. Mọi trường chặn theo `showExactAddress` (`address`, `location`) coi là tuỳ chọn: thiếu thì không in.
 */
export function toRentalDetailView(doc: Rental, locale: Locale, hiddenLocation?: readonly number[] | null): RentalDetailView {
  const title = doc.title ?? "";
  const gallery = (doc.gallery ?? []).flatMap((item, index) => {
    const media = renderableImage(item);
    return media ? [{ ...media, alt: media.alt?.trim() || `${title} - ${index + 1}` }] : [];
  });
  const terms = toTerms(doc.rentalTerms, locale);
  const rawVideo = doc.videoUrl?.trim();
  return {
    code: doc.code,
    title,
    rented: doc.status === "rented",
    priceMonthlyVnd: doc.priceNegotiable === true ? null : positive(doc.priceMonthlyVnd),
    areaM2: doc.areaM2,
    bedrooms: nonNegative(doc.bedrooms),
    bathrooms: nonNegative(doc.bathrooms),
    floor: hasText(doc.floor) ? doc.floor.trim() : null,
    houseDirection: doc.houseDirection ?? null,
    balconyDirection: doc.balconyDirection ?? null,
    furnishing: doc.furnishing ?? null,
    category: categoryLink(visibleCategory(doc.category, locale), locale),
    project: projectLink(doc.project, locale),
    postedAtIso: doc.publishedAt ?? null,
    postedAtLabel: doc.publishedAt ? formatDate(doc.publishedAt, locale) : null,
    addressLine: addressLine(doc),
    gallery,
    videoUrl: rawVideo && parseVideoUrl(rawVideo) ? rawVideo : null,
    terms,
    hasTerms: hasAnyTerm(terms),
    hasDescription: lexicalPlainText(doc.description).trim() !== "",
    legalNote: hasText(doc.legalNote) ? doc.legalNote.trim() : null,
    map: toMap(doc, hiddenLocation),
  };
}

export interface RentalCardData {
  id: string;
  title: string;
  href: string;
  code: string;
  priceMonthlyVnd: number | null;
  areaM2: number;
  bedrooms: number | null;
  /** "Phường, Tỉnh" ngắn; rỗng khi chưa populate. */
  areaLabel: string;
  cover: MediaImage | null;
}

export function toRentalCardData(doc: Rental, locale: Locale): RentalCardData | null {
  // Tin không có tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng.
  if (!doc.title || !doc.slug) return null;
  const cover = toPublicImage((doc.gallery ?? []).map(renderableImage).find((media) => media !== null) ?? null);
  return {
    id: doc.id,
    title: doc.title,
    href: publicDetailPath(CONTENT_ROUTES.rentals, locale, doc.slug),
    code: doc.code,
    priceMonthlyVnd: doc.priceNegotiable === true ? null : positive(doc.priceMonthlyVnd),
    areaM2: doc.areaM2,
    bedrooms: nonNegative(doc.bedrooms),
    areaLabel: placeNames(doc.ward, doc.province).join(", "),
    cover,
  };
}

export function toRentalCards(docs: readonly Rental[], locale: Locale): RentalCardData[] {
  return docs.flatMap((doc) => {
    const card = toRentalCardData(doc, locale);
    return card ? [card] : [];
  });
}

/** Whitelist trường ảnh công khai trước khi vào props Client Component: không để lọt trường nội bộ của doc media (vd `uploadedBy`). */
function toPublicImage(media: MediaImage | null): MediaImage | null {
  if (!media) return null;
  return { url: media.url ?? null, alt: media.alt ?? null, width: media.width ?? null, ...(media.sizes ? { sizes: media.sizes } : {}) };
}

/** Người phụ trách hiện cho khách: tên, SĐT hiển thị + `tel:`, ảnh. */
export interface SaleContactView {
  name: string;
  phoneLabel: string;
  telHref: string;
  avatar: MediaImage | null;
}

/**
 * Sale hiển thị được = đang hoạt động (đã lọc ở `findActiveSaleContact`) VÀ có SĐT gọi được: thiếu SĐT thì tên không có tác dụng,
 * trả `null` để trang dùng hotline chung (cùng nhánh với sale bị khoá, không lộ tên).
 */
export function toSaleContactView(contact: SaleContact | null): SaleContactView | null {
  const phoneLabel = contact?.phone?.trim();
  const telHref = phoneLabel ? toTelHref(phoneLabel) : "";
  if (!contact || !phoneLabel || !telHref || !hasText(contact.fullName)) return null;
  return { name: contact.fullName.trim(), phoneLabel, telHref, avatar: toPublicImage(renderableImage(contact.avatar)) };
}
