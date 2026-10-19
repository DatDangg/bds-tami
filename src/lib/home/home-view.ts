import type { MediaImage } from "../../components/media/ResponsiveImage";
import { HOMEPAGE_BLOCKS } from "../../globals/Homepage";
import type { Locale } from "../../i18n/routing";
import type { Homepage, News, Project, PropertyPost, Province, Service } from "../../payload-types";
import { announcementHash } from "./announcement-hash";
import { resolveNavLink } from "../content/nav-link";
import { isOfferEnded } from "../content/offer-status";
import type { SalesStatus } from "../../collections/Projects";
import { populatedMedia } from "../news/news-view";
import { type HomeRentalTabDocs, type NewsBlockView, type RentalsBlockView, toNewsBlock, toRentalsBlock } from "./home-view-listings";
import { type PostCardData, toPostCards, toPublicImage } from "../posts/post-view";
import { renderableImage } from "../projects/project-detail-view";
import { toProjectCardData } from "../projects/project-view";
import { type ServiceCardData, toServiceCards } from "../services/service-view";

/** Khối của trang chủ (không gồm hero, luôn đứng đầu). */
export type HomeBlockKey = (typeof HOMEPAGE_BLOCKS)[number];

/** Khối ĐÃ có giao diện. `partners` (FR-PUB-17, Should) làm ở task riêng: tới lúc đó thứ tự/bật tắt của nó được bỏ qua. */
/** Khối có chữ mặc định theo ngôn ngữ nên KHÔNG bị ẩn khi CMS chưa đặt tiêu đề (global mới chưa có tiêu đề cho hai khối này). */
const TITLE_OPTIONAL_BLOCKS: ReadonlySet<HomeBlockKey> = new Set(["rentals", "news"]);

const RENDERED_BLOCKS: ReadonlySet<HomeBlockKey> = new Set(["about", "featuredProjects", "services", "featuredOffers", "ctaBanner", "rentals", "news"]);

export const FEATURED_OFFERS_MAX = 6;

const VIDEO_MIME_TYPES: readonly string[] = ["video/mp4", "video/webm"];
const CONTACT_FALLBACK = "contact";

export interface HeroSlideView {
  id: string;
  /** Poster + ảnh mobile + ảnh LCP của slide 1. Chỉ trường công khai (vào props Client Component). */
  image: MediaImage;
  /** URL video (tuỳ chọn); chỉ phát ở ≥ 1024px, không reduced-motion, không Save-Data. */
  videoUrl: string | null;
  title: string;
  subtitle: string;
  ctaLabel: string;
  /** `null` khi thiếu nhãn hoặc link không hợp lệ: không dựng nút. */
  ctaHref: string | null;
}

export interface ProjectSlideView {
  id: string;
  title: string;
  href: string;
  /** Loại hình (danh mục): eyebrow duy nhất của trang chủ. */
  eyebrow: string | null;
  provinceName: string | null;
  summary: string;
  image: MediaImage | null;
  /** `null` khi dữ liệu thiếu trạng thái: thẻ không dựng badge (không gọi i18n với giá trị rỗng). */
  salesStatus: SalesStatus | null;
  /** Số liệu từ field `scale.*` có sẵn; thiếu/không dương → `null` (thẻ ẩn ô đó). */
  stats: { landAreaM2: number | null; totalUnits: number | null; handoverTime: string | null };
}

export interface AboutView {
  kind: "about";
  title: string;
  /** Lexical (richText) của `about.content`. */
  content: unknown;
  image: MediaImage | null;
  stats: { value: string; label: string }[];
}

export interface CtaBannerView {
  kind: "ctaBanner";
  title: string;
  description: string | null;
  /** `null` → nơi hiển thị dùng chuỗi mặc định "Nhận tư vấn". */
  label: string | null;
  href: string;
  image: MediaImage | null;
}

/** Thanh thông báo đầu trang chủ; `null` khi tắt, trống chữ hoặc chưa có bản EN. */
export interface AnnouncementView {
  text: string;
  /** `null` khi không có link hoặc link không hợp lệ: thông báo chỉ là chữ. */
  href: string | null;
  external: boolean;
  /** Khoá "đã đóng": đổi chữ/link thì hiện lại (xem `announcementHash`). */
  hash: string;
}

export interface HeroSearchChipView {
  id: string;
  title: string;
  href: string;
}

export interface HeroSearchView {
  /** `null` → nơi hiển thị dùng chữ mặc định theo ngôn ngữ. */
  placeholder: string | null;
  /** Đường dẫn bản địa hoá của danh sách cho thuê / dự án: đích của form GET và link tab Dự án. */
  rentalsHref: string;
  projectsHref: string;
  /** Tỉnh/thành cho ô lọc của tab Dự án (cùng nguồn `listProvinces` với `/du-an`). */
  provinces: { slug: string; name: string }[];
  chips: HeroSearchChipView[];
}

