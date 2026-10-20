import { useTranslations } from "next-intl";
import { useId } from "react";
import { CardSlider } from "@/components/layout/CardSlider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * "Tin liên quan" cuối trang chi tiết Đăng tin BĐS (BL-045 Q4, mockup `.sec.white`, DECISIONS #6): dải nền TRẮNG, đầu khối canh TRÁI rồi `CardSlider` của `PostCard`
 * (cùng thẻ danh sách). Rỗng → không dựng gì. Server Component.
 */
export function RelatedPosts({ posts }: { posts: PostCardData[] }) {
  const t = useTranslations("page.postDetail.related");
  const headingId = useId();
  if (posts.length === 0) return null;
  const items = posts.map((post) => <PostCard key={post.id} data={post} headingLevel="h3" imageSizes={IMAGE_SIZES} />);
  // `raw`: giữ nguyên `{index}` / `{total}` để CardSlider thay (nhãn truyền được từ Server Component).
  const labels = { slide: t.raw("slide") as string, previous: t("previous"), next: t("next"), dots: t("dots"), goTo: t.raw("goTo") as string };
  return (
    <section aria-labelledby={headingId} className="bg-surface py-section-tight">
      <div className="mx-auto mb-8 w-full max-w-container px-gutter">
        <SectionHeading id={headingId} eyebrow={t("eyebrow")} title={t("title")} titleAccent={t("titleAccent")} description={t("description")} />
      </div>
      <div className="mx-auto w-full max-w-container">
        <CardSlider items={items} labelledBy={headingId} labels={labels} />
      </div>
    </section>
  );
}
