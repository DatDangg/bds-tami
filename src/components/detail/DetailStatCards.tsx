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
 * `columns={3}`: ≥ xl 3 cột cố định, ô lẻ cuối kéo dài hết hàng. Mặc định: số cột theo bề rộng khung (thẻ ≥ 8.5rem: 2 cột ở 375px, nhiều hơn khi đủ chỗ — chữ không bị cắt giữa từ); rỗng → không dựng. Danh sách `ul` có nhãn tuỳ chọn.
 */
export function DetailStatCards({ items, label, className, columns = "auto" }: { items: DetailStat[]; label?: string; className?: string; columns?: "auto" | 3 }) {
  if (items.length === 0) return null;
  const fixedThree = columns === 3;
  return (
    <ul aria-label={label} className={cn("grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3", fixedThree && "xl:grid-cols-3", className)}>
      {items.map((item, position) => (
        <li
          key={`${item.label}-${position}`}
          // Hàng cuối chỉ còn 1 ô (vd 4 thẻ = 3 + 1) thì kéo dài hết hàng, như design.
          className={cn("flex min-w-0 flex-col gap-1 rounded-[16px] bg-primary-subtle p-4", fixedThree && position === items.length - 1 && items.length % 3 === 1 && "xl:col-span-3")}
        >
          {item.value && (
            // 3 cột cố định ≥ xl: thẻ chỉ ~97–99px (1280 / 1440, chừa ~65px cho số) nên số thu về h2-sm (≤ 3 ký tự) / h3 (≥ 4 ký tự), đo ở BL-056; cực đoan thì ngắt dòng thay vì tràn ra ngoài thẻ.
            <span className={cn("font-display text-h2 leading-none break-words text-accent-text tabular-nums", fixedThree && (item.value.length >= 4 ? "xl:text-h3" : "xl:text-h2-sm"))}>{item.value}</span>
          )}
          <span className="text-small font-semibold break-words text-text">{item.label}</span>
          {item.note && <span className="text-xsmall text-text-muted">{item.note}</span>}
        </li>
      ))}
    </ul>
  );
}
