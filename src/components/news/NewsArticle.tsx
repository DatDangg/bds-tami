import Link from "next/link";
import { useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import type { ProjectCardData } from "@/lib/projects/project-view";
import type { Media } from "@/payload-types";
import { NewsCategoryBadge } from "./NewsCard";
import { ShareButtons } from "./ShareButtons";

/**
 * Các mảnh của bài viết `/tin-tuc/[slug]` theo design `chi-tiet-tin-tuc.webp` (BL-054). Server Component; dữ liệu do trang đọc (ISR) rồi truyền vào.
 * Bố cục 2 cột + mục lục + thẻ tư vấn: `NewsArticleSidebar`; "Bài viết liên quan" + banner tư vấn: trang.
 */

interface NewsArticleHeaderProps {
  title: string;
  excerpt: string | null | undefined;
  category: { name: string; href: string } | null;
  publishedAt: string | null | undefined;
  readMinutes: number;
  locale: Locale;
  /** URL tuyệt đối của bài (canonical); thiếu → chỉ còn nút sao chép liên kết trang hiện tại. */
  shareUrl: string | undefined;
}

/**
 * Đầu bài: badge danh mục (link trang danh mục) → `h1` → sapo (`excerpt`) → hàng tác giả = nhãn thương hiệu cố định i18n + logo (KHÔNG đọc / hiện
 * tên nhân viên `staff` — spec-validation F3) · ngày · "N phút đọc", bên phải "Chia sẻ:" + nút tròn (≥ sm cùng hàng, < sm xuống dòng).
 */
export function NewsArticleHeader({ title, excerpt, category, publishedAt, readMinutes, locale, shareUrl }: NewsArticleHeaderProps) {
  const t = useTranslations("page.newsDetail.v2");
  const tNews = useTranslations("page.news");
  return (
    <header className="flex flex-col items-start gap-4 pt-4 pb-8 text-left">
      {category && (
        <Link href={category.href} className="inline-flex min-h-11 max-w-full items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          <NewsCategoryBadge name={category.name} />
        </Link>
      )}
      <h1 className="max-w-[24ch] font-display text-h1 text-balance">{title}</h1>
      {excerpt && <p className="max-w-[60ch] text-lead text-text-secondary">{excerpt}</p>}
      <div className="mt-2 flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-dark">
            <BrandLogo tone="on-dark" className="h-auto w-7 max-w-none lg:h-auto" />
          </span>
          <div className="flex flex-col">
            <span className="text-small font-semibold text-text">{t("author")}</span>
            <span className="flex flex-wrap items-center gap-x-2 text-xsmall text-text-muted">
              {publishedAt && (
                <>
                  <time dateTime={publishedAt}>{formatDate(publishedAt, locale)}</time>
                  <span aria-hidden="true">•</span>
                </>
              )}
              <span>{tNews("readTime", { minutes: readMinutes })}</span>
            </span>
          </div>
        </div>
        <ShareButtons variant="icons" title={title} {...(shareUrl ? { url: shareUrl } : {})} />
      </div>
    </header>
  );
}

/**
 * Ảnh bìa bo góc + chú thích: `caption` của media, không có thì `alt`; không có cả hai → không chú thích (ảnh vẫn có `alt` = tiêu đề bài).
 * Chú thích lấy từ `alt` thì ảnh để `alt=""` (chữ đó đã nằm trong `figcaption`, trình đọc màn hình không đọc hai lần).
 */
export function NewsArticleCover({ cover, title }: { cover: Media; title: string }) {
  const caption = cover.caption?.trim() || "";
  const alt = cover.alt?.trim() || "";
  const figcaption = caption || alt;
  return (
    <figure className="mb-8">
      <div className="overflow-hidden rounded-[20px]">
        <ResponsiveImage
          media={cover}
          {...(caption ? { alt: alt || title } : alt ? { decorative: true } : { alt: title })}
          sizes="(min-width: 1280px) 940px, (min-width: 1024px) 70vw, 100vw"
          aspectRatio="2/1"
          priority
        />
      </div>
      {figcaption && <figcaption className="mt-3 text-center text-xsmall text-text-muted">{figcaption}</figcaption>}
    </figure>
  );
}

interface NewsArticleBodyProps {
  content: unknown;
  locale: Locale;
  tableLabel: string;
  headingIds: readonly string[];
  mentionedProjects: ReadonlyMap<string, ProjectCardData>;
}

/**
 * Nội dung bài: `RichText` dùng chung + lớp `news-prose` (globals.css) — style RIÊNG bài tin tức: đoạn văn đầu đóng khung nền nhạt, `h2` cấp gốc có số tròn
 * 01 / 02… (CSS counter, `id` neo giữ), trích dẫn có dấu ngoặc lớn trang trí, `ul` dấu tích tròn, `ol` giữ số. Trang dự án / dịch vụ / pháp lý không có lớp này nên không đổi.
 */
export function NewsArticleBody({ content, locale, tableLabel, headingIds, mentionedProjects }: NewsArticleBodyProps) {
  return <RichText data={content} locale={locale} tableLabel={tableLabel} className="news-prose" headingIds={headingIds} mentionedProjects={mentionedProjects} />;
}

/** Dòng "Thẻ:" cuối bài: chip `#tag` là link `/tin-tuc?tag=` (lọc ở danh sách, BL-054). Nơi dùng KHÔNG render ở `/en` (tags chưa localized — spec-validation F2). */
export function NewsArticleTags({ tags, listPath }: { tags: readonly string[]; listPath: string }) {
  const t = useTranslations("page.newsDetail.v2");
  const tNews = useTranslations("page.news");
  if (tags.length === 0) return null;
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6">
      <span aria-hidden="true" className="text-small font-semibold text-text">
        {t("tags")}
      </span>
      <ul aria-label={tNews("tagsLabel")} className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <Link
              href={`${listPath}?${new URLSearchParams({ tag }).toString()}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3.5 text-small text-text-secondary transition-colors hover:border-input-border hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:min-h-9"
            >
              #{tag}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
