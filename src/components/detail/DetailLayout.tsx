import type { ReactNode } from "react";
import { DetailAsideFit } from "./DetailAsideFit";
import { DetailSubNav, type SubNavItem } from "./DetailSubNav";

/**
 * Thẻ phụ dính ở cột phải (≥ lg), KHÔNG cuộn riêng: `top` = min(dưới thanh mục con = `--sticky-top` + 4.5rem, đáy viewport − chiều cao thẻ − 1rem).
 * Thẻ vừa viewport → dính dưới thanh mục con; cao hơn → cuộn theo trang tới khi đáy thẻ chạm đáy viewport rồi mới dính (không bị cắt).
 * `--detail-aside-h` do `DetailAsideFit` đo bằng JS (CSS không biết chiều cao chính thẻ); chưa có biến (0px) = dính trên như cũ. Gắn vào phần tử con đầu của `aside`.
 */
export const DETAIL_ASIDE_CARD_CLASS =
  "rounded-[20px] border border-border bg-surface p-6 shadow-md lg:sticky lg:top-[min(calc(var(--sticky-top)_+_4.5rem),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))] lg:p-6 scroll-mt-[calc(var(--sticky-top)+4.5rem)]";

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
  /**
   * Cột trái tuỳ chọn (mục lục chi tiết tin tức, BL-033), chỉ hiện ≥ lg và đứng TRƯỚC thẻ trắng trong DOM. Có giá trị thì lưới là `[cột trái][thẻ]`
   * và không dùng `aside`; không truyền thì DOM/class giữ nguyên như các trang chi tiết khác.
   */
  leading?: ReactNode;
}

const GRID_WITH_ASIDE =
  "mx-auto w-full max-w-container px-gutter py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-8 lg:py-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-10";
const GRID_WITH_LEADING =
  "mx-auto w-full max-w-container px-gutter py-4 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-8 lg:py-8 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-x-10";

/**
 * Khung chi tiết dùng chung (BL-027, design-spec S03): gốc đánh dấu `data-detail-page` để `globals.css` (a) ẩn hẳn header khi cuộn và (b) đặt
 * `--sticky-top` = lề trên header nổi (8/16px) cho thanh mục con, thẻ dính và mọi `scroll-mt`. Nền `bg-primary-subtle`; cột chính là một thẻ trắng,
 * thẻ phụ tách riêng. Server Component; chỉ thanh mục con và vỏ `aside` đo chiều cao (`DetailAsideFit`) là client.
 */
export function DetailLayout({ before, subNav, children, aside, asideLabelledBy, after, leading }: DetailLayoutProps) {
  return (
    <div data-detail-page="" className="bg-primary-subtle">
      {before}
      {subNav && <DetailSubNav items={subNav.items} label={subNav.label} />}
      <div className={leading ? GRID_WITH_LEADING : GRID_WITH_ASIDE}>
        {leading && <div className="hidden min-w-0 lg:block print:hidden">{leading}</div>}
        <div className="min-w-0 rounded-[28px] bg-surface p-5 md:p-8 xl:p-10">{children}</div>
        {aside && (
          <DetailAsideFit {...(asideLabelledBy ? { "aria-labelledby": asideLabelledBy } : {})} className="pt-6 lg:pt-0">
            {aside}
          </DetailAsideFit>
        )}
      </div>
      {after}
    </div>
  );
}
