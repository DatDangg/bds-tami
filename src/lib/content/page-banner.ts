import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { PageHeroTextKey } from "../../globals/site-settings/page-heroes";
import type { SiteSetting } from "../../payload-types";

/** Trang con có ảnh banner riêng (khớp tên trường của `site-settings.pageBanners`, FR-ADM-20 + BL-045). */
export type PageBannerKey = PageHeroTextKey | "legal";

type PageBanners = NonNullable<SiteSetting["pageBanners"]>;

/** Giá trị chỉ là id (chưa populate) hoặc media không có url → không dùng được, coi như chưa có ảnh. */
function usableImage(value: PageBanners[keyof PageBanners]): MediaImage | undefined {
  return value && typeof value === "object" && value.url ? value : undefined;
}

/**
 * Ảnh banner của trang con: ảnh riêng → ảnh mặc định → `undefined` (hero dùng nền tối token / PageBanner dùng biến thể Chữ).
 * Thuần, không đọc DB; trang danh mục con dùng cùng `key` với danh sách cha.
 */
export function resolvePageBanner(settings: Pick<SiteSetting, "pageBanners"> | null | undefined, key: PageBannerKey): MediaImage | undefined {
  const banners = settings?.pageBanners;
  return usableImage(banners?.[key]) ?? usableImage(banners?.default);
}

/** Chữ + ảnh của hero trang con (BL-045) sau khi đã áp chữ mặc định. */
export interface PageHeroView {
  image: MediaImage | undefined;
  eyebrow: string | undefined;
  title: string;
  /** Dòng 2 của tiêu đề (màu vàng); chỉ có khi admin nhập. */
  titleAccent: string | undefined;
  description: string | undefined;
}

/** Chữ mặc định (i18n `page.<x>.title/description`) khi admin để trống ở ngôn ngữ đang xem. */
export interface PageHeroDefaults {
  title: string;
  description?: string;
}

const filled = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Hero của trang con: chữ admin nhập (đã đọc đúng ngôn ngữ, `/en` không rơi về tiếng Việt) → chữ mặc định; ảnh theo `resolvePageBanner`.
 * Thuần, không đọc DB.
 */
export function resolvePageHero(settings: Pick<SiteSetting, "pageBanners" | "pageHeroes"> | null | undefined, key: PageHeroTextKey, defaults: PageHeroDefaults): PageHeroView {
  const text = settings?.pageHeroes?.[key];
  return {
    image: resolvePageBanner(settings, key),
    eyebrow: filled(text?.eyebrow),
    title: filled(text?.title) ?? defaults.title,
    titleAccent: filled(text?.titleAccent),
    description: filled(text?.description) ?? filled(defaults.description),
  };
}
