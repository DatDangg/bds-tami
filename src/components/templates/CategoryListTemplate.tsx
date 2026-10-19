import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageBanner } from "@/components/layout/PageBanner";
import { Pagination } from "@/components/layout/Pagination";
import { ListPendingProvider, PendingLink, PendingRegion } from "@/components/layout/PendingRegion";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

export interface CategoryChip {
  label: string;
  href: string;
  current?: boolean;
}

interface CategoryListTemplateProps {
  title: string;
  description?: string;
  bannerImage?: MediaImage;
  /** Các mục SAU "Trang chủ": Loại › (danh mục cha) › danh mục hiện tại. */
  breadcrumb: BreadcrumbItem[];
  /** Hàng chip danh mục con (hoặc tab danh mục ở S08/S10): là link, chip hiện tại `aria-current="page"`. */
  chips?: CategoryChip[];
  /** Tên vùng của hàng chip (`nav` có nhãn); bỏ trống = chỉ là danh sách link như trước. */
  chipsLabel?: string;
  /** < sm: chip cuộn ngang (scroll-snap) có mép phải mờ báo còn chip (design-spec S02); mặc định chip xuống dòng. */
  scrollChips?: boolean;
  /** Banner gọn 240px kiểu market (BL-020 P3): trang danh sách Dự án/Tin BĐS/Tuyển dụng. Mặc định giữ banner cao theo viewport (Tin tức). */
  compactBanner?: boolean;
  /** Băng tìm kiếm gọn (`ListSearchBar`) đè 3rem lên mép dưới banner gọn; dựng trong template để nằm trong vùng chờ của danh sách. Cần `compactBanner`. */
  searchBar?: ReactNode;
  /** Thanh lọc đặt cạnh hàng chip (≥ lg cùng một hàng, nhỏ hơn xếp dưới); luôn hiện kể cả khi kết quả trống để người dùng đổi/xoá bộ lọc. */
  toolbar?: ReactNode;
  /** Thay trạng thái trống mặc định (vd "Chưa có dự án phù hợp." kèm nút xoá bộ lọc). */
  emptyState?: ReactNode;
  /** Danh sách cha, dùng cho nút về danh sách khi danh mục chưa có bài. */
  parentListHref: string;
  /** Lưới thẻ do trang truyền vào; template không biết loại thẻ. Bỏ qua khi `isEmpty`. */
  children: ReactNode;
  isEmpty: boolean;
  pagination: { page: number; totalPages: number; buildHref: (page: number) => string };
}

/**
 * Template trang danh mục dùng chung (design-spec S05): banner chữ/ảnh → breadcrumb → chip danh mục con → lưới → phân trang.
 * Server Component bố cục (chip/phân trang báo chờ qua `PendingLink` cho `PendingRegion`): dữ liệu, metadata, 404 EN khi danh mục không `hasEnglish` do route gọi nó xử lý.
 */
// `pr-8` chừa chỗ cho mép mờ để chip cuối cuộn ra khỏi vùng mờ; `py-1 -my-1` để vòng focus không bị `overflow` cắt.
const CHIP_SCROLL_CLASS =
  "-my-1 snap-x snap-mandatory flex-nowrap overflow-x-auto py-1 pr-8 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:mask-none sm:flex-wrap sm:overflow-visible sm:pr-0";

export function CategoryListTemplate({
  title,
  description,
  bannerImage,
  compactBanner = false,
  searchBar,
  breadcrumb,
  chips,
  chipsLabel,
  scrollChips,
  toolbar,
  emptyState,
  parentListHref,
  children,
  isEmpty,
  pagination,
}: CategoryListTemplateProps) {
  const chipList =
    chips && chips.length > 0 ? (
      <ul className={cn("flex gap-2", scrollChips ? CHIP_SCROLL_CLASS : "flex-wrap")}>
        {chips.map((chip) => (
          <li key={chip.href} className={scrollChips ? "shrink-0 snap-start sm:shrink" : undefined}>
            <PendingLink
              href={chip.href}
              aria-current={chip.current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-small font-semibold",
                scrollChips && "whitespace-nowrap sm:whitespace-normal",
                chip.current ? "border-dark bg-dark text-on-dark" : "border-border text-text hover:border-input-border",
              )}
            >
              {chip.label}
            </PendingLink>
          </li>
        ))}
      </ul>
    ) : null;
  const chipRow = chipList && chipsLabel ? <nav aria-label={chipsLabel}>{chipList}</nav> : chipList;
  const chipsToolbar = toolbar ? (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      {chipRow}
      {toolbar}
    </div>
  ) : (
    chipRow
  );

  return (
    <>
      <PageBanner title={title} description={description} image={bannerImage} size={compactBanner ? "compact" : "default"} />
      <ListPendingProvider>
        {/* PageBanner compact chừa đúng 3rem đáy cho băng đè lên. */}
        {searchBar && <div className="relative z-10 mx-auto -mt-12 w-full max-w-container px-gutter">{searchBar}</div>}
        <Breadcrumb items={breadcrumb} className="py-2" />
        <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter pt-4 pb-section-tight">
          {chipsToolbar}
          <PendingRegion className="flex flex-col gap-8">
            {isEmpty ? (
              (emptyState ?? <EmptyState variant="empty" backHref={parentListHref} />)
            ) : (
              <>
                {children}
                <Pagination {...pagination} />
              </>
            )}
          </PendingRegion>
        </div>
      </ListPendingProvider>
    </>
  );
}
