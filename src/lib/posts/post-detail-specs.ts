import { isValidLocation, type LatLng } from "../../components/media/map-geometry";
import type { Locale } from "../../i18n/routing";
import type { PropertyPost, Province, Ward } from "../../payload-types";
import { DIRECTIONS, HANDOVER_CONDITIONS, PROPERTY_TYPES, type Direction, type HandoverCondition, type PropertyType } from "../../shared/listing-options";
import { formatArea, formatNumber, formatVndCompact } from "../format";

const hasText = (value: string | null | undefined): value is string => typeof value === "string" && value.trim() !== "";
const positive = (value: number | null | undefined): number | null => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);
const count = (value: number | null | undefined): number | null => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null);
const oneOf = <T extends string>(options: readonly T[], value: unknown): T | null => (options.includes(value as T) ? (value as T) : null);

/**
 * Trường có cấu trúc của tin BĐS cho trang chi tiết (BL-052 P3-T04): thanh thông số, lưới thông tin, khối Vị trí. Đã định dạng theo ngôn ngữ; giá trị lạ / trống → `null`
 * (UI bỏ ô). Thuần (không đụng Payload) nên test được; thẻ danh sách KHÔNG dùng module này (thuộc `post-view`).
 */
export interface PostDetailSpecs {
  /** Tin voucher (spec BL-052 `/tin-bds`): có ưu đãi (`offer.endAt` hoặc `offer.voucherCode`) và không có `priceVnd` lẫn `areaM2` → thanh thông số theo ưu đãi. */
  isVoucher: boolean;
  /** Giá rút gọn ("3,5 tỷ") hoặc ghi chú giá; trống → `null`. */
  price: string | null;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  direction: Direction | null;
  /** "5 m" (mặt tiền). */
  frontage: string | null;
  floors: number | null;
  propertyType: PropertyType | null;
  handover: HandoverCondition | null;
  /** Dòng vị trí ở hero và khối Vị trí: `address` nếu có, không thì "Phường, Tỉnh". */
  place: string | null;
  /** Toạ độ công khai (tin BĐS không có cơ chế ẩn địa chỉ như tin cho thuê); không hợp lệ → `null`. */
  map: LatLng | null;
}

function areaPlace(ward: PropertyPost["ward"], province: PropertyPost["province"]): string | null {
  const wardName = ward && typeof ward === "object" ? (ward as Ward).name : null;
  const provinceName = province && typeof province === "object" ? (province as Province).shortName || (province as Province).name : null;
  const parts = [wardName, provinceName].filter(hasText);
  return parts.length > 0 ? parts.join(", ") : null;
}

/** Payload `point` là [kinh độ, vĩ độ]. */
function toLatLng(point: PropertyPost["location"]): LatLng | null {
  const [lng, lat] = point ?? [];
  const location = { lat, lng };
  return isValidLocation(location) ? location : null;
}

export function isVoucherPost(doc: Pick<PropertyPost, "offer" | "priceVnd" | "areaM2">): boolean {
  const hasOffer = hasText(doc.offer?.endAt) || hasText(doc.offer?.voucherCode);
  return hasOffer && positive(doc.priceVnd) === null && positive(doc.areaM2) === null;
}

export function toPostDetailSpecs(doc: PropertyPost, locale: Locale): PostDetailSpecs {
  const priceVnd = positive(doc.priceVnd);
  const area = positive(doc.areaM2);
  const frontage = positive(doc.frontageM);
  return {
    isVoucher: isVoucherPost(doc),
    price: priceVnd !== null ? formatVndCompact(priceVnd, locale) : hasText(doc.priceNote) ? doc.priceNote.trim() : null,
    area: area !== null ? formatArea(area, locale) : null,
    bedrooms: count(doc.bedrooms),
    bathrooms: count(doc.bathrooms),
    direction: oneOf(DIRECTIONS, doc.houseDirection),
    frontage: frontage !== null ? `${formatNumber(frontage, locale)} m` : null,
    floors: positive(doc.floors),
    propertyType: oneOf(PROPERTY_TYPES, doc.propertyType),
    handover: oneOf(HANDOVER_CONDITIONS, doc.handoverCondition),
    place: hasText(doc.address) ? doc.address.trim() : areaPlace(doc.ward, doc.province),
    map: toLatLng(doc.location),
  };
}
