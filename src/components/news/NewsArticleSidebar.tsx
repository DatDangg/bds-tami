import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { buttonVariants } from "@/components/ui/button";
import type { NewsCardData } from "@/lib/news/news-view";

interface NewsArticleSidebarProps {
  /** ≤ 3 bài mới nhất cùng ngôn ngữ, đã loại bài đang đọc. */
  latest: NewsCardData[];
  /** Đích của nút tư vấn (`/lien-he` theo ngôn ngữ), KHÔNG có form ở cột này. */
  contactHref: string;
}

/**
 * Cột phải trang bài viết (mockup `.art-side`, BL-045): thẻ "Bài viết mới" (`mini` ảnh + tiêu đề + ngày) và thẻ tư vấn tối (chỉ nút → liên hệ).
 * ≥ lg dính dưới header khi cuộn; nhỏ hơn lg xếp sau nội dung bài. Server Component. Mỗi thẻ là `section` có nhãn (`h2`).
 */
export function NewsArticleSidebar({ latest, contactHref }: NewsArticleSidebarProps) {
  const t = useTranslations("page.newsDetail");
  return (
    <aside className="grid gap-5 lg:sticky lg:top-(--sticky-top) lg:self-start lg:pt-14">
      {latest.length > 0 && (
        <section aria-labelledby="latest-news" className="rounded-xl border border-border bg-surface p-5">
          <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{t("latestEyebrow")}</p>
          <h2 id="latest-news" className="mb-2 font-display text-h3">
            {t("latestTitle")}
          </h2>
          <ul>
            {latest.map((item) => (
              <li key={item.id} className="border-t border-border first:border-t-0">
                <Link
                  href={item.href}
                  className="group grid min-h-11 grid-cols-[84px_1fr] items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <div className="aspect-[7/5] w-[84px] overflow-hidden rounded-md bg-surface-muted">
                    {item.cover && <ResponsiveImage media={item.cover} sizes="84px" aspectRatio="7/5" decorative />}
                  </div>
                  <span className="min-w-0">
                    <b className="line-clamp-3 block text-small font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{item.title}</b>
                    {item.dateLabel && item.publishedAt && (
                      <time dateTime={item.publishedAt} className="text-xsmall text-text-muted">
                        {item.dateLabel}
                      </time>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="article-consult" className="theme-dark-block flex flex-col items-start gap-3 rounded-xl bg-dark p-6 text-on-dark">
        <p className="text-eyebrow font-semibold tracking-[0.12em] text-primary uppercase">{t("consultEyebrow")}</p>
        <h2 id="article-consult" className="font-display text-h3">
          {t("consultTitle")}
        </h2>
        <p className="text-on-dark-muted">{t("consultText")}</p>
        <Link href={contactHref} className={buttonVariants()}>
          {t("consultCta")}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </aside>
  );
}
