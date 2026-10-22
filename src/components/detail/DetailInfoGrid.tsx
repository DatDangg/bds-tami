import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Giá trị thành link: `internal` = đường dẫn nội bộ (vd dự án của tin cho thuê), mở tại chỗ; `external` = link ngoài đã kiểm http(s)
 * (vd website chủ đầu tư) mở tab mới, `newTabLabel` là chữ đọc màn hình "(mở tab mới)".
 */
export type DetailInfoLink = { kind: "internal"; href: string } | { kind: "external"; href: string; newTabLabel: string };

export interface DetailInfoItem {
  /** Icon Phosphor đã dựng (`aria-hidden` do khung lo). */
  icon: ReactNode;
  label: string;
  /** Trống / null → ô bị bỏ. */
  value?: string | null;
  link?: DetailInfoLink | null;
  /** Giá trị là ngày (ISO): bọc `<time dateTime>` (vd ngày đăng tin cho thuê). */
  dateTime?: string | null;
}

const COLUMNS_AUTO_CLASS = "grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))]";
/** 2 cột cố định từ sm (Tổng quan Dự án ≥ xl: lưới chỉ chiếm ~55% bề rộng nên auto-fill sẽ ra 1 cột — BL-056). */
const COLUMNS_FIXED_2_CLASS = "grid-cols-1 sm:grid-cols-2";

const LINK_CLASS = "text-accent-text underline underline-offset-4 hover:text-text";

/**
 * Lưới thông tin trong khối Tổng quan (BL-052, design `detail-du-an`: Tên thương mại, Chủ đầu tư, Vị trí…): icon vuông viền mảnh + nhãn nhỏ + giá trị;
 * `columns="auto"` (mặc định): số cột theo bề rộng khung (ô ≥ 13rem — 1 cột ở mobile, 2+ cột khi đủ chỗ, kể cả trong cột hẹp cạnh thẻ khác); `columns={2}`: 2 cột cố định từ sm; ô trống bị bỏ, rỗng → không dựng. `dl` ngữ nghĩa — icon nằm trong `dt` (định vị tuyệt đối) vì `dl > div` chỉ chứa `dt`/`dd`.
 */
export function DetailInfoGrid({ items, label, className, columns = "auto" }: { items: DetailInfoItem[]; label?: string; className?: string; columns?: "auto" | 2 }) {
  const shown = items.filter((item) => item.value?.trim());
  if (shown.length === 0) return null;
  return (
    <dl aria-label={label} className={cn("grid gap-x-6 gap-y-5 rounded-[16px] border border-border p-5", columns === 2 ? COLUMNS_FIXED_2_CLASS : COLUMNS_AUTO_CLASS, className)}>
      {shown.map((item, index) => (
        // Index trong key: hai ô có thể trùng nhãn.
        <div key={`${item.label}-${index}`} className="relative min-h-10 min-w-0 pl-13">
          <dt className="text-xsmall text-text-muted">
            <span aria-hidden="true" className="absolute top-0 left-0 inline-flex size-10 items-center justify-center rounded-[10px] border border-border text-accent-text">
              {item.icon}
            </span>
            {item.label}
          </dt>
          <dd className="text-small font-semibold break-words text-text">
            {item.link?.kind === "external" ? (
              <a href={item.link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                {item.value}
                <span className="sr-only"> {item.link.newTabLabel}</span>
              </a>
            ) : item.link ? (
              <Link href={item.link.href} className={LINK_CLASS}>
                {item.value}
              </Link>
            ) : item.dateTime ? (
              <time dateTime={item.dateTime}>{item.value}</time>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
