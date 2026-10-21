import type { ReactNode } from "react";
import { DetailLayout } from "./DetailLayout";
import type { SubNavItem } from "./DetailSubNav";

interface DetailPageShellProps {
  /** `DetailHeroMosaic` đã dựng (chứa `h1`). */
  hero: ReactNode;
  /** `DetailSpecBar` nổi đè mép dưới hero; trống → chỉ còn khoảng cách. */
  specBar?: ReactNode;
  /** Thanh tab dính (viên thuốc, scroll-spy BL-027/028/029); bỏ trống thì không dựng. */
  subNav?: { items: SubNavItem[]; label: string };
  /** Các `DetailSection` — mỗi khối là một thẻ trắng bo 20px. */
  children: ReactNode;
  /** Cột phải (thường `DetailContactAside`), dính ≥ lg; < lg xuống sau nội dung. */
  aside?: ReactNode;
  /** `id` tiêu đề trong `aside`, làm nhãn cho `<aside>`. */
  asideLabelledBy?: string;
  /** Khối cuối trang ngoài lưới (`SimilarCarousel`, dải Điểm mạnh, banner tư vấn). */
  after?: ReactNode;
}

/**
 * Khung trang chi tiết BL-052 (Dự án, Cho thuê, Tin BĐS; BL-054 tái dùng): hero → thanh thông số → khoảng 32px → [tab dính + cột nội dung | cột phải dính] → slot cuối trang.
 * Dựng trên `DetailLayout sectionStyle="cards"` nên giữ nguyên `data-detail-page` (header ẩn khi cuộn, `--sticky-top`), nền `bg-primary-subtle`, lưới 2 cột,
 * `DetailAsideFit` và thẻ trắng từng `DetailSection`. CTA dính đáy < lg do trang tự đặt như hiện tại. Server Component.
 */
export function DetailPageShell({ hero, specBar, subNav, children, aside, asideLabelledBy, after }: DetailPageShellProps) {
  return (
    <DetailLayout
      sectionStyle="cards"
      before={
        <>
          {hero}
          <div className="pb-8">{specBar}</div>
        </>
      }
      {...(subNav ? { subNav } : {})}
      {...(aside ? { aside } : {})}
      {...(asideLabelledBy ? { asideLabelledBy } : {})}
      {...(after ? { after } : {})}
    >
      {children}
    </DetailLayout>
  );
}
