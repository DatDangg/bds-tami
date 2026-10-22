import { useTranslations } from "next-intl";
import { type ReactNode, useId } from "react";
import { PendingRegion } from "@/components/layout/PendingRegion";
import { ResultsBar } from "@/components/listing/ResultsBar";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsFeaturedBlock } from "@/components/news/NewsFeaturedBlock";
import type { NewsCardData } from "@/lib/news/news-view";

interface NewsListBodyProps {
  /** Khối nổi bật (trang 1, không lọc); rỗng → ẩn. */
  featured: readonly NewsCardData[];
  items: readonly NewsCardData[];
  /** Đang lọc / tìm / sắp khác mặc định: thay tiêu đề "Bài viết mới nhất" bằng "N bài viết phù hợp" (đã định dạng). */
  resultLabel?: string | undefined;
  /** Ô "Sắp xếp theo" (`NewsSortControl`). */
  sort?: ReactNode;
  /** Trạng thái trống (thay lưới + phân trang). */
  emptyState?: ReactNode;
  pagination?: ReactNode;
  /** Cột phải: "Bản tin thị trường", "Được quan tâm nhiều", "Chủ đề" (mỗi khối tự ẩn khi rỗng). */
  sidebar?: ReactNode;
}

/**
 * Thân danh sách tin `/tin-tuc` + trang danh mục (BL-054, design `tin-tuc.webp`): khối nổi bật → hai cột ≥ lg: trái "Bài viết mới nhất" (hoặc "N bài viết phù hợp")
 * + sắp xếp → lưới thẻ 1 / 2 (md) / 3 (lg) cột → phân trang; phải cột phụ rộng cố định. < lg cột phụ xuống dưới lưới. Tiêu đề thẻ: `h3` dưới `h2` "Bài viết mới nhất";
 * khi lọc không có `h2` đó nên thẻ là `h2`. Server Component.
 */
export function NewsListBody({ featured, items, resultLabel, sort, emptyState, pagination, sidebar }: NewsListBodyProps) {
  const t = useTranslations("page.news.v2");
  const headingId = useId();
  const filtered = resultLabel !== undefined;
  const showList = items.length > 0 || emptyState !== undefined;
  return (
    <div className="flex flex-col gap-10">
      <NewsFeaturedBlock items={featured} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        {showList ? (
          <section {...(filtered ? { "aria-label": t("latestTitle") } : { "aria-labelledby": headingId })} className="flex min-w-0 flex-col gap-6">
            {filtered ? (
              <ResultsBar countLabel={resultLabel} sort={sort} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={headingId} className="font-display text-h3">
                  {t("latestTitle")}
                </h2>
                {sort}
              </div>
            )}
            <PendingRegion className="flex flex-col gap-8">
              {emptyState ?? (
                <>
                  <ul data-grid-max-cols="3" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <li key={item.id}>
                        <NewsCard data={item} variant="grid" headingLevel={filtered ? "h2" : "h3"} />
                      </li>
                    ))}
                  </ul>
                  {pagination}
                </>
              )}
            </PendingRegion>
          </section>
        ) : (
          <div className="hidden lg:block" />
        )}
        {sidebar && (
          <aside aria-label={t("sidebarLabel")} className="flex min-w-0 flex-col gap-6 empty:hidden">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
