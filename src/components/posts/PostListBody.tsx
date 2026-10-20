import { useTranslations } from "next-intl";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";

/**
 * Thân danh sách Đăng tin BĐS (design-spec S08), cùng khối kết quả như `/du-an`, `/cho-thue`: MỘT `section` có nhãn chứa dòng "Có N kết quả" (aria-live)
 * và lưới thẻ 1/2/3/4 cột (4 ≥ xl). Bài nổi bật chỉ là thẻ ĐẦU lưới (ảnh LCP), không còn thẻ ngang riêng. Mọi tiêu đề thẻ là `h2` ngay dưới `h1` của banner.
 */
export function PostListBody({ featured, items, totalDocs }: { featured: PostCardData | null; items: PostCardData[]; totalDocs: number }) {
  const t = useTranslations("page.posts");
  const cards = featured ? [featured, ...items] : items;
  return (
    <section aria-label={t("gridLabel")} className="flex flex-col gap-6">
      <p role="status" aria-live="polite" className="text-small text-text-secondary">
        {t("resultCount", { count: totalDocs })}
      </p>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => (
          <li key={card.id}>
            <PostCard data={card} headingLevel="h2" priority={index === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}
