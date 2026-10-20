import { useTranslations } from "next-intl";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";

/**
 * Thân danh sách Đăng tin BĐS (design-spec S08, bố cục như Tin tức, BL-045): bài nổi bật ngang (chỉ trang 1 `/tin-bds`, ảnh LCP) rồi lưới thẻ 1/2/3 cột (3 ≥ lg).
 * MỘT `section` có nhãn; mọi tiêu đề thẻ là `h2` ngay dưới `h1` của hero.
 */
export function PostListBody({ featured, items }: { featured: PostCardData | null; items: PostCardData[] }) {
  const t = useTranslations("page.posts");
  return (
    <section aria-label={t("gridLabel")} className="flex flex-col gap-8">
      {featured && (
        <div data-post-featured="true">
          <PostCard data={featured} variant="feature" headingLevel="h2" priority />
        </div>
      )}
      {items.length > 0 && (
        <ul data-grid-max-cols="4" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((card, index) => (
            <li key={card.id}>
              <PostCard data={card} headingLevel="h2" priority={!featured && index === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
