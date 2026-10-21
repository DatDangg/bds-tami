import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { SalesStatus } from "../../collections/Projects";
import type { Locale } from "../../i18n/routing";
import type { Project, Province } from "../../payload-types";
import { PROPERTY_TYPES, type PropertyType } from "../../shared/listing-options";
import { CONTENT_ROUTES } from "../content/content-paths";
import { publicDetailPath } from "../content/redirect-paths";
import { formatArea, formatNumber, formatVndCompact } from "../format";
import { populatedMedia, visibleCategory } from "../news/news-view";
import { effectivePriceFromVnd } from "./project-price";

export interface ProjectCardData {
  id: string;
  title: string;
  href: string;
  salesStatus: SalesStatus;
  /** Tên tỉnh/thành (ngắn nếu có), `null` khi tỉnh chưa populate. */
  provinceName: string | null;
  categoryName: string | null;
  /** Ảnh đầu tiên của thư viện ảnh = ảnh đại diện (ERD §4.5). */
  cover: MediaImage | null;
  /** BL-052: loại sản phẩm hợp lệ theo thứ tự `PROPERTY_TYPES` (thẻ hiện ≤ 3 nhãn i18n `listingOptions.propertyType` + "+n"). */
  productTypes: PropertyType[];
  /** BL-052: "Giá từ" rút gọn ("5,4 tỷ") theo `effectivePriceFromVnd`; `null` = hiện "Liên hệ". */
  priceFromLabel: string | null;
  /** BL-052: "50–120 m²" từ `areaFromM2`/`areaToM2` (một đầu → một số); `null` khi trống. */
  areaRangeLabel: string | null;
  /** BL-052: `scale.handoverTime` (chữ tự do). */
  handoverTime: string | null;
  /** Mô tả ngắn (thẻ nổi bật). */
  summary: string | null;
  /** Địa chỉ (thẻ nổi bật); trống → thẻ dùng tên tỉnh. */
  address: string | null;
}

const textOrNull = (value: string | null | undefined): string | null => value?.trim() || null;
const positiveOrNull = (value: number | null | undefined): number | null => (typeof value === "number" && value > 0 ? value : null);

/** Khoảng diện tích: hai đầu → "50–120 m²", trùng hoặc một đầu → "50 m²". */
export function areaRangeLabel(from: number | null | undefined, to: number | null | undefined, locale: Locale): string | null {
  const low = positiveOrNull(from);
  const high = positiveOrNull(to);
  if (low !== null && high !== null && high > low) return `${formatNumber(low, locale)}–${formatArea(high, locale)}`;
  const single = low ?? high;
  return single === null ? null : formatArea(single, locale);
}

function provinceLabel(province: Project["province"]): string | null {
  if (!province || typeof province !== "object") return null;
  return (province as Province).shortName || (province as Province).name || null;
}

function priceLabel(doc: Project, locale: Locale): string | null {
  const price = effectivePriceFromVnd(doc);
  return price === null ? null : formatVndCompact(price, locale);
}

export function toProjectCardData(doc: Project, locale: Locale): ProjectCardData | null {
  // Dự án không có tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng.
  if (!doc.title || !doc.slug) return null;
  const firstImage = doc.gallery?.find((item) => populatedMedia(item) !== null);
  return {
    id: doc.id,
    title: doc.title,
    href: publicDetailPath(CONTENT_ROUTES.projects, locale, doc.slug),
    salesStatus: doc.salesStatus,
    provinceName: provinceLabel(doc.province),
    categoryName: visibleCategory(doc.category, locale)?.name ?? null,
    cover: firstImage ? populatedMedia(firstImage) : null,
    productTypes: PROPERTY_TYPES.filter((type) => doc.productTypes?.includes(type)),
    priceFromLabel: priceLabel(doc, locale),
    areaRangeLabel: areaRangeLabel(doc.areaFromM2, doc.areaToM2, locale),
    handoverTime: textOrNull(doc.scale?.handoverTime),
    summary: textOrNull(doc.summary),
    address: textOrNull(doc.address),
  };
}

export function toProjectCards(docs: readonly Project[], locale: Locale): ProjectCardData[] {
  return docs.flatMap((doc) => {
    const card = toProjectCardData(doc, locale);
    return card ? [card] : [];
  });
}

/** Màu badge trạng thái mở bán (BL-020): Đang bán = gradient xanh, Sắp mở bán = gradient vàng, Đã bàn giao = trung tính. */
export const SALES_STATUS_BADGE_VARIANT = { upcoming: "primary", selling: "success", handed_over: "neutral" } as const satisfies Record<SalesStatus, string>;
