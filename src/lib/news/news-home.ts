import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category } from "../../payload-types";
import { listChildNewsCategoriesOf, listPublicNews } from "./news-queries";
import { categoryHref, type NewsCardData, toNewsCards } from "./news-view";

/** Bài trong list cạnh bài lớn của "Tin nổi bật" (market: 1 bài lớn + list 4). */
export const NEWS_HOME_LIST_COUNT = 4;
/** Số bài tối đa mỗi hàng danh mục. */
export const NEWS_HOME_ROW_LIMIT = 4;
/** Số hàng danh mục tối đa (danh mục cấp 1 đầu tiên theo thứ tự CMS): chặn số truy vấn của trang 1 dù CMS có nhiều danh mục. */
export const NEWS_HOME_MAX_ROWS = 6;

export interface NewsCategoryRow {
  id: string;
  name: string;
  /** Trang danh mục ("Xem thêm"). */
  href: string;
  items: NewsCardData[];
}

export interface NewsHome {
  lead: NewsCardData | null;
  /** Tối đa {@link NEWS_HOME_LIST_COUNT} bài cạnh bài lớn. */
  list: NewsCardData[];
  rows: NewsCategoryRow[];
}

/**
 * Dữ liệu trang 1 của `/tin-tuc` kiểu market. Số truy vấn cố định, không phụ thuộc số bài:
 * 2 cho "Tin nổi bật" (bài `isFeatured` + bài mới nhất để bù, chạy song song) · 1 danh mục con của mọi hàng · ≤ {@link NEWS_HOME_MAX_ROWS}
 * cho các hàng (mỗi danh mục 1 truy vấn limit {@link NEWS_HOME_ROW_LIMIT}, song song). Danh mục cấp 1 do trang truyền vào (đã tải cho hàng tab).
 * Hàng của danh mục cấp 1 gồm cả bài của danh mục con (khớp trang danh mục mà "Xem thêm" dẫn tới); danh mục không có bài công khai thì không có hàng.
 * "newest" (limit 5) không dùng lại truy vấn đầu trang của `loadNewsListing` (limit 4): hai truy vấn chạy song song để không nối thêm một vòng
 * chờ vào đường tới hạn; đổi lại 1 truy vấn chỉ mục rẻ. Không loại trùng giữa "Tin nổi bật" và các hàng: mỗi khối là một góc nhìn riêng, loại trùng làm hàng thiếu bài.
 */
export async function loadNewsHome(payload: Payload, locale: Locale, roots: readonly Category[]): Promise<NewsHome> {
  const leadCount = NEWS_HOME_LIST_COUNT + 1;
  const rowRoots = roots.filter((root) => root.slug && root.name).slice(0, NEWS_HOME_MAX_ROWS);
  const [flagged, newest, children] = await Promise.all([
    listPublicNews(payload, locale, { page: 1, limit: leadCount, featuredOnly: true }),
    listPublicNews(payload, locale, { page: 1, limit: leadCount }),
    rowRoots.length > 0 ? listChildNewsCategoriesOf(payload, locale, rowRoots.map((root) => root.id)) : null,
  ]);
  // Bài đánh dấu nổi bật trước, bù bằng bài mới nhất; Map theo id giữ thứ tự chèn đầu và loại trùng.
  const featuredDocs = [...new Map([...flagged.docs, ...newest.docs].map((doc) => [doc.id, doc])).values()];
  const [lead = null, ...list] = toNewsCards(featuredDocs, locale).slice(0, leadCount);

  const rowResults = await Promise.all(
    rowRoots.map(async (root) => {
      const categoryIds = [root.id, ...(children?.docs ?? []).filter((child) => categoryParentId(child) === root.id).map((child) => child.id)];
      const { docs } = await listPublicNews(payload, locale, { page: 1, limit: NEWS_HOME_ROW_LIMIT, categoryIds });
      return { id: root.id, name: root.name ?? "", href: categoryHref(root, locale), items: toNewsCards(docs, locale) };
    }),
  );
  return { lead, list, rows: rowResults.filter((row) => row.items.length > 0) };
}

/** `parent` ở `depth: 0` là id; phòng khi đã populate thì lấy `id`. */
function categoryParentId(category: Category): string | null {
  const { parent } = category;
  if (!parent) return null;
  return typeof parent === "object" ? parent.id : parent;
}

/**
 * Mục "Tin khác" của trang 1: các bài mới nhất mà `loadNewsListing` loại khỏi lưới mọi trang (`featured`) rồi lưới của trang 1 (`items`).
 * Bỏ bài đã hiện ở "Tin nổi bật"; bài `featured` đã có trong một hàng danh mục cũng bỏ (đã truy cập được). Bài của `items` giữ nguyên nếu chưa
 * ở "Tin nổi bật", nên offset phân trang không đổi và không bài nào rơi khỏi trang 1/2.
 */
export function buildMoreNews(home: NewsHome, featured: readonly NewsCardData[], items: readonly NewsCardData[]): NewsCardData[] {
  const inLead = new Set([home.lead, ...home.list].flatMap((card) => (card ? [card.id] : [])));
  const inRows = new Set(home.rows.flatMap((row) => row.items.map((card) => card.id)));
  const unseenFeatured = featured.filter((card) => !inLead.has(card.id) && !inRows.has(card.id));
  const unseenItems = items.filter((card) => !inLead.has(card.id));
  return [...new Map([...unseenFeatured, ...unseenItems].map((card) => [card.id, card])).values()];
}
