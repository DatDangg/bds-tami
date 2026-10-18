import { useTranslations } from "next-intl";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";

/**
 * Thân danh sách Đăng tin BĐS (design-spec S08): bài nổi bật thẻ ngang lớn (7/5 ở ≥ lg) rồi lưới thẻ 1/2/3 cột. Mọi tiêu đề thẻ là `h2`
 * ngay dưới `h1` của banner; hai khối là `section` có nhãn để dễ nhảy vùng.
 */
export function PostListBody({ featured, items }: { featured: PostCardData | null; items: PostCardData[] }) {
  const t = useTranslations("page.posts");
  return (
    <>
      {featured && (
        <section aria-label={t("featuredLabel")}>
          <PostCard data={featured} variant="feature" headingLevel="h2" priority />
        </section>
      )}
      {items.length > 0 && (
        <section aria-label={featured ? t("moreLabel") : t("title")}>
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
