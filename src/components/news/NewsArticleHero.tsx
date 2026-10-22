import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { NewsCategoryBadge } from "./NewsCard";
import { ShareButtons } from "./ShareButtons";

interface NewsArticleHeroProps {
  title: string;
  excerpt: string | null | undefined;
  /** Ảnh bìa của bài (nền hero, trang trí); không có → nền tối thương hiệu. */
  cover: MediaImage | null;
  category: { name: string; href: string } | null;
  publishedAt: string | null | undefined;
  readMinutes: number;
  locale: Locale;
  /** URL tuyệt đối của bài (canonical); thiếu → chỉ còn nút sao chép liên kết trang hiện tại. */
  shareUrl: string | undefined;
  /** `Breadcrumb variant="overlay"` do trang dựng; đặt góc trên-trái hero. */
  breadcrumb: React.ReactNode;
}

/**
 * Hero đầu bài `/tin-tuc/[slug]` (BL-062 D1, design `chi-tiet-tin-tuc-v2.webp`): ảnh bìa toàn chiều ngang + scrim token (đậm bên chữ ≥ lg, đậm đáy < lg → chữ trắng đạt AA
 * trên ảnh sáng), breadcrumb kính ở góc → chip danh mục (link) → `h1` → sapo → hàng đáy: logo tròn + "Bài viết bởi TAMI REAL ESTATE" + "Ngày đăng · N phút đọc" (KHÔNG đọc /
 * hiện tên nhân viên `staff` — spec-validation F3) và "Chia sẻ:" (`ShareButtons tone="on-dark"`; < lg xuống dòng dưới tác giả). Không ảnh bìa → nền `bg-dark-deep`, cùng chiều cao.
 * Server Component; mỗi trang đúng một `h1`.
 */
export function NewsArticleHero({ title, excerpt, cover, category, publishedAt, readMinutes, locale, shareUrl, breadcrumb }: NewsArticleHeroProps) {
  const t = useTranslations("page.newsDetail.v2");
  const tNews = useTranslations("page.news");
  return (
    <section data-news-hero="" className="theme-dark-block relative isolate flex min-h-[26rem] items-end overflow-hidden bg-dark-deep text-on-dark lg:min-h-[28.75rem]">
      {cover && (
        <>
          <ResponsiveImage media={cover} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-banner-scrim" />
          {/* ≥ lg: đậm phía chữ (trái) nhạt dần sang phải như design; < lg chữ phủ cả bề ngang nên đậm dần xuống đáy. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-banner-scrim to-transparent max-lg:hidden" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-banner-scrim via-banner-scrim to-transparent lg:hidden" />
        </>
      )}
      <div className="absolute inset-x-0 top-5 z-10">
        <div className="mx-auto w-full max-w-container px-gutter">{breadcrumb}</div>
      </div>
      <header className="mx-auto flex w-full max-w-container flex-col items-start gap-4 px-gutter pt-24 pb-8 text-left lg:pb-10">
        {category && (
          <Link href={category.href} className="inline-flex min-h-11 max-w-full items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-dark">
            <NewsCategoryBadge name={category.name} tone="on-image" />
          </Link>
        )}
        <h1 className="max-w-full font-display text-h1 text-balance text-on-dark lg:max-w-[min(100%,36rem)]">{title}</h1>
        {excerpt && <p className="max-w-[60ch] text-lead text-on-dark max-lg:line-clamp-4 lg:max-w-[36rem]">{excerpt}</p>}
        <div className="mt-2 flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-on-dark/70 bg-dark">
              <BrandLogo tone="on-dark" className="h-auto w-7 max-w-none lg:h-auto" />
            </span>
            <div className="flex flex-col">
              <span className="text-small font-semibold text-on-dark">{t("author")}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-xsmall text-on-dark">
                {publishedAt && (
                  <>
                    <time dateTime={publishedAt}>{t("publishedOn", { date: formatDate(publishedAt, locale) })}</time>
                    <span aria-hidden="true">•</span>
                  </>
                )}
                <span>{tNews("readTime", { minutes: readMinutes })}</span>
              </span>
            </div>
          </div>
          <ShareButtons variant="icons" tone="on-dark" title={title} {...(shareUrl ? { url: shareUrl } : {})} />
        </div>
      </header>
    </section>
  );
}
