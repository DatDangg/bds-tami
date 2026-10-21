import type { ReactNode } from "react";
import { DetailLayout } from "./DetailLayout";
import type { SubNavItem } from "./DetailSubNav";

/** Một dải rộng hết khung sau lưới đầu trang; `key` ổn định (thường là mã mục). */
export interface DetailBand {
  key: string;
  content: ReactNode;
}

/** Nền xen kẽ của dải, bắt đầu bằng trắng (lưới đầu trang nền `primary-subtle`). `bg-alt` khác `primary-subtle` nên chip / vòng icon `primary-subtle` trong dải vẫn tách nền. */
const BAND_TONES = ["bg-surface", "bg-bg-alt"] as const;

interface DetailPageShellProps {
  /** `DetailHeroMosaic` đã dựng (chứa `h1`). */
  hero: ReactNode;
  /** `DetailSpecBar` nổi đè mép dưới hero; trống → chỉ còn khoảng cách. */
  specBar?: ReactNode;
  /** Thanh tab dính (viên thuốc, scroll-spy BL-027/028/029); bỏ trống thì không dựng. */
  subNav?: { items: SubNavItem[]; label: string };
  /** Khối cạnh cột phải (design: chỉ Tổng quan) — mỗi `DetailSection` là một thẻ trắng bo 20px. */
  children: ReactNode;
  /** Cột phải (thường `DetailContactAside`), dính ≥ lg trong phạm vi `children`; < lg xuống ngay sau `children`. */
  aside?: ReactNode;
  /** `id` tiêu đề trong `aside`, làm nhãn cho `<aside>`. */
  asideLabelledBy?: string;
  /**
   * Các khối sau lưới (Vị trí, Tiện ích, Hình ảnh, khối giữ lại…; quyết định sau review P1-T03): mỗi phần tử một dải rộng hết khung, nền xen kẽ trắng / `bg-alt`,
   * nội dung trong `max-w-container px-gutter`. `DetailSection` trong dải nằm ngoài `group/detail` nên dựng kiểu thường (không thẻ). Thanh tab vẫn theo dõi các khối này
   * (scroll-spy tìm theo `id` trong cả trang).
   */
  bands?: DetailBand[];
  /** Khối cuối trang sau các dải (`SimilarCarousel`, dải Điểm mạnh, banner tư vấn) — tự lo nền. */
  after?: ReactNode;
}

/**
 * Khung trang chi tiết BL-052 (Dự án, Cho thuê, Tin BĐS; BL-054 tái dùng): hero → thanh thông số → khoảng 32px → [tab dính + khối đầu | cột phải dính] → dải rộng nền xen kẽ → slot cuối trang.
 * Dựng trên `DetailLayout sectionStyle="cards"` nên giữ nguyên `data-detail-page` (header ẩn khi cuộn, `--sticky-top`), nền `bg-primary-subtle`, lưới 2 cột,
 * `DetailAsideFit` và thẻ trắng từng `DetailSection` trong lưới. CTA dính đáy < lg do trang tự đặt như hiện tại. Server Component.
 */
export function DetailPageShell({ hero, specBar, subNav, children, aside, asideLabelledBy, bands = [], after }: DetailPageShellProps) {
  const tail =
    bands.length > 0 || after ? (
      <>
        {bands.map((band, index) => (
          <div key={band.key} data-detail-band="" className={BAND_TONES[index % BAND_TONES.length]}>
            <div className="mx-auto w-full max-w-container px-gutter">{band.content}</div>
          </div>
        ))}
        {after}
      </>
    ) : undefined;
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
      {...(tail ? { after: tail } : {})}
    >
      {children}
    </DetailLayout>
  );
}
