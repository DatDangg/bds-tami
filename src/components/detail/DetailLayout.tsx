import type { ReactNode } from "react";
import { DetailSubNav, type SubNavItem } from "./DetailSubNav";

/**
 * Thẻ phụ dính ở cột phải (≥ lg): dính dưới thanh mục con (`--sticky-top` + thanh 54px + khe 18px = 4.5rem); cao tối đa bằng phần viewport còn lại
 * và tự cuộn bên trong nếu nội dung dài hơn nên không bao giờ kẹt dính / che nội dung. Gắn vào phần tử bên trong `aside`.
 */
export const DETAIL_ASIDE_CARD_CLASS =
  "rounded-[20px] border border-border bg-surface p-6 shadow-md lg:sticky lg:top-[calc(var(--sticky-top)+4.5rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-5.5rem)] lg:overflow-y-auto lg:p-6 scroll-mt-[calc(var(--sticky-top)+4.5rem)]";

interface DetailLayoutProps {
  /** Hero + breadcrumb phía trên thanh mục con. */
  before?: ReactNode;
  /** Thanh mục con dính; bỏ trống thì không dựng thanh. */
  subNav?: { items: SubNavItem[]; label: string };
  /** Các `DetailSection` của cột chính: nằm trong MỘT thẻ trắng bo lớn. */
  children: ReactNode;
  /** Thẻ phụ (vd. Tư vấn 1:1) nằm cột phải ≥ lg, sau thẻ nội dung khi < lg. */
  aside?: ReactNode;
  /** `id` tiêu đề trong `aside`, làm nhãn cho `<aside>`. */
  asideLabelledBy?: string;
  /** Khối ngoài thẻ và ngoài lưới (Dự án khác, Tin tương tự, CTA). */
  after?: ReactNode;
}

/**
 * Khung chi tiết dùng chung (BL-027, design-spec S03): gốc đánh dấu `data-detail-page` để `globals.css` (a) ẩn hẳn header khi cuộn và (b) đặt
 * `--sticky-top` = lề trên header nổi (8/16px) cho thanh mục con, thẻ dính và mọi `scroll-mt`. Nền `bg-primary-subtle`; cột chính là một thẻ trắng,
 * thẻ phụ tách riêng. Server Component; chỉ thanh mục con là client.
 */
export function DetailLayout({ before, subNav, children, aside, asideLabelledBy, after }: DetailLayoutProps) {
  return (
    <div data-detail-page="" className="bg-primary-subtle">
      {before}
      {subNav && <DetailSubNav items={subNav.items} label={subNav.label} />}
      <div className="mx-auto w-full max-w-container px-gutter py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-8 lg:py-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-10">
        <div className="min-w-0 rounded-[28px] bg-surface p-5 md:p-8 xl:p-10">{children}</div>
        {aside && (
          <aside {...(asideLabelledBy ? { "aria-labelledby": asideLabelledBy } : {})} className="pt-6 lg:pt-0">
            {aside}
          </aside>
        )}
      </div>
      {after}
    </div>
  );
}
