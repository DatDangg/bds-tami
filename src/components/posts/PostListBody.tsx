import { useTranslations } from "next-intl";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";

/**
 * Thân danh sách Đăng tin BĐS (design-spec S08, bố cục như Tin tức, BL-045): tin nổi bật đầu tiên dạng ngang (chỉ trang 1, ảnh LCP), các tin nổi bật còn lại
 * đứng đầu lưới (BL-052 có tới 5 tin nổi bật; bố cục slider nổi bật thuộc P3-T03), rồi lưới thẻ 1/2/3 cột (3 ≥ lg).
 * MỘT `section` có nhãn; mọi tiêu đề thẻ là `h2` ngay dưới `h1` của hero.
 */
export function PostListBody({ featured, items }: { featured: PostCardData[]; items: PostCardData[] }) {
  const t = useTranslations("page.posts");
  const [lead, ...otherFeatured] = featured;
  const grid = [...otherFeatured, ...items];
  return (
    <section aria-label={t("gridLabel")} className="flex flex-col gap-8">
      {lead && (
        <div data-post-featured="true">
          <PostCard data={lead} variant="feature" headingLevel="h2" priority />
        </div>
      )}
      {grid.length > 0 && (
        <ul data-grid-max-cols="4" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grid.map((card, index) => (
            <li key={card.id}>
              <PostCard data={card} headingLevel="h2" priority={!lead && index === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
