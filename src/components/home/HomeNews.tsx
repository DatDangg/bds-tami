import { useTranslations } from "next-intl";
import { useId } from "react";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsBlockView } from "@/lib/home/home-view-listings";
import { SectionMoreLink } from "./SectionMoreLink";

/** Cột phải rộng ~2/3 container chia 3 từ sm (≥ lg: ~230px mỗi thẻ), 1 cột < sm. */
const NEWS_IMAGE_SIZES = "(min-width: 1280px) 230px, (min-width: 1024px) 18vw, (min-width: 640px) 30vw, 100vw";

/**
 * Khối "Tin tức" nền thương hiệu tối (design-spec S01 khối 9, BL-020 #11): giới thiệu (tiêu đề + đoạn ngắn + "Xem tất cả") bên trái, 3 thẻ tin bên phải
 * (xếp dọc trên mobile). Server Component, mọi thẻ là link thật nên dùng được khi chưa có JS.
 */
export function HomeNews({ block }: { block: NewsBlockView }) {
  const t = useTranslations("page.home.news");
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="theme-dark-block border-b border-dark-border py-section">
      <div className="mx-auto grid w-full max-w-container gap-10 px-gutter lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
        <div className="flex flex-col items-start gap-4">
          <h2 id={headingId} className="font-display text-h2">
            {block.title || t("defaultTitle")}
          </h2>
          {block.intro && <p className="max-w-[48ch] text-lead text-text-secondary">{block.intro}</p>}
          <SectionMoreLink href={block.href} className="mt-2">
            {t("viewAll")}
          </SectionMoreLink>
        </div>
        <ul className="grid gap-6 sm:grid-cols-3">
          {block.posts.map((post) => (
            <li key={post.id}>
              <NewsCard data={post} headingLevel="h3" sizes={NEWS_IMAGE_SIZES} onDark />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
