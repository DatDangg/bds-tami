import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export interface DetailSpecItem {
  /** Icon Phosphor đã dựng; đặt trong vòng tròn `bg-primary-subtle`. */
  icon: ReactNode;
  label: string;
  /** Trống / null → ô bị bỏ. */
  value?: string | null;
}

/** Số ô tối đa (design: Giá từ · Quy mô · Diện tích · Chủ đầu tư · Bàn giao · Loại hình). */
const MAX_ITEMS = 6;

/**
 * Thanh thông số nổi đè mép dưới hero chi tiết (BL-052): thẻ trắng bo 20px + bóng, ≤ 6 ô (icon tròn + nhãn nhỏ + giá trị đậm), ô trống bị bỏ, rỗng → không dựng.
 * `dl` ngữ nghĩa (mỗi ô `div > dt + dd`). < sm lưới 2 cột, sm 3 cột, ≥ lg một hàng chia đều ngăn bằng đường kẻ dọc; giá trị dài tự xuống dòng (không tràn ngang).
 */
export function DetailSpecBar({ items, label }: { items: DetailSpecItem[]; label?: string }) {
  const t = useTranslations("detailKit.specBar");
  const shown = items.filter((item) => item.value?.trim()).slice(0, MAX_ITEMS);
  if (shown.length === 0) return null;
  return (
    <div role="group" aria-label={label ?? t("label")} className="relative z-10 mx-auto -mt-12 w-full max-w-container px-gutter md:-mt-14">
      <dl
        className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-[20px] bg-surface p-5 shadow-lg sm:grid-cols-3 md:p-6 lg:flex lg:gap-0 lg:px-2"
      >
        {shown.map((item) => (
          // `dl > div` chỉ được chứa `dt`/`dd`: icon nằm trong `dt`, định vị tuyệt đối theo ô (lề trái chừa chỗ).
          <div key={item.label} className="relative flex min-h-10 min-w-0 flex-col justify-center pl-13 lg:flex-1 lg:border-l lg:border-border lg:pr-4 lg:pl-[4.75rem] lg:first:border-l-0">
            <dt className="text-xsmall text-text-muted">
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-0 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary-subtle text-accent-text lg:left-5"
              >
                {item.icon}
              </span>
              {item.label}
            </dt>
            <dd className="font-semibold break-words text-text">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
