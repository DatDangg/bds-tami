import type { ReactNode } from "react";
import { MapPin } from "@/components/icons";
import { DetailShareButton } from "./DetailShareButton";

export interface DetailFact {
  /** Icon Phosphor đã dựng (`aria-hidden`), đặt trong vòng tròn `bg-primary-subtle`. */
  icon: ReactNode;
  label: string;
  value: string;
}

interface DetailTitleCardProps {
  /** Dòng nhỏ viết hoa trên tiêu đề (loại hình, hoặc "loại · mã tin"). */
  eyebrow?: string | null;
  /** Badge trạng thái cạnh eyebrow. */
  badge?: ReactNode;
  /** `h1` duy nhất của trang chi tiết. */
  title: string;
  /** Vị trí ngắn ("Phường, Tỉnh") kèm ghim; thiếu thì ẩn. */
  location?: string | null;
  /** Nhãn + giá phía phải ("Giá từ" + "3,2 tỷ"); thiếu `price` thì không dựng cột giá. */
  priceLabel?: string;
  price?: ReactNode;
  /** Dải thông số trong thẻ; mục trống do nơi gọi bỏ, rỗng cả dải thì không dựng. */
  facts?: DetailFact[];
  factsLabel?: string;
  /** Chia sẻ: tên + URL canonical của trang. */
  shareTitle: string;
  shareUrl?: string;
}

/**
 * Khối tiêu đề nổi đè đáy ảnh trang chi tiết (BL-045, mockup `.dhead`, DECISIONS #5): thẻ trắng bo 28px + bóng; trái eyebrow + badge, `h1`, ghim vị trí;
 * phải giá + nút chia sẻ tròn (KHÔNG có tim, #2); dưới là dải thông số ngăn bằng đường kẻ, icon tròn nền `primary-subtle` + giá trị đậm màu chữ chính + nhãn muted.
 * Dùng chung chi tiết Dự án / Cho thuê. Server Component; chỉ nút chia sẻ là client.
 */
export function DetailTitleCard({ eyebrow, badge, title, location, priceLabel, price, facts = [], factsLabel, shareTitle, shareUrl }: DetailTitleCardProps) {
  return (
    <div className="relative z-10 mx-auto -mt-8 w-full max-w-container px-gutter md:-mt-12">
      <div className="grid gap-5 rounded-[28px] bg-surface p-5 shadow-lg md:grid-cols-[1fr_auto] md:items-end md:gap-6 md:p-8">
        <div className="min-w-0">
          {(eyebrow || badge) && (
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{eyebrow}</p>}
              {badge}
            </div>
          )}
          <h1 className="mt-2 mb-2.5 font-display text-h2-sm text-balance">{title}</h1>
          {location && (
            <p className="flex items-center gap-1.5 text-small text-text-secondary">
              <MapPin size={16} aria-hidden="true" className="shrink-0" />
              {location}
            </p>
          )}
        </div>
        <div className="flex items-end justify-between gap-4 md:flex-col md:items-end md:justify-end">
          {price !== undefined && (
            <div className="md:text-right">
              {priceLabel && <p className="text-xsmall text-text-muted">{priceLabel}</p>}
              <p className="font-display text-price font-semibold text-accent-text">{price}</p>
            </div>
          )}
          <DetailShareButton title={shareTitle} {...(shareUrl ? { url: shareUrl } : {})} />
        </div>
        {facts.length > 0 && (
          <ul aria-label={factsLabel} className="grid grid-cols-2 gap-4 border-t border-border pt-5 md:col-span-full md:grid-cols-4 md:gap-6 md:pt-6">
            {facts.map((fact) => (
              <li key={fact.label} className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-accent-text">
                  {fact.icon}
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-display text-h4 font-semibold break-words text-text" title={fact.value}>
                    {fact.value}
                  </p>
                  <p className="text-small text-text-muted">{fact.label}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
