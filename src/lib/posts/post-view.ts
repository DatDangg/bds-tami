import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { Locale } from "../../i18n/routing";
import type { Category, Project, Province, PropertyPost, Rental, Ward } from "../../payload-types";
import type { PropertyType } from "../../shared/listing-options";
import { daysUntilDeadline } from "../careers/deadline";
import { CONTENT_ROUTES, publicPath } from "../content/content-paths";
import { isOfferEnded } from "../content/offer-status";
import { publicDetailPath } from "../content/redirect-paths";
import { formatDate, formatVnd, formatVndCompact } from "../format";
import { visibleCategory } from "../news/news-view";
import { renderableImage } from "../projects/project-detail-view";
import { hasPostOffer, isVoucherPost, validOfferEndAt } from "./post-kind";

/** Ưu đãi còn từng này ngày (hoặc ít hơn) thì hiện badge cảnh báo (design-spec S08/S09). */
export const OFFER_ENDING_SOON_DAYS = 3;

export type OfferBadge = { kind: "ended" } | { kind: "endingSoon"; daysLeft: number };

/** "Đã kết thúc" lấy từ `isOfferEnded` (nguồn duy nhất, BR-06); sắp hết hạn = còn ≤ 3 ngày theo lịch giờ VN. Không có `offer.endAt` → không badge. */
export function offerBadge(post: Pick<PropertyPost, "offer">, now: Date): OfferBadge | null {
  if (isOfferEnded(post, now)) return { kind: "ended" };
  const endAt = post.offer?.endAt;
  const daysLeft = endAt ? daysUntilDeadline(endAt, now) : null;
  return daysLeft !== null && daysLeft <= OFFER_ENDING_SOON_DAYS ? { kind: "endingSoon", daysLeft } : null;
}

const hasText = (value: string | null | undefined): value is string => typeof value === "string" && value.trim() !== "";

/** Whitelist trường ảnh công khai trước khi vào props Client Component: không để lọt trường nội bộ của doc media (vd `uploadedBy`). */
export function toPublicImage(media: MediaImage | null): MediaImage | null {
  if (!media) return null;
  return { url: media.url ?? null, alt: media.alt ?? null, width: media.width ?? null, ...(media.sizes ? { sizes: media.sizes } : {}) };
}

export interface PostLink {
  label: string;
  href: string;
}

export function postCategoryHref(category: Category, locale: Locale): string {
  return publicPath("/tin-bds/danh-muc/[category]", locale, { category: category.slug ?? "" });
}

function categoryLink(category: Category | null, locale: Locale): PostLink | null {
  return category?.name && category.slug ? { label: category.name, href: postCategoryHref(category, locale) } : null;
}

/** Giá hiển thị: số tiền (đầy đủ ở trang chi tiết, rút gọn ở thẻ) hoặc ghi chú giá; không có cả hai → `null`. */
function priceLabel(post: Pick<PropertyPost, "priceVnd" | "priceNote">, locale: Locale, compact: boolean): string | null {
  const amount = typeof post.priceVnd === "number" && post.priceVnd > 0 ? post.priceVnd : null;
  if (amount !== null) return compact ? formatVndCompact(amount, locale) : formatVnd(amount, locale);
  return hasText(post.priceNote) ? post.priceNote.trim() : null;
}

export interface PostCardData {
  id: string;
  title: string;
  href: string;
  excerpt: string;
  /** ISO, cho `<time datetime>`. */
  publishedAt: string | null;
  dateLabel: string | null;
  categoryName: string | null;
  cover: MediaImage | null;
  priceLabel: string | null;
  badge: OfferBadge | null;
  /** "dd/mm/yyyy" của hạn ưu đãi (có `offer.endAt` hợp lệ), cho dòng "Đến ngày". */
  endLabel: string | null;
  /**
   * BL-052 — thẻ nào ở danh sách: `voucher` khi tin có ưu đãi (`offer.endAt` hoặc `offer.voucherCode`) VÀ không có giá lẫn diện tích;
   * còn lại `property` (tin bán kèm ưu đãi vẫn là thẻ BĐS, thêm badge ưu đãi).
   */
  kind: "property" | "voucher";
  /** Có ưu đãi (hạn hợp lệ hoặc mã voucher) — badge "Ưu đãi" / trạng thái trên thẻ. */
  hasOffer: boolean;
  propertyType: PropertyType | null;
  /** "Phường, Tỉnh" (phần nào có thì in). */
  placeLabel: string | null;
  /** > 0 hoặc `null`. */
  areaM2: number | null;
  bedrooms: number | null;
}

const positiveOrNull = (value: number | null | undefined): number | null => (typeof value === "number" && value > 0 ? value : null);

export function toPostCardData(doc: PropertyPost, locale: Locale, now: Date): PostCardData | null {
  // Bài không có tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng.
  if (!doc.title || !doc.slug) return null;
  const published = doc.publishedAt ?? null;
  const endAt = validOfferEndAt(doc);
  const areaM2 = positiveOrNull(doc.areaM2);
  return {
    kind: isVoucherPost(doc) ? "voucher" : "property",
    hasOffer: hasPostOffer(doc),
    propertyType: doc.propertyType ?? null,
    placeLabel: placeLabel(doc.ward, doc.province),
    areaM2,
    bedrooms: typeof doc.bedrooms === "number" && doc.bedrooms >= 0 ? doc.bedrooms : null,
    id: doc.id,
    title: doc.title,
    href: publicDetailPath(CONTENT_ROUTES["property-posts"], locale, doc.slug),
    excerpt: doc.excerpt ?? "",
    publishedAt: published,
    dateLabel: published ? formatDate(published, locale) : null,
    categoryName: visibleCategory(doc.category, locale)?.name ?? null,
    cover: toPublicImage(renderableImage(doc.cover)),
    priceLabel: priceLabel(doc, locale, true),
    badge: offerBadge(doc, now),
    endLabel: endAt ? formatDate(endAt, locale) : null,
  };
}

