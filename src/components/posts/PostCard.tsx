import { useTranslations } from "next-intl";
import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { PostCardData } from "@/lib/posts/post-view";
import { cn } from "@/lib/utils";
import { OfferStatusBadge } from "./OfferStatusBadge";

interface PostCardProps {
  data: PostCardData;
  /** Cấp heading của tiêu đề thẻ, theo vị trí trong trang (không nhảy cấp). */
  headingLevel: "h2" | "h3";
  /** Ảnh LCP của trang (thẻ đầu danh sách): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới mặc định (slider trang chủ). */
  imageSizes?: string;
}

const IMAGE_ZOOM = "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";
const IMAGE_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * Thẻ Đăng tin BĐS (design-spec §3.2 "Tin/ưu đãi", S08): cả thẻ là MỘT link, cùng kiểu RentalCard/ProjectCard (thẻ trắng bo 20px, ảnh 4:3, tiêu đề 2 dòng). Có `offer.endAt`: badge "Còn n ngày" (≤ 3 ngày)
 * hoặc "Đã kết thúc" (ảnh mờ `opacity 0.7`, thẻ vẫn hiện, BR-06). Server hoặc Client Component (dùng được trong slider client của trang chủ).
 */
export function PostCard({ data, headingLevel, priority = false, imageSizes }: PostCardProps) {
  const t = useTranslations("page.posts");
  const Heading = headingLevel;
  const ended = data.badge?.kind === "ended";
  return (
    <article className="h-full">
      <Link
        href={data.href}
        className="group flex h-full min-h-11 flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
      >
        <div className={cn("relative aspect-[4/3] w-full overflow-hidden bg-surface-muted", IMAGE_ZOOM)}>
          {data.cover && (
            <ResponsiveImage media={data.cover} sizes={imageSizes ?? IMAGE_SIZES} aspectRatio="4/3" priority={priority} decorative className={cn(ended && "opacity-70")} />
          )}
          {data.badge && <OfferStatusBadge badge={data.badge} className="absolute top-3 left-3" />}
        </div>
        <div className="flex min-w-0 flex-col gap-1 p-4">
          {data.categoryName && <p className="text-xsmall font-semibold text-accent-text">{data.categoryName}</p>}
          <Heading className="line-clamp-2 font-display text-h4 group-hover:underline group-hover:underline-offset-4">{data.title}</Heading>
          {data.excerpt && <p className="line-clamp-2 text-small text-text-secondary">{data.excerpt}</p>}
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