export type HomeBlockView =
  | AboutView
  | { kind: "featuredProjects"; title: string; slides: ProjectSlideView[] }
  | { kind: "services"; title: string; items: ServiceCardData[] }
  | { kind: "featuredOffers"; title: string; cards: PostCardData[] }
  | RentalsBlockView
  | NewsBlockView
  | CtaBannerView;

export interface HomeView {
  hero: HeroSlideView[];
  /** `null` khi tắt ô tìm kiếm. */
  heroSearch: HeroSearchView | null;
  blocks: HomeBlockView[];
}

/** Bản ghi đã đọc như khách theo ngôn ngữ đang xem (xem `home-queries`), theo đúng thứ tự hiển thị. */
export interface HomeDocs {
  projects: Project[];
  services: Service[];
  offers: PropertyPost[];
  /** Dự án cho chip ở ô tìm kiếm hero (đã đọc như khách; chọn tay hoặc `isFeatured` mới nhất). */
  chipProjects: Project[];
  /** Tỉnh/thành cho ô lọc của tab Dự án (rỗng khi ô tìm kiếm không hiển thị). */
  provinces: Province[];
  /** Tab của khối Cho thuê, theo thứ tự hiển thị (rỗng khi khối không hiển thị). */
  rentalTabs: HomeRentalTabDocs[];
  /** Bài của khối Tin tức, theo thứ tự hiển thị (rỗng khi khối không hiển thị). */
  news: News[];
}

const text = (value: string | null | undefined): string => value?.trim() ?? "";

/** Thứ tự khối theo `blockOrder` (mỗi khối một lần); chưa có `blockOrder` (cài mới) thì thứ tự mặc định. Khối không nằm trong mảng thì không hiện. */
function orderedBlocks(homepage: Homepage): HomeBlockKey[] {
  const rows = homepage.blockOrder?.map((row) => row.block) ?? [];
  const order = rows.length > 0 ? rows : [...HOMEPAGE_BLOCKS];
  return order.filter((block, index) => order.indexOf(block) === index);
}

function titleOf(homepage: Homepage, block: HomeBlockKey): string {
  return text(homepage[block]?.title);
}

function isEnabled(homepage: Homepage, block: HomeBlockKey): boolean {
  // `ctaBanner.enabled` mặc định tắt; các khối khác mặc định bật (ERD §4.15).
  return block === "ctaBanner" ? homepage.ctaBanner?.enabled === true : homepage[block]?.enabled !== false;
}

/**
 * Khối sẽ hiển thị (theo thứ tự): đã bật, đã có giao diện và CÓ TIÊU ĐỀ ở ngôn ngữ đang xem (trừ `rentals`/`news`: có chữ mặc định nên tiêu đề CMS tuỳ chọn). Global đọc với `fallbackLocale: false` nên ở `/en`
 * tiêu đề trống = chưa có bản EN → ẩn khối, không lấy chữ Việt (Spec § Quy tắc biên). Ở `vi`, tiêu đề trống (admin để sót; race 2 admin có thể để
 * CTA bật mà không có title) cũng ẩn: phòng thủ ở lớp hiển thị. Dùng cả để quyết định truy vấn nào cần chạy.
 */
export function visibleBlockKeys(homepage: Homepage): HomeBlockKey[] {
  return orderedBlocks(homepage).filter((block) => RENDERED_BLOCKS.has(block) && isEnabled(homepage, block) && (TITLE_OPTIONAL_BLOCKS.has(block) || titleOf(homepage, block) !== ""));
}

function toHeroSlides(homepage: Homepage, locale: Locale): HeroSlideView[] {
  return (homepage.hero?.slides ?? []).flatMap((slide, index) => {
    const image = toPublicImage(renderableImage(slide.image));
    const title = text(slide.title);
    // `/en`: slide chưa có chữ EN bị bỏ (không lấy chữ Việt); `vi`: slide chỉ có ảnh vẫn hiện.
    if (!image || (locale === "en" && title === "")) return [];
    const video = populatedMedia(slide.video);
    const ctaLabel = text(slide.ctaLabel);
    return [
      {
        id: slide.id ?? String(index),
        image,
        videoUrl: video?.url && VIDEO_MIME_TYPES.includes(video.mimeType ?? "") ? video.url : null,
        title,
        subtitle: text(slide.subtitle),
        ctaLabel,
        ctaHref: ctaLabel ? (resolveNavLink(slide.ctaLink, locale)?.href ?? null) : null,
      },
    ];
  });
}

function toAbout(homepage: Homepage): AboutView {
  const about = homepage.about;
  return {
    kind: "about",
    title: titleOf(homepage, "about"),
    content: about?.content ?? null,
    image: toPublicImage(renderableImage(about?.image)),
    stats: (about?.stats ?? []).flatMap((stat) => (text(stat.value) && text(stat.label) ? [{ value: text(stat.value), label: text(stat.label) }] : [])),
  };
}

const positiveOrNull = (value: number | null | undefined): number | null => (typeof value === "number" && value > 0 ? value : null);

