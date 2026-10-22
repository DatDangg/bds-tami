import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { MostReadNewsItem } from "@/lib/news/most-read";

/**
 * Khối "Đọc nhiều" ở cột phải `/tin-tuc` (BL-054): top 5 từ `loadMostReadNews`, mỗi hàng là MỘT link — số thứ tự lớn 01–05 màu nhấn (trang trí,
 * thứ tự đã có trong `<ol>`), ảnh nhỏ, tiêu đề 2 dòng, ngày. Rỗng → không render. Server Component.
 */
export function NewsMostRead({ items }: { items: readonly MostReadNewsItem[] }) {
  const t = useTranslations("page.news.v2");
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-border bg-surface p-5">
      <h2 id={headingId} className="font-display text-h4">
        {t("mostRead")}
      </h2>
      <ol className="mt-2">
        {items.map((item, index) => (
          <li key={item.id} className="border-t border-border first:border-t-0">
            <Link
              href={item.href}
              className="group grid min-h-11 grid-cols-[2.25rem_56px_1fr] items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <span aria-hidden="true" className="font-display text-h3 leading-none text-accent-text tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="aspect-square w-14 overflow-hidden rounded-md bg-surface-muted">
                {item.cover && <ResponsiveImage media={item.cover} sizes="56px" aspectRatio="1/1" decorative />}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="line-clamp-2 text-small font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{item.title}</span>
                {item.dateLabel && item.publishedAt && (
                  <time dateTime={item.publishedAt} className="text-xsmall text-text-muted">
                    {item.dateLabel}
                  </time>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
