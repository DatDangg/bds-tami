import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, Homepage, News, Project, PropertyPost, Service } from "../../payload-types";
import { offerNotEndedWhere } from "../content/offer-status";
import { findPublicList } from "../content/public-queries";
import { relationId } from "../payload/relation-id";
import { POST_CARD_FIELDS } from "../posts/post-queries";
import { HERO_CHIP_PROJECTS_MAX, HOME_NEWS_POSTS_MAX, RENTAL_CATEGORIES_MAX } from "../../globals/homepage/blocks";
import { listProvinces } from "../projects/project-queries";
import { listRentalCategoryOptions } from "../rentals/rental-list-queries";
import { PostgresRentalSearch, sqlExecutorOf } from "../search/search-service";
import { rentalSearchParamsSchema } from "../../shared/types/api";
import type { PartnerDoc } from "./home-view-partners";
import { FEATURED_OFFERS_MAX, type HomeBlockKey, type HomeDocs } from "./home-view";
import { HOME_RENTALS_PER_TAB_MAX, type HomeRentalTabDocs } from "./home-view-listings";

/** Tối đa 6 dự án nổi bật (ERD §4.15, S01). */
export const FEATURED_PROJECTS_MAX = 6;
/** Dịch vụ không có trần ở global; trần hiển thị để hàng cuộn ngang không dài vô hạn. */
export const HOME_SERVICES_MAX = 12;

/** Trần số đối tác trên dải logo (CMS không có trần; quá nhiều làm một vòng chạy quá dài). */
export const HOME_PARTNERS_MAX = 24;

const NEWEST_FIRST = ["-publishedAt", "-createdAt"];

/** Trường thẻ slide dự án: có `summary`, bỏ `overview` và các richText dài. */
/** `salesStatus` (badge) và `scale` (số liệu trên thẻ) PHẢI nằm trong select: thiếu thì `select` trả undefined cho field đó. */
const HOME_PROJECT_FIELDS = { title: true, slug: true, summary: true, province: true, category: true, gallery: true, salesStatus: true, scale: true } as const;

type Collection = "projects" | "services" | "property-posts" | "categories" | "news";

/** Thẻ tin tức chỉ cần các trường này (bỏ `content` richText dài); `category` được populate ở depth 1 để lấy nhãn. */
const HOME_NEWS_FIELDS = { title: true, slug: true, excerpt: true, publishedAt: true, category: true, cover: true } as const;
/** Fallback "danh mục cho thuê đang có tin": số danh mục gốc tối đa được dò (mỗi danh mục 1 truy vấn tìm kiếm song song). */
const RENTAL_FALLBACK_CANDIDATES_MAX = 8;

function selectedIds(values: readonly (string | { id: string })[] | null | undefined, max: number): string[] {
  const ids = (values ?? []).flatMap((value) => {
    const id = relationId(value);
    return id ? [id] : [];
  });
  return [...new Set(ids)].slice(0, max);
}

/**
 * Đọc lại bản ghi được chọn tay như khách (kèm `publicWhere`: đã xuất bản, chưa xoá mềm, `/en` chỉ bản có EN) rồi xếp theo thứ tự admin chọn.
 * Không dùng bản ghi populate sẵn trong global: depth 1 chỉ có id ảnh, và không lọc bản ghi ẩn/chưa dịch.
 */
async function findSelected<T extends { id: string }>(
  payload: Payload,
  collection: Collection,
  locale: Locale,
  ids: readonly string[],
  options: { where?: Where; select?: Record<string, true> },
): Promise<T[]> {
  const where: Where = { and: [{ id: { in: [...ids] } }, ...(options.where ? [options.where] : [])] };
  const { docs } = await findPublicList<T>(payload, collection, locale, { where, limit: ids.length, depth: 1, ...(options.select ? { select: options.select } : {}) });
  const position = new Map(ids.map((id, index) => [id, index]));
  return [...docs].sort((a, b) => (position.get(String(a.id)) ?? 0) - (position.get(String(b.id)) ?? 0));
}

async function findFeaturedFallback<T>(
  payload: Payload,
  collection: Collection,
  locale: Locale,
  options: { where?: Where; limit: number; sort: string[]; select?: Record<string, true> },
): Promise<T[]> {
  const where: Where = { and: [{ isFeatured: { equals: true } }, ...(options.where ? [options.where] : [])] };
  const { docs } = await findPublicList<T>(payload, collection, locale, {
    where,
    sort: options.sort,
    limit: options.limit,
    depth: 1,
    ...(options.select ? { select: options.select } : {}),
  });
  return docs;
}

