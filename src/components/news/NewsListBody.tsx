import { useTranslations } from "next-intl";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsCardData } from "@/lib/news/news-view";

/**
 * Lưới tin có phân trang (trang 2+ của `/tin-tuc` và trang danh mục): 1/2/3/4 cột (4 ≥ xl) kiểu market. Tiêu đề thẻ là `h2` ngay dưới
 * `h1` của banner; `section` có nhãn để dễ nhảy vùng. Trang 1 của `/tin-tuc` dùng `NewsHomeBody`.
 */
export function NewsListBody({ items }: { items: NewsCardData[] }) {
  const t = useTranslations("page.news");
  return (
    <section aria-label={t("title")}>
      <ul data-grid-max-cols="4" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <NewsCard data={item} headingLevel="h2" />
          </li>
        ))}
      </ul>
    </section>
  );
}
