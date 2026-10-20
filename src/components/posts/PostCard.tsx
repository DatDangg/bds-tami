import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Clock } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CARD_TITLE_CLASS, CardFooter } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { buttonVariants } from "@/components/ui/button";
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
  /** `feature`: bài nổi bật ngang đầu `/tin-bds` (ảnh trái, chữ + nút phải, như bài nổi bật của Tin tức). */
  variant?: "card" | "feature";
}

const IMAGE_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
const FEATURE_IMAGE_SIZES = "(min-width: 1280px) 700px, (min-width: 1024px) 55vw, 100vw";

/** Bài nổi bật ngang (mockup `.feat`): cùng khung với bài nổi bật Tin tức; cả khối là MỘT link, nút "Xem chi tiết" chỉ là giao diện. */
function FeaturePostCard({ data, headingLevel: Heading, priority, imageSizes }: Pick<PostCardProps, "data" | "headingLevel" | "imageSizes"> & { priority: boolean }) {
  const t = useTranslations("page.posts");
  const ended = data.badge?.kind === "ended";
  return (
    <article>
      <Link
        href={data.href}
        className="group grid min-h-11 overflow-hidden rounded-xl border border-border bg-surface shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-8"
      >
        <div className={cn("relative aspect-[16/10] w-full overflow-hidden bg-surface-muted lg:aspect-auto lg:h-full lg:min-h-[340px]", CARD_IMAGE_ZOOM)}>
          {data.cover && <ResponsiveImage media={data.cover} sizes={imageSizes ?? FEATURE_IMAGE_SIZES} aspectRatio="16/10" priority={priority} decorative className={cn(ended && "opacity-70")} />}
          {data.badge && <OfferStatusBadge badge={data.badge} className="absolute top-3 left-3" />}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-3 p-5 lg:py-8 lg:pr-8 lg:pl-0">
          {data.categoryName && <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{data.categoryName}</p>}
          <Heading className="font-display text-h3 font-medium text-balance transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{data.title}</Heading>
          {data.priceLabel && <p className="text-body font-semibold text-accent-text">{data.priceLabel}</p>}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
            {data.dateLabel && data.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Clock size={16} aria-hidden="true" className="shrink-0" />
                <time dateTime={data.publishedAt}>{data.dateLabel}</time>
              </span>
            )}
            {data.endLabel && <span>{t("endsOn", { date: data.endLabel })}</span>}
          </p>
          <span className={buttonVariants()}>
            {t("viewDetail")}
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}

/**
 * Thẻ Đăng tin BĐS / ưu đãi (design-spec §3.2 "Tin/ưu đãi", S08; BL-045): cùng khung thẻ Dự án (trắng bo 20px, ảnh 11:10, tên 2 dòng), thân: danh mục, tên, giá (nếu có),
 * hàng cuối ngày đăng + mũi tên tròn. Có `offer.endAt`: badge "Còn n ngày" (≤ 3 ngày) hoặc "Đã kết thúc" (ảnh mờ `opacity 0.7`, thẻ vẫn hiện, BR-06).
 * Cả thẻ là MỘT link. Server hoặc Client Component (dùng được trong slider client của trang chủ).
 */
export function PostCard({ data, headingLevel, priority = false, imageSizes, variant = "card" }: PostCardProps) {
  const t = useTranslations("page.posts");
  const Heading = headingLevel;
  const ended = data.badge?.kind === "ended";
  if (variant === "feature") return <FeaturePostCard data={data} headingLevel={headingLevel} priority={priority} imageSizes={imageSizes} />;
  return (
    <article className="h-full">
      <Link href={data.href} className={CARD_LINK_CLASS}>
        <div className={cn("relative aspect-[11/10] w-full shrink-0 overflow-hidden bg-surface-muted", CARD_IMAGE_ZOOM)}>
          {data.cover && (
            <ResponsiveImage media={data.cover} sizes={imageSizes ?? IMAGE_SIZES} aspectRatio="11/10" priority={priority} decorative className={cn(ended && "opacity-70")} />
          )}
          {data.badge && <OfferStatusBadge badge={data.badge} className="absolute top-3 left-3" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          {data.categoryName && <p className="text-xsmall font-semibold text-accent-text">{data.categoryName}</p>}
          <Heading className={CARD_TITLE_CLASS}>{data.title}</Heading>
          {data.priceLabel && <p className="text-body font-semibold text-accent-text">{data.priceLabel}</p>}
          <CardFooter>
            {data.dateLabel && data.publishedAt && (
              <>
                <Clock size={16} aria-hidden="true" className="shrink-0" />
                <time dateTime={data.publishedAt} className="text-xsmall">
                  {data.dateLabel}
                </time>
              </>
            )}
            {data.endLabel && <span className="ml-3 truncate text-xsmall">{t("endsOn", { date: data.endLabel })}</span>}
          </CardFooter>
        </div>
      </Link>
    </article>
  );
}
