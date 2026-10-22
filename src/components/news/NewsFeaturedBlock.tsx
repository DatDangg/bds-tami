import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CARD_IMAGE_ZOOM, CardArrow } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { NewsCategoryBadge, NewsReadTime } from "@/components/news/NewsCard";
import type { NewsCardData } from "@/lib/news/news-view";
import { cn } from "@/lib/utils";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring";

/**
 * Bài lớn của khối nổi bật: ảnh phủ cả thẻ (LCP, `priority`) + scrim token đậm dần xuống đáy, chữ trắng: badge danh mục → tiêu đề → tóm tắt →
 * nhãn thương hiệu "TAMI REAL ESTATE" (i18n, không đọc / hiện tên `staff` — spec-validation F3) · ngày · "N phút đọc", nút mũi tên tròn vàng. Cả thẻ là MỘT link.
 */
function LeadArticle({ data }: { data: NewsCardData }) {
  const t = useTranslations("page.news.v2");
  return (
    <article className="h-full">
      <Link
        href={data.href}
        className={cn("group relative isolate flex h-full min-h-[420px] flex-col justify-end overflow-hidden rounded-xl bg-dark-deep text-on-dark lg:min-h-[480px]", FOCUS_RING, CARD_IMAGE_ZOOM)}
      >
        {data.cover && <ResponsiveImage media={data.cover} sizes="(min-width: 1280px) 780px, (min-width: 1024px) 62vw, 100vw" priority decorative className="absolute inset-0 -z-10" />}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-dark-deep/90 via-dark-deep/55 via-55% to-dark-deep/5" />
        <div className="flex min-w-0 flex-col items-start gap-3 p-5 sm:p-8">
          {data.categoryName && <NewsCategoryBadge name={data.categoryName} tone="on-image" />}
          <h2 className="max-w-[36rem] font-display text-h2 text-balance transition-colors group-hover:text-on-dark-accent group-focus-visible:text-on-dark-accent">{data.title}</h2>
          {data.excerpt && <p className="line-clamp-2 max-w-[38rem] text-body text-on-dark/90">{data.excerpt}</p>}
          <div className="mt-1 flex w-full items-center justify-between gap-4">
            <p className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-small text-on-dark/90">
              <span className="inline-flex items-center gap-2 font-semibold text-on-dark-accent">
                <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-on-dark p-1">
                  <BrandLogo className="h-3.5 max-w-none lg:h-3.5" />
                </span>
                {t("brand")}
              </span>
              {data.dateLabel && data.publishedAt && <time dateTime={data.publishedAt}>{data.dateLabel}</time>}
              <NewsReadTime minutes={data.readMinutes} />
            </p>
            <span aria-hidden="true" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-badge-foreground">
              <ArrowRight size={20} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Một bài nhỏ ở cột phải khối nổi bật: ảnh trái → danh mục (chữ nhấn) + tiêu đề 3 dòng + ngày, mũi tên tròn góc dưới. Cả hàng là MỘT link. */
function SideArticle({ data }: { data: NewsCardData }) {
  return (
    <article>
      <Link href={data.href} className={cn("group grid min-h-11 grid-cols-[112px_1fr] gap-4 py-4 sm:grid-cols-[128px_1fr]", FOCUS_RING)}>
        <div className={cn("aspect-[4/3] overflow-hidden rounded-md bg-surface-muted", CARD_IMAGE_ZOOM)}>
          {data.cover && <ResponsiveImage media={data.cover} sizes="128px" aspectRatio="4/3" decorative />}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {data.categoryName && <p className="truncate text-xsmall font-semibold tracking-wide text-accent-text uppercase">{data.categoryName}</p>}
          <h2 className="line-clamp-3 text-small font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{data.title}</h2>
          <div className="mt-auto flex items-end justify-between gap-2">
            {data.dateLabel && data.publishedAt ? (
              <time dateTime={data.publishedAt} className="text-xsmall text-text-muted">
                {data.dateLabel}
              </time>
            ) : (
              <span />
            )}
            <CardArrow />
          </div>
        </div>
      </Link>
    </article>
  );
}

/**
 * Khối nổi bật trang 1 `/tin-tuc` (BL-054, design `tin-tuc.webp`): bài lớn bên trái + thẻ trắng 3 bài nhỏ bên phải (≥ lg), < lg xếp dọc.
 * Tiêu đề bài là `h2` (ngay dưới `h1` của hero). Không có bài → không render. Server Component.
 */
export function NewsFeaturedBlock({ items }: { items: readonly NewsCardData[] }) {
  const t = useTranslations("page.news.v2");
  const [lead, ...side] = items;
  if (!lead) return null;
  return (
    <section data-news-featured="true" aria-label={t("featuredLabel")} className={cn("grid gap-6", side.length > 0 && "lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]")}>
      <LeadArticle data={lead} />
      {side.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface px-4 sm:px-5">
          {side.map((item) => (
            <li key={item.id}>
              <SideArticle data={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
