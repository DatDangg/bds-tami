import { useTranslations } from "next-intl";
import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { PostCardData } from "@/lib/posts/post-view";
import { cn } from "@/lib/utils";
import { OfferStatusBadge } from "./OfferStatusBadge";

type PostCardVariant = "card" | "feature";

interface PostCardProps {
  data: PostCardData;
  /** `card`: thẻ dọc của lưới · `feature`: bài nổi bật đầu trang (S08). */
  variant?: PostCardVariant;
  /** Cấp heading của tiêu đề thẻ, theo vị trí trong trang (không nhảy cấp). */
  headingLevel: "h2" | "h3";
  /** Ảnh LCP của trang (chỉ bài nổi bật đầu trang): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới mặc định (slider trang chủ). */
  imageSizes?: string;
}

const IMAGE_ZOOM = "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";
const IMAGE_SIZES: Record<PostCardVariant, string> = {
  card: "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  feature: "(min-width: 1024px) 700px, 100vw",
};

/**
 * Thẻ Đăng tin BĐS (design-spec §3.2 "Tin/ưu đãi", S08): cả thẻ là MỘT link. Có `offer.endAt`: badge "Còn n ngày" (≤ 3 ngày) hoặc "Đã kết thúc"
 * (ảnh mờ `opacity 0.7`, thẻ vẫn hiện, BR-06). Thẻ `card` trắng bo 20px như RentalCard (BL-020 P3). Bài nổi bật `feature` ngang 7/5 ở ≥ lg, dọc ở nhỏ hơn. Server hoặc Client Component (dùng được trong slider client của trang chủ).
 */
export function PostCard({ data, variant = "card", headingLevel, priority = false, imageSizes }: PostCardProps) {
  const t = useTranslations("page.posts");
  const Heading = headingLevel;
  const isFeature = variant === "feature";
  const ended = data.badge?.kind === "ended";
  return (
    <article className={cn(!isFeature && "h-full")}>
      <Link
        href={data.href}
        className={cn(
          "group min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring",
          isFeature
            ? "grid gap-4 rounded-xl lg:grid-cols-12 lg:items-center lg:gap-10"
            : "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md",
        )}
      >
        <div className={cn("relative w-full overflow-hidden bg-surface-muted aspect-[16/10]", IMAGE_ZOOM, isFeature && "rounded-xl lg:col-span-7")}>
          {data.cover && (
            <ResponsiveImage
              media={data.cover}
              sizes={imageSizes ?? IMAGE_SIZES[variant]}
              aspectRatio="16/10"
              priority={priority}
              decorative
              className={cn(ended && "opacity-70")}
            />
          )}
          {data.badge && <OfferStatusBadge badge={data.badge} className="absolute top-3 left-3" />}
        </div>
        <div className={cn("flex min-w-0 flex-col gap-2", isFeature ? "lg:col-span-5" : "p-4")}>
          {data.categoryName && <p className="text-xsmall font-semibold text-accent-text">{data.categoryName}</p>}
          <Heading className={cn("group-hover:underline group-hover:underline-offset-4", isFeature ? "font-display text-h3 font-medium lg:text-h2-sm" : "text-h4 font-semibold")}>
            {data.title}
          </Heading>
          {data.excerpt && <p className={cn("text-body text-text-secondary", isFeature ? "line-clamp-3" : "line-clamp-2")}>{data.excerpt}</p>}
          {data.priceLabel && <p className="text-small font-semibold">{data.priceLabel}</p>}
          <p className="flex flex-wrap items-center gap-x-3 text-xsmall text-text-muted">
            {data.dateLabel && data.publishedAt && <time dateTime={data.publishedAt}>{data.dateLabel}</time>}
            {data.endLabel && <span>{t("endsOn", { date: data.endLabel })}</span>}
          </p>
        </div>
      </Link>
    </article>
  );
}
