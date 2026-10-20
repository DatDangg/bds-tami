import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsCategoryRow, NewsHome } from "@/lib/news/news-home";
import type { NewsCardData } from "@/lib/news/news-view";

/** Một hàng danh mục: tiêu đề + "Xem thêm" cùng hàng, ≤ 4 thẻ (1/2/4 cột). `h2` tên danh mục, `h3` tiêu đề thẻ. */
function CategoryRow({ row }: { row: NewsCategoryRow }) {
  const t = useTranslations("page.news");
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-news-row={row.id} className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="font-display text-h2-sm">
          {row.name}
        </h2>
        <Link
          href={row.href}
          aria-label={t("viewMoreIn", { name: row.name })}
          className="inline-flex min-h-11 shrink-0 items-center text-small font-semibold text-accent-text transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("viewMore")}
        </Link>
      </div>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {row.items.map((item) => (
          <li key={item.id}>
            <NewsCard data={item} headingLevel="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Thân trang 1 của `/tin-tuc` kiểu market: "Tin nổi bật" (1 bài lớn 7 cột + list ≤ 4 bài hàng 5 cột ở ≥ lg, xếp dọc ở nhỏ hơn) rồi mỗi danh mục một
 * hàng ≤ 4 bài, cuối cùng "Tin khác" = `moreItems` (bài mới nhất bị loại khỏi lưới + lưới trang 1, trừ bài đã hiện ở trên; xem `buildMoreNews`) để mọi bài còn truy cập được
 * qua trang 1 hoặc trang 2+ (offset phân trang không đổi). Server Component. `h2` = tên khối, `h3` = tiêu đề thẻ (không nhảy cấp). Bài lớn là ảnh LCP của trang (banner dùng ảnh nền riêng).
 */
export function NewsHomeBody({ home, moreItems = [] }: { home: NewsHome; moreItems?: NewsCardData[] }) {
  const t = useTranslations("page.news");
  const featuredHeadingId = useId();
  const moreHeadingId = useId();
  return (
    <>
      {home.lead && (
        <section aria-labelledby={featuredHeadingId} data-news-featured="true" className="flex flex-col gap-6">
          <h2 id={featuredHeadingId} className="font-display text-h2-sm">
            {t("featuredLabel")}
          </h2>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <NewsCard data={home.lead} variant="feature" headingLevel="h3" priority />
            </div>
            {home.list.length > 0 && (
              <ul className="flex flex-col gap-6 lg:col-span-5">
                {home.list.map((item) => (
                  <li key={item.id}>
                    <NewsCard data={item} variant="row" headingLevel="h3" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
      {home.rows.map((row) => (
        <CategoryRow key={row.id} row={row} />
      ))}
      {moreItems.length > 0 && (
        <section aria-labelledby={moreHeadingId} data-news-more="true" className="flex flex-col gap-6">
          <h2 id={moreHeadingId} className="font-display text-h2-sm">
            {t("moreNews")}
          </h2>
          <ul data-grid-max-cols="4" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {moreItems.map((item) => (
              <li key={item.id}>
                <NewsCard data={item} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
