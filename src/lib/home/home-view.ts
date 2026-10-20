import type { MediaImage } from "../../components/media/ResponsiveImage";
import { parseVideoUrl } from "../../components/media/video-url";
import { HOMEPAGE_BLOCKS, HOMEPAGE_DEFAULT_BLOCK_ORDER, type StrengthIcon } from "../../globals/Homepage";
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
/** Khối có chữ mặc định theo ngôn ngữ (rentals/news) hoặc không có tiêu đề khối (strengths) nên KHÔNG bị ẩn khi CMS chưa đặt tiêu đề. */
const TITLE_OPTIONAL_BLOCKS: ReadonlySet<HomeBlockKey> = new Set(["strengths", "rentals", "news"]);

const RENDERED_BLOCKS: ReadonlySet<HomeBlockKey> = new Set(["strengths", "about", "featuredProjects", "services", "featuredOffers", "ctaBanner", "rentals", "news"]);

export const FEATURED_OFFERS_MAX = 6;
/** Khối Điểm mạnh cần ≥ 2 mục hiển thị được (BL-044). */
const STRENGTHS_MIN_ITEMS = 2;

const VIDEO_MIME_TYPES: readonly string[] = ["video/mp4", "video/webm"];
const CONTACT_FALLBACK = "contact";

export interface HeroSlideView {
  id: string;
  /** Poster + ảnh mobile + ảnh LCP của slide 1. Chỉ trường công khai (vào props Client Component). */
  image: MediaImage;
  /** URL video (tuỳ chọn); chỉ phát ở ≥ 1024px, không reduced-motion, không Save-Data. */
  videoUrl: string | null;
  title: string;
  /** Dòng 2 của tiêu đề, màu vàng (BL-044); trống → "". */
  titleAccent: string;
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
  /** `null` → nơi hiển thị dùng i18n "Về chúng tôi". */
  eyebrow: string | null;
  title: string;
  /** Phần tiêu đề màu vàng đứng sau `title` (BL-044). */
  titleAccent: string | null;
  /** Lexical (richText) của `about.content`. */
  content: unknown;
  image: MediaImage | null;
  /** Ảnh phụ đè góc trên trái ảnh minh hoạ. */
  secondaryImage: MediaImage | null;
  imageCaption: string | null;
  /** URL nhúng YouTube dựng từ ID đã kiểm (`parseVideoUrl`); link khác/không hợp lệ → `null` (ẩn nút play, D3). */
  videoEmbedUrl: string | null;
  videoLabel: string | null;
  stats: { value: string; label: string; icon: StrengthIcon | null }[];
  /** Nút cuối khối: chỉ khi có cả nhãn lẫn link hợp lệ. */
  cta: { label: string; href: string } | null;
  /** Ảnh trang trí mép phải (chỉ ≥ xl, `aria-hidden`). */
  decorImage: MediaImage | null;
}

export interface StrengthsView {
  kind: "strengths";
  items: { icon: StrengthIcon; title: string; description: string | null }[];
}

export interface CtaBannerView {
  kind: "ctaBanner";
  title: string;
  description: string | null;
  /** `null` → nơi hiển thị dùng chuỗi mặc định "Nhận tư vấn". */
  label: string | null;
  href: string;
  /** Ảnh tràn viền (`ctaBanner.image`; chưa đặt thì dùng `backgroundImage` cũ để CTA đã cấu hình không mất ảnh). `null` → khối tối như cũ. */
  image: MediaImage | null;
  /** Nút phụ: chỉ có khi CÓ CẢ chữ lẫn link hợp lệ (thiếu một trong hai thì ẩn nút). */
  secondary: { label: string; href: string } | null;
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
  /** Danh mục cho thuê cấp 1 cho ô "Loại căn hộ" của hàng "Tùy chọn khác" (cùng nguồn với `/cho-thue`; `/en` chỉ bản có EN). */
  rentalCategories: { slug: string; name: string }[];
  chips: HeroSearchChipView[];
}

export type HomeBlockView =
  | StrengthsView
  | AboutView
  | { kind: "featuredProjects"; title: string; eyebrow: string | null; description: string | null; slides: ProjectSlideView[] }
  | { kind: "services"; title: string; items: ServiceCardData[] }
  | { kind: "featuredOffers"; title: string; cards: PostCardData[] }
  | RentalsBlockView
  | NewsBlockView
  | CtaBannerView;

export interface HomeView {
  hero: HeroSlideView[];
  /** Chữ nhỏ trên tiêu đề / chú thích góc dưới phải, CHUNG mọi slide (BL-044 Q4); trống → null. */
  heroEyebrow: string | null;
  heroCaption: string | null;
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
  /** Danh mục cho thuê cấp 1 (đã đọc như khách theo ngôn ngữ) cho hàng "Tùy chọn khác"; rỗng khi ô tìm kiếm không hiển thị. */
  rentalCategories: { slug: string; name: string }[];
  /** Tab của khối Cho thuê, theo thứ tự hiển thị (rỗng khi khối không hiển thị). */
  rentalTabs: HomeRentalTabDocs[];
  /** Bài của khối Tin tức, theo thứ tự hiển thị (rỗng khi khối không hiển thị). */
  news: News[];
}

const text = (value: string | null | undefined): string => value?.trim() ?? "";