function loadProjects(payload: Payload, locale: Locale, homepage: Homepage): Promise<Project[]> {
  const ids = selectedIds(homepage.featuredProjects?.projects, FEATURED_PROJECTS_MAX);
  // Chọn tay thì theo lựa chọn; trống thì `isFeatured` mới nhất.
  return ids.length > 0
    ? findSelected<Project>(payload, "projects", locale, ids, { select: HOME_PROJECT_FIELDS })
    : findFeaturedFallback<Project>(payload, "projects", locale, { limit: FEATURED_PROJECTS_MAX, sort: NEWEST_FIRST, select: HOME_PROJECT_FIELDS });
}

/** Chip chỉ cần tên + slug. Chọn tay mà không bản ghi nào còn công khai (đã gỡ/chưa có EN) thì rơi về `isFeatured` mới nhất để hàng chip không trống. */
async function loadChipProjects(payload: Payload, locale: Locale, homepage: Homepage): Promise<Project[]> {
  const select = { title: true, slug: true } as const;
  const ids = selectedIds(homepage.heroSearch?.chipProjects, HERO_CHIP_PROJECTS_MAX);
  if (ids.length > 0) {
    const picked = await findSelected<Project>(payload, "projects", locale, ids, { select });
    if (picked.length > 0) return picked;
  }
  return findFeaturedFallback<Project>(payload, "projects", locale, { limit: HERO_CHIP_PROJECTS_MAX, sort: NEWEST_FIRST, select });
}

/** Ô tìm kiếm chỉ hiện dưới hero: không có slide hoặc đã tắt thì không tốn truy vấn (chip dự án + danh sách tỉnh/thành cho ô lọc tab Dự án). */
const needsHeroSearchData = (homepage: Homepage): boolean => homepage.heroSearch?.enabled !== false && (homepage.hero?.slides?.length ?? 0) > 0;

function loadServices(payload: Payload, locale: Locale, homepage: Homepage): Promise<Service[]> {
  const ids = selectedIds(homepage.services?.items, HOME_SERVICES_MAX);
  return ids.length > 0 ? findSelected<Service>(payload, "services", locale, ids, {}) : Promise.resolve([]);
}

function loadOffers(payload: Payload, locale: Locale, homepage: Homepage, now: Date): Promise<PropertyPost[]> {
  const ids = selectedIds(homepage.featuredOffers?.posts, FEATURED_OFFERS_MAX);
  // Bài hết hạn không lên trang chủ (BR-06): `offerNotEndedWhere` cùng nguồn với `isOfferEnded`.
  const where = offerNotEndedWhere(now);
  return ids.length > 0
    ? findSelected<PropertyPost>(payload, "property-posts", locale, ids, { where, select: POST_CARD_FIELDS })
    : findFeaturedFallback<PropertyPost>(payload, "property-posts", locale, { where, limit: FEATURED_OFFERS_MAX, sort: NEWEST_FIRST, select: POST_CARD_FIELDS });
}

/**
 * Đối tác: chủ đầu tư `showAsPartner`, theo `sortOrder` rồi tên, qua `findPublicList` nên `/en` chỉ gồm đối tác đã có bản EN,
 * không lấy tên Việt thay (BR-07; Spec § F1, Đối tác).
 */
async function loadPartners(payload: Payload, locale: Locale): Promise<PartnerDoc[]> {
  const { docs } = await findPublicList<PartnerDoc>(payload, "developers", locale, {
    where: { showAsPartner: { equals: true } },
    sort: ["sortOrder", "name"],
    limit: HOME_PARTNERS_MAX,
    depth: 1,
    select: { name: true, logo: true, website: true },
  });
  return docs;
}

async function loadNews(payload: Payload, locale: Locale, homepage: Homepage): Promise<News[]> {
  const ids = selectedIds(homepage.news?.posts, HOME_NEWS_POSTS_MAX);
  if (ids.length > 0) {
    const picked = await findSelected<News>(payload, "news", locale, ids, { select: HOME_NEWS_FIELDS });
    // Chọn tay mà không bài nào còn công khai (đã gỡ/chưa có EN) thì rơi về bài mới nhất để khối không trống vô lý.
    if (picked.length > 0) return picked;
  }
  const { docs } = await findPublicList<News>(payload, "news", locale, { sort: NEWEST_FIRST, limit: HOME_NEWS_POSTS_MAX, depth: 1, select: HOME_NEWS_FIELDS });
  return docs;
}

type RentalTabCategory = HomeRentalTabDocs["category"];

/** Một truy vấn tìm kiếm cho thuê (cùng `SearchService` + luật hiển thị của `/cho-thue/danh-muc/<slug>`: chỉ tin còn trống, `/en` chỉ tin có bản EN, tin mới nhất trước). */
async function loadRentalTab(payload: Payload, locale: Locale, category: RentalTabCategory): Promise<HomeRentalTabDocs> {
  const params = rentalSearchParamsSchema.parse({ locale, category: category.slug, limit: HOME_RENTALS_PER_TAB_MAX, available: true });
  const { items } = await new PostgresRentalSearch(sqlExecutorOf(payload)).search(params);
  return { category, items };
}

