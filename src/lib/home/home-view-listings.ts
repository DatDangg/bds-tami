import type { Locale } from "../../i18n/routing";
import type { Category, News } from "../../payload-types";
import type { RentalCard as RentalSearchCard } from "../../shared/types/api";
import { HOME_NEWS_POSTS_MAX, RENTAL_CATEGORIES_MAX } from "../../globals/homepage/blocks";
import { publicPath } from "../content/content-paths";
import { type NewsCardData, toNewsCards } from "../news/news-view";
import { type RentalCardData, searchCardToRentalCardData } from "../rentals/rental-view";

/** View model của hai khối danh sách mới (Cho thuê, Tin tức — BL-020 #8/#11), tách khỏi `home-view` để file đó không phình. */

/** Mỗi tab Cho thuê tối đa 8 tin; khối tối đa 4 tab (`RENTAL_CATEGORIES_MAX` của schema). */
export const HOME_RENTALS_PER_TAB_MAX = 8;

export interface RentalTabView {
  id: string;
  label: string;
  /** Trang danh mục cho thuê đã bản địa hoá (đích của "Xem thêm"). */
  href: string;
  cards: RentalCardData[];
}

/** `title` rỗng = CMS chưa đặt tiêu đề: nơi hiển thị dùng chữ mặc định theo ngôn ngữ (khối không bị ẩn vì thiếu tiêu đề). */
export interface RentalsBlockView {
  kind: "rentals";
  title: string;
  tabs: RentalTabView[];
}

export interface NewsBlockView {
  kind: "news";
  title: string;
  intro: string | null;
  posts: NewsCardData[];
  /** Danh sách tin tức đã bản địa hoá (đích của "Xem tất cả"). */
  href: string;
}

/** Một tab Cho thuê đã đọc: danh mục (đúng ngôn ngữ đang xem) + các tin còn trống của nó, mới nhất trước. */
export interface HomeRentalTabDocs {
  category: Pick<Category, "id" | "name" | "slug">;
  items: RentalSearchCard[];
}

const text = (value: string | null | undefined): string => value?.trim() ?? "";

/** Tab không có tin (hoặc danh mục thiếu tên/slug) bị bỏ; tối đa 4 tab, mỗi tab 8 tin. Không còn tab nào → `null` (ẩn khối). */
export function toRentalsBlock(title: string, tabs: readonly HomeRentalTabDocs[], locale: Locale): RentalsBlockView | null {
  const views = tabs
    .flatMap(({ category, items }) => {
      const label = text(category.name);
      const slug = text(category.slug);
      const cards = items.slice(0, HOME_RENTALS_PER_TAB_MAX).map((item) => searchCardToRentalCardData(item, locale));
      if (!label || !slug || cards.length === 0) return [];
      return [{ id: category.id, label, href: publicPath("/cho-thue/danh-muc/[category]", locale, { category: slug }), cards }];
    })
    .slice(0, RENTAL_CATEGORIES_MAX);
  return views.length > 0 ? { kind: "rentals", title, tabs: views } : null;
}

/** ≤ 3 bài (bài thiếu tiêu đề/slug bị bỏ); không còn bài nào → `null` (ẩn khối). */
export function toNewsBlock(title: string, intro: string | null | undefined, docs: readonly News[], locale: Locale): NewsBlockView | null {
  const posts = toNewsCards(docs, locale).slice(0, HOME_NEWS_POSTS_MAX);
  return posts.length > 0 ? { kind: "news", title, intro: text(intro) || null, posts, href: publicPath("/tin-tuc", locale) } : null;
}