/** Thứ tự khối theo `blockOrder` (mỗi khối một lần); chưa có `blockOrder` (cài mới) thì thứ tự mặc định BL-044 (4 khối mockup). Khối không nằm trong mảng thì không hiện. */
function orderedBlocks(homepage: Homepage): HomeBlockKey[] {
  const rows = homepage.blockOrder?.map((row) => row.block) ?? [];
  const order: HomeBlockKey[] = rows.length > 0 ? rows : [...HOMEPAGE_DEFAULT_BLOCK_ORDER];
  return order.filter((block, index) => order.indexOf(block) === index);
}

function titleOf(homepage: Homepage, block: HomeBlockKey): string {
  // `strengths` không có tiêu đề khối (nằm trong TITLE_OPTIONAL_BLOCKS).
  const group = homepage[block];
  return group && "title" in group ? text(group.title) : "";
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
        titleAccent: text(slide.titleAccent),
        subtitle: text(slide.subtitle),
        ctaLabel,
        ctaHref: ctaLabel ? (resolveNavLink(slide.ctaLink, locale)?.href ?? null) : null,
      },
    ];
  });
}

/** Nhãn + link: chỉ có nút khi có CẢ hai và link hợp lệ (cùng luật với nút phụ của CTA). */
function toButton(label: string | null | undefined, link: string | null | undefined, locale: Locale): { label: string; href: string } | null {
  const trimmed = text(label);
  const href = trimmed ? (resolveNavLink(link, locale)?.href ?? null) : null;
  return href ? { label: trimmed, href } : null;
}

function toAbout(homepage: Homepage, locale: Locale): AboutView {
  const about = homepage.about;
  const video = parseVideoUrl(about?.videoUrl);
  return {
    kind: "about",
    eyebrow: text(about?.eyebrow) || null,
    title: titleOf(homepage, "about"),
    titleAccent: text(about?.titleAccent) || null,
    content: about?.content ?? null,
    image: toPublicImage(renderableImage(about?.image)),
    secondaryImage: toPublicImage(renderableImage(about?.secondaryImage)),
    imageCaption: text(about?.imageCaption) || null,
    // Schema đã chặn link ngoài YouTube; kiểm lại để dữ liệu cũ/API không dựng iframe lạ.
    videoEmbedUrl: video?.provider === "youtube" ? video.embedUrl : null,
    videoLabel: text(about?.videoLabel) || null,
    stats: (about?.stats ?? []).flatMap((stat) => (text(stat.value) && text(stat.label) ? [{ value: text(stat.value), label: text(stat.label), icon: stat.icon ?? null }] : [])),
    cta: toButton(about?.ctaLabel, about?.ctaLink, locale),
    decorImage: toPublicImage(renderableImage(about?.decorImage)),
  };
}

/** Điểm mạnh: mục thiếu tiêu đề (ở `/en` = chưa dịch) bị bỏ; còn < 2 mục thì ẩn khối. */
function toStrengths(homepage: Homepage): StrengthsView | null {
  const items = (homepage.strengths?.items ?? []).flatMap((item) => {
    const title = text(item.title);
    return title ? [{ icon: item.icon, title, description: text(item.description) || null }] : [];
  });
  return items.length >= STRENGTHS_MIN_ITEMS ? { kind: "strengths", items } : null;
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

/** Khối CTA của trang chủ; export để `ConsultBanner` (mọi trang con, BL-045) dùng lại đúng nội dung mà không xét `enabled`/`blockOrder`. */
export function buildCtaBannerView(homepage: Pick<Homepage, "ctaBanner">, locale: Locale): CtaBannerView {
  const cta = homepage.ctaBanner;
  const secondaryLabel = text(cta?.secondaryLabel);
  const secondaryHref = secondaryLabel ? (resolveNavLink(cta?.secondaryLink, locale)?.href ?? null) : null;
  return {
    kind: "ctaBanner",
    title: text(cta?.title),
    description: text(cta?.description) || null,
    label: text(cta?.ctaLabel) || null,
    href: (resolveNavLink(cta?.ctaLink, locale) ?? resolveNavLink(CONTACT_FALLBACK, locale))?.href ?? "/",
    image: toPublicImage(renderableImage(cta?.image) ?? renderableImage(cta?.backgroundImage)),
    secondary: secondaryHref ? { label: secondaryLabel, href: secondaryHref } : null,
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
    rentalCategories: docs.rentalCategories,
    chips,
  };
}

/** Khối có danh sách mà danh sách rỗng (sau khi bỏ bản ghi ẩn/chưa có EN/đã kết thúc) thì ẩn cả khối: trả `null`. */
function toBlock(block: HomeBlockKey, homepage: Homepage, docs: HomeDocs, locale: Locale, now: Date): HomeBlockView | null {
  const title = titleOf(homepage, block);
  switch (block) {
    case "strengths":
      return toStrengths(homepage);
    case "about":
      return toAbout(homepage, locale);
    case "featuredProjects": {
      const slides = toProjectSlides(docs.projects, locale);
      const featured = homepage.featuredProjects;
      return slides.length > 0 ? { kind: "featuredProjects", title, eyebrow: text(featured?.eyebrow) || null, description: text(featured?.description) || null, slides } : null;
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
      return buildCtaBannerView(homepage, locale);
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
  return {
    hero: toHeroSlides(homepage, locale),
    heroEyebrow: text(homepage.hero?.eyebrow) || null,
    heroCaption: text(homepage.hero?.caption) || null,
    heroSearch: toHeroSearch(homepage, docs, locale),
    blocks,
  };
}
