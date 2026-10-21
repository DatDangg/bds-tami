import { useLocale, useTranslations } from "next-intl";
import { SimilarCarousel } from "@/components/detail/SimilarCarousel";
import { publicPath } from "@/lib/content/content-paths";
import type { PostCardData } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import { PostCard } from "./PostCard";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * "Tin liên quan" cuối trang chi tiết Đăng tin BĐS (BL-052, cùng `SimilarCarousel` với "Dự án tương tự" / "Căn tương tự"): dải nền trắng, đầu khối canh trái + "Xem tất cả tin đăng"
 * (→ `/tin-bds`), slider `PostCard` như đang có. `id` là đích của tab "Tin liên quan" (bọc ngoài khối, `scroll-mt` dưới thanh tab dính). Rỗng → không dựng gì. Server Component.
 */
export function RelatedPosts({ posts, id }: { posts: PostCardData[]; id?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.postDetail");
  if (posts.length === 0) return null;
  const items = posts.map((post) => <PostCard key={post.id} data={post} headingLevel="h3" imageSizes={IMAGE_SIZES} />);
  // `raw`: giữ nguyên `{index}` / `{total}` để CardSlider thay (nhãn truyền được từ Server Component).
  const labels = {
    slide: t.raw("related.slide") as string,
    previous: t("related.previous"),
    next: t("related.next"),
    dots: t("related.dots"),
    goTo: t.raw("related.goTo") as string,
  };
  return (
    <div id={id} tabIndex={-1} className="scroll-mt-[calc(var(--sticky-top)+4.5rem)] focus:outline-none">
      <SimilarCarousel
        items={items}
        eyebrow={t("related.eyebrow")}
        title={t("related.title")}
        titleAccent={t("related.titleAccent")}
        viewAll={{ href: publicPath("/tin-bds", locale), label: t("v2.similarViewAll") }}
        labels={labels}
      />
    </div>
  );
}
