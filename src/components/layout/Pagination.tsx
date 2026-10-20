import { useTranslations } from "next-intl";
import { CaretLeft, CaretRight } from "@/components/icons";
import { PendingLink } from "@/components/layout/PendingRegion";
import { cn } from "@/lib/utils";

/** Ô tròn 44px (chạm ≥ 44px) cho số trang và mũi tên, như mockup `.pager`. */
const CELL = "inline-flex size-11 items-center justify-center rounded-full text-small font-semibold";
const ARROW_BORDER = "border border-text text-text";

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
 * Phân trang (design-spec §3.6, mockup BL-045 `.pager`): mũi tên tròn hai bên + số trang tròn ở giữa; mọi số trang là `<a href>` thật;
 * trang hiện tại `aria-current="page"` nền `--color-primary`. Mobile chỉ "‹ Trang 2/12 ›". Link là `PendingLink` (báo chờ cho `PendingRegion`);
 * không cần JS để đổi trang. Không render khi chỉ có 1 trang.
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  const t = useTranslations("page.pagination");
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(page, 1), totalPages);
  return (
    <nav aria-label={t("nav")} className="flex items-center justify-center gap-3.5">
      <StepLink label={t("previous")} target={current > 1 ? current - 1 : null} buildHref={buildHref} rel="prev" direction="previous" />
      <p aria-live="polite" className="px-2 text-small text-text-secondary md:hidden">
        {t("status", { page: current, total: totalPages })}
      </p>
      <ul className="hidden items-center gap-1.5 md:flex">
        {getPageItems(current, totalPages).map((item, index) => (
          <li key={item === "gap" ? `gap-${index}` : item}>
            {item === "gap" ? (
              <span aria-hidden="true" className={cn(CELL, "text-text-muted")}>
                …
              </span>
            ) : item === current ? (
              <span aria-current="page" className={cn(CELL, "bg-primary text-primary-foreground")}>
                {item}
              </span>
            ) : (
              <PendingLink href={buildHref(item)} aria-label={t("goToPage", { page: item })} className={cn(CELL, "text-text transition-colors hover:bg-surface-muted")}>
                {item}
              </PendingLink>
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
  if (target === null) {
    return (
      <span aria-disabled="true" className={cn(CELL, ARROW_BORDER, "opacity-40")}>
        <Icon size={20} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <PendingLink href={buildHref(target)} rel={rel} aria-label={label} className={cn(CELL, ARROW_BORDER, "transition-colors hover:bg-text hover:text-surface")}>
      <Icon size={20} aria-hidden="true" />
    </PendingLink>
  );
}
