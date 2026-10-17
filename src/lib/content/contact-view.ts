import type { LatLng } from "../../components/media/map-geometry";
import { isValidLocation } from "../../components/media/map-geometry";
import { buildContact, buildSocialLinks, type FooterContactView, type SocialLinkView } from "../../components/layout/shell-data";

/** Phần `site-settings` công khai mà trang Liên hệ dùng (S15). */
export interface ContactSettings {
  hotline?: string | null;
  email?: string | null;
  address?: string | null;
  /** Payload `point`: `[kinh độ, vĩ độ]`. */
  mapLocation?: [number, number] | null;
  socialLinks?: readonly { platform: string; url: string }[] | null;
}

export interface ContactPageView {
  contact: FooterContactView;
  socials: SocialLinkView[];
  /** `null` khi admin chưa nhập (hoặc nhập toạ độ không hợp lệ): trang ẩn cả khối bản đồ thay vì hiện bản đồ sai chỗ. */
  mapLocation: LatLng | null;
}

/** View model trang Liên hệ từ `site-settings`; thuần (không đụng Payload) nên test được. Settings lỗi/thiếu → trang vẫn dựng, chỉ không có thông tin. */
export function buildContactPageView(settings: ContactSettings | null): ContactPageView {
  const [lng, lat] = settings?.mapLocation ?? [];
  const location = { lat, lng };
  return {
    contact: buildContact(settings),
    socials: buildSocialLinks(settings?.socialLinks),
    mapLocation: isValidLocation(location) ? location : null,
  };
}