function toProjectSlides(docs: readonly Project[], locale: Locale): ProjectSlideView[] {
  return docs.flatMap((doc) => {
    const card = toProjectCardData(doc, locale);
    if (!card) return [];
    return [
      {
        id: card.id,
        title: card.title,
        href: card.href,
        eyebrow: card.categoryName,
        provinceName: card.provinceName,
        summary: text(doc.summary),
        image: toPublicImage(card.cover),
        salesStatus: card.salesStatus ?? null,
        stats: {
          landAreaM2: positiveOrNull(doc.scale?.landAreaM2),
          totalUnits: positiveOrNull(doc.scale?.totalUnits),
          handoverTime: text(doc.scale?.handoverTime) || null,
        },
      },
    ];
  });
}

function toCta(homepage: Homepage, locale: Locale): CtaBannerView {
  const cta = homepage.ctaBanner;
  return {
    kind: "ctaBanner",
    title: titleOf(homepage, "ctaBanner"),
    description: text(cta?.description) || null,
    label: text(cta?.ctaLabel) || null,
    href: (resolveNavLink(cta?.ctaLink, locale) ?? resolveNavLink(CONTACT_FALLBACK, locale))?.href ?? "/",
    image: toPublicImage(renderableImage(cta?.backgroundImage)),
  };
}

/** Thanh thông báo của trang chủ (render ở khung trang `PublicShell`, trên header), nên tách khỏi `HomeView`. */
export function buildAnnouncementView(homepage: Homepage, locale: Locale): AnnouncementView | null {
  const bar = homepage.announcementBar;
  // Mặc định tắt. `/en` đọc với `fallbackLocale: false` nên chữ trống = chưa có bản EN → ẩn, không lấy chữ Việt.
  if (bar?.enabled !== true) return null;
  const message = text(bar.text);
  if (message === "") return null;
  const link = resolveNavLink(bar.link, locale);
  return { text: message, href: link?.href ?? null, external: link?.external ?? false, hash: announcementHash(message, link?.href ?? null) };
}

function toHeroSearch(homepage: Homepage, docs: HomeDocs, locale: Locale): HeroSearchView | null {
  const search = homepage.heroSearch;
  if (search?.enabled === false) return null;
  const chips = toProjectSlides(docs.chipProjects, locale).map(({ id, title, href }) => ({ id, title, href }));
  return {
    placeholder: text(search?.placeholder) || null,
    rentalsHref: resolveNavLink("rentals", locale)?.href ?? "/",
    projectsHref: resolveNavLink("projects", locale)?.href ?? "/",
    provinces: docs.provinces.map((province) => ({ slug: province.slug, name: province.shortName || province.name })),
    chips,
  };
}

/** Khối có danh sách mà danh sách rỗng (sau khi bỏ bản ghi ẩn/chưa có EN/đã kết thúc) thì ẩn cả khối: trả `null`. */
function toBlock(block: HomeBlockKey, homepage: Homepage, docs: HomeDocs, locale: Locale, now: Date): HomeBlockView | null {
  const title = titleOf(homepage, block);
  switch (block) {
    case "about":
      return toAbout(homepage);
    case "featuredProjects": {
      const slides = toProjectSlides(docs.projects, locale);
      return slides.length > 0 ? { kind: "featuredProjects", title, slides } : null;
    }
    case "services": {
      const items = toServiceCards(docs.services, locale).map((item) => ({ ...item, cover: toPublicImage(item.cover) }));
      return items.length > 0 ? { kind: "services", title, items } : null;
    }
    case "featuredOffers": {
      // Bài hết hạn không xuất hiện (BR-06): truy vấn đã lọc, lọc lại bằng `isOfferEnded` (nguồn duy nhất) cho chắc.
      const live = docs.offers.filter((doc) => !isOfferEnded(doc, now));
      const cards = toPostCards(live, locale, now).slice(0, FEATURED_OFFERS_MAX);
      return cards.length > 0 ? { kind: "featuredOffers", title, cards } : null;
    }
    case "ctaBanner":
      return toCta(homepage, locale);
    case "rentals":
      return toRentalsBlock(title, docs.rentalTabs, locale);
    case "news":
      return toNewsBlock(title, homepage.news?.intro, docs.news, locale);
    // Chưa có giao diện (FR-PUB-17, Should): không nằm trong RENDERED_BLOCKS nên không bao giờ tới đây.
    case "partners":
      return null;
  }
}

/** View model của trang chủ: hero rồi các khối theo `blockOrder`/`enabled`/chữ ở ngôn ngữ đang xem. Thuần (không đụng Payload) nên test được. */
export function buildHomeView(homepage: Homepage, docs: HomeDocs, locale: Locale, now: Date): HomeView {
  const blocks = visibleBlockKeys(homepage).flatMap((key) => {
    const block = toBlock(key, homepage, docs, locale, now);
    return block ? [block] : [];
  });
  return { hero: toHeroSlides(homepage, locale), heroSearch: toHeroSearch(homepage, docs, locale), blocks };
}
