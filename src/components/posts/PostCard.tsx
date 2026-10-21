import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Bed, CalendarCheck, Clock, MapPin, Ruler } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CARD_TITLE_CLASS, CardArrow, CardFooter, CardPin } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatArea } from "@/lib/format";
import type { PostCardData } from "@/lib/posts/post-view";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import { OfferStatusBadge } from "./OfferStatusBadge";

interface PostCardProps {
  data: PostCardData;
  /** Cấp heading của tiêu đề thẻ, theo vị trí trong trang (không nhảy cấp). */
  headingLevel: "h2" | "h3";
  /** Ảnh LCP của trang (thẻ đầu danh sách): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới mặc định (slider trang chủ). */
  imageSizes?: string;
  /** Xem JSDoc của `PostCard`. */
  variant?: "listing" | "home" | "feature";
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

/** Badge góc ảnh của thẻ `listing`: trạng thái ưu đãi ("Còn n ngày" / "Đã kết thúc", BR-06) nếu có, không thì "Ưu đãi" khi tin có ưu đãi. */
function ListingOfferBadge({ data }: { data: PostCardData }) {
  const t = useTranslations("postCard");
  if (data.badge) return <OfferStatusBadge badge={data.badge} className="absolute top-3 left-3" />;
  if (!data.hasOffer) return null;
  return <Badge className="absolute top-3 left-3">{t("offer")}</Badge>;
}

/** Thân thẻ BĐS: tag danh mục + loại hình → tên → ghim vị trí → giá (rút gọn / ghi chú giá / "Liên hệ") → diện tích · phòng ngủ + mũi tên. */
function PropertyBody({ data, Heading }: { data: PostCardData; Heading: "h2" | "h3" }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("postCard");
  const tType = useTranslations("listingOptions.propertyType");
  const tags = [data.categoryName, data.propertyType ? tType(data.propertyType) : null].filter((tag): tag is string => Boolean(tag));
  const hasSpecs = data.areaM2 !== null || data.bedrooms !== null;
  return (
    <>
      {tags.length > 0 && (
        <ul aria-label={t("tagsLabel")} className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <li key={`${index}:${tag}`} className="rounded-pill bg-surface-muted px-2.5 py-0.5 text-xsmall text-text-secondary">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <Heading className={CARD_TITLE_CLASS}>{data.title}</Heading>
      {data.placeLabel && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <CardPin label={data.placeLabel} />
        </p>
      )}
      <p className="text-body font-semibold text-accent-text">{data.priceLabel ?? t("contact")}</p>
      <div className={cn("mt-auto flex items-end gap-3 pt-1", hasSpecs ? "justify-between" : "justify-end")}>
        {hasSpecs && (
          <ul aria-label={t("specsLabel")} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
            {data.areaM2 !== null && (
              <li className="inline-flex items-center gap-1.5">
                <Ruler size={16} aria-hidden="true" className="shrink-0" />
                {formatArea(data.areaM2, locale)}
              </li>
            )}
            {data.bedrooms !== null && (
              <li className="inline-flex items-center gap-1.5">
                <Bed size={16} aria-hidden="true" className="shrink-0" />
                <span aria-hidden="true">{t("bedrooms", { count: data.bedrooms })}</span>
                <span className="sr-only">{t("bedroomsLabel", { count: data.bedrooms })}</span>
              </li>
            )}
          </ul>
        )}
        <CardArrow />
      </div>
    </>
  );
}

/** Thân thẻ voucher: tên → hạn ưu đãi → trạng thái "Còn hạn" / "Đã kết thúc" (BR-06, cùng nguồn `isOfferEnded`) + mũi tên. Không giá / diện tích. */
function VoucherBody({ data, Heading }: { data: PostCardData; Heading: "h2" | "h3" }) {
  const t = useTranslations("postCard");
  const ended = data.badge?.kind === "ended";
  return (
    <>
      {data.categoryName && <p className="text-xsmall font-semibold text-accent-text">{data.categoryName}</p>}
      <Heading className={CARD_TITLE_CLASS}>{data.title}</Heading>
      {data.endLabel && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <CalendarCheck size={16} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{t("offerEnds", { date: data.endLabel })}</span>
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <Badge variant={ended ? "muted" : "success"} data-offer-status={ended ? "ended" : "active"}>
          {t(ended ? "offerEnded" : "offerActive")}
        </Badge>
        <CardArrow />
      </div>
    </>
  );
}

/**
 * Thẻ Đăng tin BĐS DÙNG CHUNG (cùng khung thẻ Dự án / Cho thuê: trắng bo 20px, ảnh 11:10, tên 2 dòng, mũi tên tròn; không icon tim). Cả thẻ là MỘT link.
 * Server hoặc Client Component (dùng được trong slider client của trang chủ). Ưu đãi đã kết thúc: ảnh mờ `opacity 0.7`, thẻ vẫn hiện (BR-06).
 * - `listing` (mặc định, BL-052): danh sách `/tin-bds`, tin liên quan, tin trong trang dự án — `data.kind` chọn thẻ BĐS (giá, diện tích, phòng ngủ, tag loại hình,
 *   badge ưu đãi nếu có) hoặc thẻ voucher (hạn ưu đãi + Còn hạn / Đã kết thúc thay giá / diện tích).
 * - `home`: slider Ưu đãi trang chủ GIỮ thẻ BL-045 (danh mục, tên, giá, ngày đăng + "Đến ngày"; spec BL-052 F3).
 * - `feature`: bài nổi bật ngang (bố cục BL-045 Q4, tới khi trang danh sách chuyển sang slider nổi bật).
 */
export function PostCard({ data, headingLevel, priority = false, imageSizes, variant = "listing" }: PostCardProps) {
  const Heading = headingLevel;
  const ended = data.badge?.kind === "ended";
  if (variant === "feature") return <FeaturePostCard data={data} headingLevel={headingLevel} priority={priority} imageSizes={imageSizes} />;
  if (variant === "home") return <HomePostCard data={data} headingLevel={headingLevel} priority={priority} imageSizes={imageSizes} />;
  return (
    <article className="h-full" data-card-variant="listing" data-post-kind={data.kind}>
      <Link href={data.href} className={CARD_LINK_CLASS}>
        <div className={cn("relative aspect-[11/10] w-full shrink-0 overflow-hidden bg-surface-muted", CARD_IMAGE_ZOOM)}>
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes={imageSizes ?? IMAGE_SIZES} aspectRatio="11/10" priority={priority} decorative className={cn(ended && "opacity-70")} />
          ) : (
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
          <ListingOfferBadge data={data} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          {data.kind === "voucher" ? <VoucherBody data={data} Heading={Heading} /> : <PropertyBody data={data} Heading={Heading} />}
        </div>
      </Link>
    </article>
  );
}

/** Thẻ trang chủ (BL-045, markup giữ nguyên): danh mục, tên, giá (nếu có), hàng cuối ngày đăng + "Đến ngày" + mũi tên tròn. */
function HomePostCard({ data, headingLevel: Heading, priority, imageSizes }: Pick<PostCardProps, "data" | "headingLevel" | "imageSizes"> & { priority: boolean }) {
  const t = useTranslations("page.posts");
  const ended = data.badge?.kind === "ended";
  return (
    <article className="h-full" data-card-variant="home">
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
