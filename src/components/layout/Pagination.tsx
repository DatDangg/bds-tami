import { useTranslations } from "next-intl";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@/components/icons";
import { cn } from "@/lib/utils";

const CELL = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-3 text-small font-semibold";

/**
 * Các mục hiển thị: trang đầu, trang cuối, trang hiện tại ±1; khoảng trống giữa hai mục cách nhau > 1 thành `"gap"`
 * (design-spec §3.6). Một khoảng trống chỉ 1 trang thì hiện luôn số trang đó thay vì "…".
 */
export function getPageItems(page: number, totalPages: number): (number | "gap")[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((n, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && n - previous === 2) items.push(n - 1);
    else if (previous !== undefined && n - previous > 2) items.push("gap");
    items.push(n);
  });
  return items;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  /** URL thật của từng trang (SEO crawl được), vd `(n) => n === 1 ? "/du-an" : "/du-an?page=" + n`. Đã có tiền tố ngôn ngữ. */
  buildHref: (page: number) => string;
}

/**
 * Phân trang (design-spec §3.6): mọi số trang là `<a href>` thật; trang hiện tại `aria-current="page"`. Mobile chỉ
 * "Trước · Trang 2/12 · Sau". Server Component: không cần JS để đổi trang. Không render khi chỉ có 1 trang.
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  const t = useTranslations("page.pagination");
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(page, 1), totalPages);
  return (
    <nav aria-label={t("nav")} className="flex items-center justify-center gap-2">
      <StepLink label={t("previous")} target={current > 1 ? current - 1 : null} buildHref={buildHref} rel="prev" direction="previous" />
      <p aria-live="polite" className="px-2 text-small text-text-secondary md:hidden">
        {t("status", { page: current, total: totalPages })}
      </p>
      <ul className="hidden items-center gap-2 md:flex">
        {getPageItems(current, totalPages).map((item, index) => (
          <li key={item === "gap" ? `gap-${index}` : item}>
            {item === "gap" ? (
              <span aria-hidden="true" className="inline-flex min-h-11 min-w-11 items-center justify-center text-text-muted">
                …
              </span>
            ) : item === current ? (
              <span aria-current="page" className={cn(CELL, "bg-dark text-on-dark")}>
                {item}
              </span>
            ) : (
              <Link href={buildHref(item)} aria-label={t("goToPage", { page: item })} className={cn(CELL, "text-text hover:bg-surface-muted")}>
                {item}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <StepLink label={t("next")} target={current < totalPages ? current + 1 : null} buildHref={buildHref} rel="next" direction="next" />
    </nav>
  );
}

function StepLink({
  label,
  target,
  buildHref,
  rel,
  direction,
}: {
  label: string;
  target: number | null;
  buildHref: (page: number) => string;
  rel: "prev" | "next";
  direction: "previous" | "next";
}) {
  const Icon = direction === "previous" ? CaretLeft : CaretRight;
  const content = (
    <>
      {direction === "previous" && <Icon size={16} aria-hidden="true" />}
      <span>{label}</span>
      {direction === "next" && <Icon size={16} aria-hidden="true" />}
    </>
  );
  if (target === null) {
    return (
      <span aria-disabled="true" className={cn(CELL, "gap-1 text-text-muted opacity-60")}>
        {content}
      </span>
    );
  }
  return (
    <Link href={buildHref(target)} rel={rel} className={cn(CELL, "gap-1 text-text hover:bg-surface-muted")}>
      {content}
    </Link>
  );
}
