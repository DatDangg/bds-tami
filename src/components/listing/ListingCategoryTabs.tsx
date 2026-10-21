import type { ComponentType } from "react";
import { Buildings } from "@/components/icons";
import { PendingLink } from "@/components/layout/PendingRegion";
import { cn } from "@/lib/utils";

/** Icon dạng component Phosphor (từ `@/components/icons`). */
export type ListingTabIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export interface ListingCategoryTab {
  /** Khoá ổn định (slug danh mục, `all`…). */
  key: string;
  /** Link thật (route danh mục hoặc `?category=`), đã có tiền tố ngôn ngữ. */
  href: string;
  label: string;
  /** Dòng số dưới nhãn, trang tự định dạng + số nhiều (vd "28 dự án"); không truyền → không có dòng số. */
  countLabel?: string;
  /** Icon riêng của tab; thiếu → icon mặc định. */
  icon?: ListingTabIcon;
  current?: boolean;
}

interface ListingCategoryTabsProps {
  /** Nhãn vùng `nav` (vd "Loại dự án"). */
  label: string;
  tabs: readonly ListingCategoryTab[];
}

/**
 * Thanh tab danh mục dưới hero danh sách (BL-052, design `list-du-an`): mỗi tab là link có icon + nhãn + dòng số; tab hiện tại gạch chân màu nhấn + `aria-current="page"`.
 * Tràn → cuộn ngang (không xuống dòng), vùng chạm ≥ 44px. Link là `PendingLink` (báo chờ cho `PendingRegion`). Không có tab → không render. Server Component.
 */
export function ListingCategoryTabs({ label, tabs }: ListingCategoryTabsProps) {
  if (tabs.length === 0) return null;
  return (
    <nav aria-label={label} className="border-b border-border bg-surface">
      <ul className="mx-auto flex w-full max-w-container snap-x gap-2 overflow-x-auto px-gutter [scrollbar-width:none] md:gap-6">
        {tabs.map(({ key, href, label: tabLabel, countLabel, icon: Icon = Buildings, current = false }) => (
          <li key={key} className="shrink-0 snap-start">
            <PendingLink
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 border-b-2 px-2 py-4 transition-colors duration-(--duration-fast) md:px-3",
                current ? "border-primary text-text" : "border-transparent text-text-secondary hover:text-text",
              )}
            >
              <span aria-hidden="true" className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-md", current ? "bg-primary-soft text-accent-text" : "bg-surface-muted text-text-secondary")}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="flex flex-col text-left">
                <span className="text-small font-semibold whitespace-nowrap">{tabLabel}</span>
                {countLabel && <span className="text-xsmall whitespace-nowrap text-text-muted">{countLabel}</span>}
              </span>
            </PendingLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
