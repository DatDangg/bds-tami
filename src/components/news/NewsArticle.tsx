import Link from "next/link";
import { useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import type { Locale } from "@/i18n/routing";
import type { ProjectCardData } from "@/lib/projects/project-view";

/**
 * Các mảnh thân bài `/tin-tuc/[slug]` (BL-062, design `chi-tiet-tin-tuc-v2.webp`). Hero đầu bài: `NewsArticleHero`; khung liên hệ cuối bài: `NewsArticleContactNote`;
 * cột trái (mục lục + thẻ tư vấn): `NewsArticleSidebar`; "Bài viết liên quan" + banner tư vấn: trang. Server Component.
 */

interface NewsArticleBodyProps {
  content: unknown;
  locale: Locale;
  tableLabel: string;
  headingIds: readonly string[];
  mentionedProjects: ReadonlyMap<string, ProjectCardData>;
}

/**
 * Nội dung bài: `RichText` dùng chung + lớp `news-prose` (globals.css) — style RIÊNG bài tin tức: đoạn mở đầu cỡ `--text-lead` (không khung), `h2` cấp gốc có số tròn
 * 01 / 02… (CSS counter, `id` neo giữ) và khối sau `h2` thụt cùng rãnh chữ, trích dẫn có dấu ngoặc lớn trang trí, `ul` cấp gốc dấu tích tròn vàng, `ol` giữ số.
 * Trang dự án / dịch vụ / pháp lý không có lớp này nên không đổi.
 */
export function NewsArticleBody({ content, locale, tableLabel, headingIds, mentionedProjects }: NewsArticleBodyProps) {
  return <RichText data={content} locale={locale} tableLabel={tableLabel} className="news-prose" headingIds={headingIds} mentionedProjects={mentionedProjects} />;
}

/** Dòng "Thẻ:" cuối bài: chip pill (không `#`) là link `/tin-tuc?tag=` (lọc ở danh sách). Nơi dùng KHÔNG render ở `/en` (tags chưa localized — spec-validation F2). */
export function NewsArticleTags({ tags, listPath }: { tags: readonly string[]; listPath: string }) {
  const t = useTranslations("page.newsDetail.v2");
  const tNews = useTranslations("page.news");
  if (tags.length === 0) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
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
              {tag}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