const toTabCategory = (category: Pick<Category, "id" | "name" | "slug">): RentalTabCategory => ({ id: category.id, name: category.name, slug: category.slug });

/** Ô "Loại căn hộ" của hàng "Tùy chọn khác" (BL-044): danh mục cho thuê CẤP 1, cùng nguồn/thứ tự với ô "Loại" của `/cho-thue` (`/en` chỉ danh mục có EN). */
async function loadRentalCategoryChoices(payload: Payload, locale: Locale): Promise<HomeDocs["rentalCategories"]> {
  const options = await listRentalCategoryOptions(payload, locale);
  return options.filter((option) => option.depth === 0).map((option) => ({ slug: option.slug, name: option.label }));
}

/** Danh mục `rental` admin chọn (đọc như khách: `/en` chỉ danh mục có EN), theo thứ tự admin. */
async function findSelectedRentalCategories(payload: Payload, locale: Locale, ids: readonly string[]): Promise<RentalTabCategory[]> {
  const docs = await findSelected<Category>(payload, "categories", locale, ids, { where: { scope: { equals: "rental" } }, select: { name: true, slug: true } });
  return docs.map(toTabCategory);
}

/** Dò các danh mục cho thuê gốc (cùng thứ tự `/cho-thue`) để lấy những danh mục đang có tin. */
async function findFallbackRentalCategories(payload: Payload, locale: Locale): Promise<RentalTabCategory[]> {
  const options = await listRentalCategoryOptions(payload, locale);
  return options
    .filter((option) => option.depth === 0)
    .slice(0, RENTAL_FALLBACK_CANDIDATES_MAX)
    .map((option) => ({ id: option.slug, name: option.label, slug: option.slug }));
}

/**
 * Tab Cho thuê: danh mục admin chọn (≤ 4, theo thứ tự) nếu có, ngược lại các danh mục cho thuê gốc đang có tin (≤ 4). Tab không có tin bị bỏ.
 * Chi phí: 1 truy vấn danh mục + mỗi danh mục 1 lần `SearchService` (đếm + trang, song song). CMS ≤ 4 lần; fallback dò 4 danh mục đầu, chỉ dò thêm (từng lô 4, tới ≤ 8) khi chưa đủ 4 tab có tin. Không N+1 theo tin (ảnh/khu vực lấy trong chính SQL).
 */
async function loadRentalTabs(payload: Payload, locale: Locale, homepage: Homepage): Promise<HomeRentalTabDocs[]> {
  const ids = selectedIds(homepage.rentals?.categories, RENTAL_CATEGORIES_MAX);
  const withItems = async (categories: readonly RentalTabCategory[]) =>
    (await Promise.all(categories.map((category) => loadRentalTab(payload, locale, category)))).filter((tab) => tab.items.length > 0);
  if (ids.length > 0) {
    const picked = await withItems(await findSelectedRentalCategories(payload, locale, ids));
    if (picked.length > 0) return picked;
  }
  const candidates = await findFallbackRentalCategories(payload, locale);
  const found: HomeRentalTabDocs[] = [];
  for (let start = 0; start < candidates.length && found.length < RENTAL_CATEGORIES_MAX; start += RENTAL_CATEGORIES_MAX) {
    found.push(...(await withItems(candidates.slice(start, start + RENTAL_CATEGORIES_MAX))));
  }
  return found.slice(0, RENTAL_CATEGORIES_MAX);
}

/** Chỉ truy vấn bản ghi của khối sẽ hiển thị (`visible`) và chip của ô tìm kiếm hero: khối tắt/ẩn không tốn truy vấn. Các truy vấn chạy song song. */
export async function loadHomeDocs(payload: Payload, locale: Locale, homepage: Homepage, visible: readonly HomeBlockKey[], now: Date): Promise<HomeDocs> {
  const has = (block: HomeBlockKey) => visible.includes(block);
  const heroSearch = needsHeroSearchData(homepage);
  const [projects, services, offers, chipProjects, provinces, rentalCategories, rentalTabs, news, partners] = await Promise.all([
    has("featuredProjects") ? loadProjects(payload, locale, homepage) : [],
    has("services") ? loadServices(payload, locale, homepage) : [],
    has("featuredOffers") ? loadOffers(payload, locale, homepage, now) : [],
    heroSearch ? loadChipProjects(payload, locale, homepage) : [],
    heroSearch ? listProvinces(payload) : [],
    heroSearch ? loadRentalCategoryChoices(payload, locale) : [],
    has("rentals") ? loadRentalTabs(payload, locale, homepage) : [],
    has("news") ? loadNews(payload, locale, homepage) : [],
    has("partners") ? loadPartners(payload, locale) : [],
  ]);
  return { projects, services, offers, chipProjects, provinces, rentalCategories, rentalTabs, news, partners };
}
