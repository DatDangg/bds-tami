import type { ReactNode } from "react";
import { DetailLayout } from "./DetailLayout";
import type { SubNavItem } from "./DetailSubNav";

/** Một khối trong cột trái sau khối đầu (BL-061: thẻ trắng như Tổng quan); `key` ổn định (thường là mã mục). */
export interface DetailBand {
  key: string;
  content: ReactNode;
}

interface DetailPageShellProps {
  /** `DetailHeroMosaic` đã dựng (chứa `h1`). */
  hero: ReactNode;
  /** `DetailSpecBar` nổi đè mép dưới hero; trống → chỉ còn khoảng cách. */
  specBar?: ReactNode;
  /** Khối ngay sau thanh thông số, trước tab (vd băng "Đã thuê" + "Căn tương tự đang trống" của tin cho thuê đã thuê); tự lo lề trên, khung chừa `pb-8` sau nó. */
  belowSpecBar?: ReactNode;
  /** Thanh tab dính (viên thuốc, scroll-spy BL-027/028/029); bỏ trống thì không dựng. */
  subNav?: { items: SubNavItem[]; label: string };
  /** Khối đầu của cột trái, cạnh cột phải — mỗi `DetailSection` là một thẻ trắng bo 20px. */
  children: ReactNode;
  /** Cột phải (thường `DetailContactAside`), dính ≥ lg suốt chiều cao cột trái (`children` + `bands`); < lg xuống ngay sau cột trái. */
  aside?: ReactNode;
  /** `id` tiêu đề trong `aside`, làm nhãn cho `<aside>`. */
  asideLabelledBy?: string;
  /**
   * Các khối sau khối đầu (Vị trí, Tiện ích, Hình ảnh, khối giữ lại…; BL-061): nằm TRONG cột trái `group/detail`, sau `children`, nên `DetailSection` của chúng là thẻ trắng
   * như Tổng quan và form ở cột phải dính suốt các khối này. Thanh tab theo dõi bằng `id` trong cả trang (scroll-spy).
   */
  bands?: DetailBand[];
  /** Khối cuối trang NGOÀI lưới (`SimilarCarousel`, dải Điểm mạnh, banner tư vấn) — tự lo nền; cột phải thôi dính đúng khi cuộn tới đây. */
  after?: ReactNode;
}

/**
 * Khung trang chi tiết BL-052 (Dự án, Cho thuê, Tin BĐS; BL-054 tái dùng; BL-061 hai cột): hero → thanh thông số → khoảng 32px → tab dính → [cột trái: khối đầu + `bands` (thẻ trắng) | cột phải dính] → slot cuối trang (`after`).
 * Dựng trên `DetailLayout sectionStyle="cards"` nên giữ nguyên `data-detail-page` (header ẩn khi cuộn, `--sticky-top`), nền `bg-primary-subtle`, lưới 2 cột,
 * `DetailAsideFit` và thẻ trắng từng `DetailSection`. CTA dính đáy < lg do trang tự đặt như hiện tại. Server Component.
 *
 * Công thức "cột dính tới hết khối liên quan" (tái dùng, vd chi tiết Tin tức BL-062): cột phải là ô lưới cao bằng hàng (lưới KHÔNG `items-start`) → phần tử con đầu của `aside`
 * `sticky` theo `DETAIL_ASIDE_STICKY_CLASS`; mọi khối cần form đi kèm nằm TRONG lưới (cột trái); khối sau lưới (`after`) đứng ngoài → thẻ thôi dính đúng khi tới khối đó.
 */
export function DetailPageShell({ hero, specBar, belowSpecBar, subNav, children, aside, asideLabelledBy, bands = [], after }: DetailPageShellProps) {
  return (
    <DetailLayout
      sectionStyle="cards"
      before={
        <>
          {hero}
          <div className="pb-8">
            {specBar}
            {belowSpecBar}
          </div>
        </>
      }
      {...(subNav ? { subNav } : {})}
      {...(aside ? { aside } : {})}
      {...(asideLabelledBy ? { asideLabelledBy } : {})}
      {...(after ? { after } : {})}
    >
      {children}
      {bands.map((band) => (
        <div key={band.key} data-detail-band="">
          {band.content}
        </div>
      ))}
    </DetailLayout>
  );
}
