import type { LatLng } from "../../components/media/map-geometry";
import { isValidLocation } from "../../components/media/map-geometry";
import type { MediaImage } from "../../components/media/ResponsiveImage";
import { buildContact, buildFloatingContact, buildSocialLinks, toTelHref, type FooterContactView, type SocialLinkView } from "../../components/layout/shell-data";

type PayloadPoint = [number, number] | null | undefined;

/** Một hàng `site-settings.offices` (BL-054 Quyết định 4) đã đọc đúng ngôn ngữ (`fallbackLocale: false`: `/en` chưa dịch → `name`/`address` null). */
export interface OfficeSettingsRow {
  id?: string | null;
  name?: string | null;
  address?: string | null;
  /** Payload `upload`: chuỗi id khi chưa populate, doc `media` khi `depth ≥ 1`. */
  image?: string | MediaImage | null;
  location?: PayloadPoint;
  phone?: string | null;
  email?: string | null;
}

/** Phần `site-settings` công khai mà trang Liên hệ dùng (S15, BL-054). */
export interface ContactSettings {
  siteName?: string | null;
  hotline?: string | null;
  email?: string | null;
  address?: string | null;
  zaloUrl?: string | null;
  /** Payload `point`: `[kinh độ, vĩ độ]`. */
  mapLocation?: PayloadPoint;
  socialLinks?: readonly { platform: string; url: string }[] | null;
  workingHours?: { hours?: string | null; days?: string | null } | null;
  offices?: readonly OfficeSettingsRow[] | null;
}

export interface OfficeView {
  id: string;
  name: string;
  address?: string;
  image?: MediaImage;
  /** `null` khi không có / sai toạ độ: tab đó không có bản đồ (chỉ thẻ văn phòng). */
  location: LatLng | null;
  phone?: { label: string; telHref: string };
  email?: string;
  /** Google Maps chỉ đường theo toạ độ, không có toạ độ thì theo địa chỉ; thiếu cả hai → không có nút "Chỉ đường". */
  directionsUrl?: string;
}

/** 4 thẻ nổi dưới hero; thẻ thiếu dữ liệu không có khoá (trang ẩn thẻ, lưới co theo số thẻ). */
export interface ContactCardsView {
  hotline?: { label: string; telHref: string };
  email?: string;
  /** Zalo OA: giá trị hiển thị = `siteName`, nút "Nhắn tin" → `zaloUrl` (chỉ http(s)). */
  zalo?: { name: string; url: string };
  /** `hours` là dòng chính; chỉ có `days` thì `days` lên dòng chính. */
  workingHours?: { hours: string; days?: string };
}

export interface ContactPageView {
  contact: FooterContactView;
  socials: SocialLinkView[];
  cards: ContactCardsView;
  /** Rỗng khi site-settings không có cả văn phòng lẫn địa chỉ / toạ độ / hotline / email cũ. */
  offices: OfficeView[];
}

const filled = (value: string | null | undefined): string | undefined => value?.trim() || undefined;

function toLocation(point: PayloadPoint): LatLng | null {
  const [lng, lat] = point ?? [];
  const location = { lat, lng };
  return isValidLocation(location) ? location : null;
}

function toImage(image: OfficeSettingsRow["image"]): MediaImage | undefined {
  if (!image || typeof image !== "object" || !image.url) return undefined;
  // Chỉ trường `ResponsiveImage` cần: props của Client Component bị serialize vào HTML công khai.
  return { url: image.url, alt: image.alt ?? null, width: image.width ?? null, ...(image.sizes ? { sizes: image.sizes } : {}) };
}

export function directionsUrl(location: LatLng | null, address: string | undefined): string | undefined {
  const destination = location ? `${location.lat},${location.lng}` : address;
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : undefined;
}

function toOffice(id: string, name: string, row: { address?: string; location: LatLng | null; phone?: string | null; email?: string | null; image?: MediaImage }): OfficeView {
  const phone = filled(row.phone);
  const telHref = phone ? toTelHref(phone) : "";
  const email = filled(row.email);
  const url = directionsUrl(row.location, row.address);
  return {
    id,
    name,
    location: row.location,
    ...(row.address ? { address: row.address } : {}),
    ...(row.image ? { image: row.image } : {}),
    ...(phone && telHref ? { phone: { label: phone, telHref } } : {}),
    ...(email ? { email } : {}),
    ...(url ? { directionsUrl: url } : {}),
  };
}

/**
 * Văn phòng của trang: hàng `offices` có đủ `name` + `address` ở ngôn ngữ đang xem (`/en` bỏ hàng chưa dịch, không lấy chữ VI bù — BR-07);
 * không còn hàng nào → 1 văn phòng dựng từ `address` / `mapLocation` / `hotline` / `email` cũ (không mất dữ liệu khi admin chưa nhập `offices`).
 */
export function buildOffices(settings: ContactSettings | null, fallbackName: string): OfficeView[] {
  const rows = (settings?.offices ?? []).flatMap((row, index) => {
    const name = filled(row.name);
    const address = filled(row.address);
    if (!name || !address) return [];
    const image = toImage(row.image);
    return [toOffice(row.id ?? `office-${index}`, name, { address, location: toLocation(row.location), phone: row.phone, email: row.email, ...(image ? { image } : {}) })];
  });
  if (rows.length > 0) return rows;
  const address = filled(settings?.address);
  const location = toLocation(settings?.mapLocation);
  if (!address && !location && !filled(settings?.hotline) && !filled(settings?.email)) return [];
  return [toOffice("office-main", fallbackName, { ...(address ? { address } : {}), location, phone: settings?.hotline, email: settings?.email })];
}

export function buildContactCards(settings: ContactSettings | null): ContactCardsView {
  const { hotline, zaloUrl } = buildFloatingContact(settings);
  const email = filled(settings?.email);
  const siteName = filled(settings?.siteName);
  const hours = filled(settings?.workingHours?.hours);
  const days = filled(settings?.workingHours?.days);
  const main = hours ?? days;
  return {
    ...(hotline ? { hotline } : {}),
    ...(email ? { email } : {}),
    ...(zaloUrl && siteName ? { zalo: { name: siteName, url: zaloUrl } } : {}),
    ...(main ? { workingHours: { hours: main, ...(hours && days ? { days } : {}) } } : {}),
  };
}

/**
 * View model trang Liên hệ từ `site-settings`; thuần (không đụng Payload) nên test được. Settings lỗi/thiếu → trang vẫn dựng, chỉ không có thông tin.
 * `fallbackOfficeName`: tên văn phòng dựng từ trường cũ (chuỗi i18n theo ngôn ngữ đang xem).
 */
export function buildContactPageView(settings: ContactSettings | null, fallbackOfficeName: string): ContactPageView {
  return {
    contact: buildContact(settings),
    socials: buildSocialLinks(settings?.socialLinks),
    cards: buildContactCards(settings),
    offices: buildOffices(settings, fallbackOfficeName),
  };
}
