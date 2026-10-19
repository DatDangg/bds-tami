import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { SiteSetting } from "../../payload-types";

/** Trang danh sách có ảnh banner riêng (khớp tên trường của `site-settings.pageBanners`, FR-ADM-20). */
export type PageBannerKey = "projects" | "rentals" | "propertyPosts" | "news" | "careers";

type PageBanners = NonNullable<SiteSetting["pageBanners"]>;

/** Giá trị chỉ là id (chưa populate) hoặc media không có url → không dùng được, coi như chưa có ảnh. */
function usableImage(value: PageBanners[keyof PageBanners]): MediaImage | undefined {
  return value && typeof value === "object" && value.url ? value : undefined;
}

/**
 * Ảnh banner của trang danh sách: ảnh riêng → ảnh mặc định → `undefined` (PageBanner dùng biến thể Chữ).
 * Thuần, không đọc DB; trang danh mục con dùng cùng `key` với danh sách cha.
 */
export function resolvePageBanner(settings: Pick<SiteSetting, "pageBanners"> | null | undefined, key: PageBannerKey): MediaImage | undefined {
  const banners = settings?.pageBanners;
  return usableImage(banners?.[key]) ?? usableImage(banners?.default);
}