export function toPostCards(docs: readonly PropertyPost[], locale: Locale, now: Date): PostCardData[] {
  return docs.flatMap((doc) => {
    const card = toPostCardData(doc, locale, now);
    return card ? [card] : [];
  });
}

export interface RelatedTargetView {
  kind: "project" | "rental";
  title: string;
  href: string;
  image: MediaImage | null;
}

export interface PostOfferView {
  badge: OfferBadge | null;
  ended: boolean;
  /** Giá (số tiền hoặc ghi chú giá). */
  price: string | null;
  /** "Phường, Tỉnh" (phần nào có thì in). */
  areaLabel: string | null;
  period: { startLabel: string | null; endLabel: string | null } | null;
  /** `null` khi đã kết thúc: mã không được có trong HTML của ưu đãi hết hạn (BR-06). */
  voucherCode: string | null;
  terms: string | null;
  related: RelatedTargetView[];
}

function placeLabel(ward: PropertyPost["ward"], province: PropertyPost["province"]): string | null {
  const wardName = ward && typeof ward === "object" ? (ward as Ward).name : null;
  const provinceName = province && typeof province === "object" ? ((province as Province).shortName || (province as Province).name) : null;
  const parts = [wardName, provinceName].filter(hasText);
  return parts.length > 0 ? parts.join(", ") : null;
}

function relatedTarget(kind: RelatedTargetView["kind"], doc: Project | Rental | null, locale: Locale): RelatedTargetView | null {
  if (!doc?.title || !doc.slug) return null;
  const route = kind === "project" ? CONTENT_ROUTES.projects : CONTENT_ROUTES.rentals;
  const firstImage = (doc.gallery ?? []).map(renderableImage).find((media) => media !== null) ?? null;
  return { kind, title: doc.title, href: publicDetailPath(route, locale, doc.slug), image: toPublicImage(firstImage) };
}

export interface RelatedDocs {
  project: Project | null;
  rental: Rental | null;
}

/**
 * Khối ưu đãi của S09 (đặt trước nội dung): giá, khu vực, thời hạn, trạng thái, mã voucher, điều khoản, dự án/tin cho thuê liên quan.
 * `null` khi bài không có gì trong số đó (không dựng khung rỗng). Thuần (không đụng Payload) nên test được.
 */
export function toPostOfferView(doc: PropertyPost, locale: Locale, now: Date, related: RelatedDocs): PostOfferView | null {
  const offer = doc.offer;
  const ended = isOfferEnded(doc, now);
  const startAt = hasText(offer?.startAt) ? offer.startAt : null;
  const endAt = hasText(offer?.endAt) && !Number.isNaN(new Date(offer.endAt).getTime()) ? offer.endAt : null;
  const code = hasText(offer?.voucherCode) ? offer.voucherCode.trim() : null;
  const view: PostOfferView = {
    badge: offerBadge(doc, now),
    ended,
    price: priceLabel(doc, locale, false),
    areaLabel: placeLabel(doc.ward, doc.province),
    period: startAt || endAt ? { startLabel: startAt ? formatDate(startAt, locale) : null, endLabel: endAt ? formatDate(endAt, locale) : null } : null,
    voucherCode: ended ? null : code,
    terms: hasText(offer?.terms) ? offer.terms.trim() : null,
    related: [relatedTarget("project", related.project, locale), relatedTarget("rental", related.rental, locale)].flatMap((item) => (item ? [item] : [])),
  };
  // Mã voucher của ưu đãi đã kết thúc vẫn là "có ưu đãi" (cần hiện dòng "đã kết thúc"): tính theo dữ liệu gốc, không theo `voucherCode` đã ẩn.
  const hasOffer = view.badge !== null || view.period !== null || code !== null || view.terms !== null;
  const hasContent = hasOffer || view.price !== null || view.areaLabel !== null || view.related.length > 0;
  return hasContent ? view : null;
}

export interface PostDetailView {
  title: string;
  category: PostLink | null;
  parentCategory: PostLink | null;
  publishedAtIso: string | null;
  publishedAtLabel: string | null;
  cover: MediaImage | null;
  gallery: MediaImage[];
}

export function toPostDetailView(doc: PropertyPost, locale: Locale): PostDetailView {
  const title = doc.title ?? "";
  const category = visibleCategory(doc.category, locale);
  const gallery = (doc.gallery ?? []).flatMap((item, index) => {
    const media = toPublicImage(renderableImage(item));
    return media ? [{ ...media, alt: media.alt?.trim() || `${title} - ${index + 1}` }] : [];
  });
  const cover = toPublicImage(renderableImage(doc.cover));
  return {
    title,
    category: categoryLink(category, locale),
    parentCategory: categoryLink(category ? visibleCategory(category.parent, locale) : null, locale),
    publishedAtIso: doc.publishedAt ?? null,
    publishedAtLabel: doc.publishedAt ? formatDate(doc.publishedAt, locale) : null,
    cover: cover ? { ...cover, alt: cover.alt?.trim() || title } : null,
    gallery,
  };
}
