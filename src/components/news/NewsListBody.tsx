import { useTranslations } from "next-intl";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsCardData } from "@/lib/news/news-view";

/**
 * Thân danh sách tin (trang 1 và 2+ của `/tin-tuc`, trang danh mục; BL-045): bài nổi bật ngang (chỉ trang 1 `/tin-tuc`, ảnh LCP) rồi lưới thẻ 1/2/3 cột (3 ≥ lg).
 * Tiêu đề thẻ là `h2` ngay dưới `h1` của hero; `section` có nhãn để dễ nhảy vùng. Server Component.
 */
export function NewsListBody({ featured = null, items }: { featured?: NewsCardData | null; items: NewsCardData[] }) {
  const t = useTranslations("page.news");
  return (
    <section aria-label={t("title")} className="flex flex-col gap-8">
      {featured && (
        <div data-news-featured="true">
          <NewsCard data={featured} variant="feature" headingLevel="h2" priority />
        </div>
      )}
      {items.length > 0 && (
        <ul data-grid-max-cols="4" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <NewsCard data={item} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
