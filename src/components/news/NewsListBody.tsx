import { useTranslations } from "next-intl";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsCardData } from "@/lib/news/news-view";

/**
 * Thân danh sách tin (design-spec S10): khối nổi bật (1 bài lớn 7 cột + 3 bài hàng 5 cột ở ≥ lg, xếp dọc ở nhỏ hơn) rồi lưới thẻ
 * 1/2/3 cột. Mọi tiêu đề thẻ là `h2` ngay dưới `h1` của banner; hai khối là `section` có nhãn để dễ nhảy vùng.
 */
export function NewsListBody({ featured, items }: { featured: NewsCardData[]; items: NewsCardData[] }) {
  const t = useTranslations("page.news");
  const [lead, ...rows] = featured;
  return (
    <>
      {lead && (
        <section aria-label={t("featuredLabel")} className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <NewsCard data={lead} variant="feature" headingLevel="h2" priority />
          </div>
          {rows.length > 0 && (
            <ul className="flex flex-col gap-6 lg:col-span-5">
              {rows.map((row) => (
                <li key={row.id}>
                  <NewsCard data={row} variant="row" headingLevel="h2" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {items.length > 0 && (
        <section aria-label={featured.length > 0 ? t("moreNews") : t("title")}>
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <NewsCard data={item} headingLevel="h2" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
