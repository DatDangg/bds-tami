import { cn } from "@/lib/utils";

export interface DetailStat {
  /** Số lớn (vd "96"); trống → thẻ chỉ có nhãn. */
  value?: string | null;
  /** Nhãn bắt buộc (vd "Biệt thự đơn lập"). */
  label: string;
  /** Dòng phụ (vd "200 – 360 m²"). */
  note?: string | null;
}

/**
 * Thẻ số lớn (BL-052, thẻ "Sản phẩm" trong Tổng quan dự án): mỗi thẻ nền `primary-subtle` bo 16px, số lớn vàng đậm + nhãn + dòng phụ muted.
 * số cột theo bề rộng khung (thẻ ≥ 8.5rem: 2 cột ở 375px, nhiều hơn khi đủ chỗ — chữ không bị cắt giữa từ); rỗng → không dựng. Danh sách `ul` có nhãn tuỳ chọn.
 */
export function DetailStatCards({ items, label, className }: { items: DetailStat[]; label?: string; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className={cn("grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3", className)}>
      {items.map((item, position) => (
        <li key={`${item.label}-${position}`} className="flex min-w-0 flex-col gap-1 rounded-[16px] bg-primary-subtle p-4">
          {item.value && <span className="font-display text-h2 leading-none text-accent-text tabular-nums">{item.value}</span>}
          <span className="text-small font-semibold break-words text-text">{item.label}</span>
          {item.note && <span className="text-xsmall text-text-muted">{item.note}</span>}
        </li>
      ))}
    </ul>
  );
}
