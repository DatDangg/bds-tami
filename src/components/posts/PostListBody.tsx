import { useTranslations } from "next-intl";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";

/**
 * Thân danh sách Đăng tin BĐS (design-spec S08): dòng "Có N kết quả" (aria-live), bài nổi bật thẻ ngang lớn (7/5 ở ≥ lg) rồi lưới thẻ 1/2/3/4 cột (4 ≥ xl, như `/cho-thue`). Mọi tiêu đề thẻ là `h2`
 * ngay dưới `h1` của banner; hai khối là `section` có nhãn để dễ nhảy vùng.
 */
export function PostListBody({ featured, items, totalDocs }: { featured: PostCardData | null; items: PostCardData[]; totalDocs: number }) {
  const t = useTranslations("page.posts");
  return (
    <>
      <p role="status" aria-live="polite" className="text-small text-text-secondary">
        {t("resultCount", { count: totalDocs })}
      </p>
      {featured && (
        <section aria-label={t("featuredLabel")}>
          <PostCard data={featured} variant="feature" headingLevel="h2" priority />
        </section>
      )}
      {items.length > 0 && (
        <section aria-label={featured ? t("moreLabel") : t("title")}>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <li key={item.id}>
                <PostCard data={item} headingLevel="h2" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
