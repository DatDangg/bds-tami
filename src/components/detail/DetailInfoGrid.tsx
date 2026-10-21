import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DetailInfoItem {
  /** Icon Phosphor đã dựng (`aria-hidden` do khung lo). */
  icon: ReactNode;
  label: string;
  /** Trống / null → ô bị bỏ. */
  value?: string | null;
}

/**
 * Lưới thông tin trong khối Tổng quan (BL-052, design `detail-du-an`: Tên thương mại, Chủ đầu tư, Vị trí…): icon vuông viền mảnh + nhãn nhỏ + giá trị;
 * số cột theo bề rộng khung (ô ≥ 13rem — 1 cột ở mobile, 2+ cột khi đủ chỗ, kể cả trong cột hẹp cạnh thẻ khác); ô trống bị bỏ, rỗng → không dựng. `dl` ngữ nghĩa — icon nằm trong `dt` (định vị tuyệt đối) vì `dl > div` chỉ chứa `dt`/`dd`.
 */
export function DetailInfoGrid({ items, className }: { items: DetailInfoItem[]; className?: string }) {
  const shown = items.filter((item) => item.value?.trim());
  if (shown.length === 0) return null;
  return (
    <dl className={cn("grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-x-6 gap-y-5 rounded-[16px] border border-border p-5", className)}>
      {shown.map((item) => (
        <div key={item.label} className="relative min-h-10 min-w-0 pl-13">
          <dt className="text-xsmall text-text-muted">
            <span aria-hidden="true" className="absolute top-0 left-0 inline-flex size-10 items-center justify-center rounded-[10px] border border-border text-accent-text">
              {item.icon}
            </span>
            {item.label}
          </dt>
          <dd className="text-small font-semibold break-words text-text">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
