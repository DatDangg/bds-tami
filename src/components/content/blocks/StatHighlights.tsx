import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface StatHighlightItem {
  value: string;
  label: string;
}

/** Số cột theo số mục (1–4): < md tối đa 2 cột. */
const GRID_COLUMNS: Record<number, string> = {
  1: "grid-cols-1 sm:max-w-xs",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

/** Khối "Số liệu nổi bật" trong bài Tin tức (BL-054): lưới 1–4 ô, số lớn màu nhấn + nhãn. Mục đã lọc sẵn ở `NewsBlock`. */
export function StatHighlights({ items }: { items: readonly StatHighlightItem[] }) {
  const t = useTranslations("newsBlocks");
  return (
    <ul aria-label={t("statsLabel")} className={cn("my-8 grid gap-3 first:mt-0 sm:gap-4", GRID_COLUMNS[items.length])}>
      {items.map((item, index) => (
        <li key={index} className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <span className="font-display text-h2 leading-none text-accent-text">{item.value}</span>
          <span className="text-small text-text-muted">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
