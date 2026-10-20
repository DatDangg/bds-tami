import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHero } from "@/components/layout/PageHero";
import { Pagination } from "@/components/layout/Pagination";
import { ListPendingProvider, PendingLink, PendingRegion } from "@/components/layout/PendingRegion";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

export interface CategoryChip {
  label: string;
  href: string;
  current?: boolean;
}

type CategoryListTemplateProps = {
  title: string;
  /** Dòng 2 tiêu đề (màu vàng) và dòng chữ nhỏ trên tiêu đề của hero (BL-045); chữ admin nhập qua `loadPageHero`. */
  titleAccent?: string;
  eyebrow?: string;
  description?: string;
  bannerImage?: MediaImage;
  /** @deprecated Hero mới tự chọn cỡ theo có thẻ lọc hay không; prop còn để trang chưa chuyển (T03/T06) không vỡ kiểu, KHÔNG còn tác dụng. */
  compactBanner?: boolean;
  /** Băng tìm kiếm cũ của trang chưa chuyển: đè mép dưới hero như `filterCard` nhưng tự mang khung của nó. Trang mới dùng `filterCard`. */
  searchBar?: ReactNode;
  /** Nội dung thẻ lọc trắng nổi đè đáy hero (mockup `.fcard`); khi có, hàng chip nằm TRONG thẻ. Có thẻ lọc/băng → hero 440px, không → hero 340px. */
  filterCard?: ReactNode;
  /** Hàng kết quả dưới thẻ lọc (mockup `.toolbar`): trái "N kết quả", phải ô sắp xếp do trang dựng. */
  resultCount?: number;
  sort?: ReactNode;
  /** Banner tư vấn cuối trang (`<ConsultBanner />`), sau `belowContent`. */
  consultBanner?: ReactNode;
  /** Các mục SAU "Trang chủ": Loại › (danh mục cha) › danh mục hiện tại. */
  breadcrumb: BreadcrumbItem[];
  /** Hàng chip danh mục con (hoặc tab danh mục ở S08/S10): là link, chip hiện tại `aria-current="page"`. */
  chips?: CategoryChip[];
  /** Tên vùng của hàng chip (`nav` có nhãn); bỏ trống = chỉ là danh sách link như trước. */
  chipsLabel?: string;
  /** < sm: chip cuộn ngang (scroll-snap) có mép phải mờ báo còn chip (design-spec S02); mặc định chip xuống dòng. */
  scrollChips?: boolean;
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
  /** Khối cuối trang, ngoài vùng danh sách/phân trang (vd form "Tư vấn nhu cầu" của Tin tức); luôn hiện kể cả khi danh sách trống. */
  belowContent?: ReactNode;
};

/**
 * Template trang danh mục dùng chung (design-spec S05, BL-045): hero (breadcrumb kính trên ảnh) → thẻ lọc nổi → hàng kết quả → lưới → phân trang → banner tư vấn.
 * Server Component bố cục (chip/phân trang báo chờ qua `PendingLink` cho `PendingRegion`): dữ liệu, metadata, 404 EN khi danh mục không `hasEnglish` do route gọi nó xử lý.
 */
// `pr-8` chừa chỗ cho mép mờ để chip cuối cuộn ra khỏi vùng mờ; `py-1 -my-1` để vòng focus không bị `overflow` cắt.
const CHIP_SCROLL_CLASS =
  "-my-1 snap-x snap-mandatory flex-nowrap overflow-x-auto py-1 pr-8 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:mask-none sm:flex-wrap sm:overflow-visible sm:pr-0";

/** Thẻ lọc / băng tìm kiếm đè đáy hero: mockup `.fcard` kéo lên 84px (56px mobile) khớp phần đáy hero chừa sẵn. */
const OVERLAP_CLASS = "relative z-10 mx-auto -mt-14 w-full max-w-container px-gutter md:-mt-[84px]";

export function CategoryListTemplate({
  title,
  titleAccent,
  eyebrow,
  description,
  bannerImage,
  searchBar,
  filterCard,
  resultCount,
  sort,
  consultBanner,
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
  belowContent,
}: CategoryListTemplateProps) {
  const t = useTranslations("page.listing");
  const hasOverlay = Boolean(filterCard ?? searchBar);
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
  const hasResultsRow = resultCount !== undefined || sort !== undefined;

  return (
    <>
      <PageHero
        size={hasOverlay ? "list" : "short"}
        title={title}
        {...(titleAccent ? { titleAccent } : {})}
        {...(eyebrow ? { eyebrow } : {})}
        {...(description ? { description } : {})}
        {...(bannerImage ? { image: bannerImage } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={breadcrumb} />}
      />
      <ListPendingProvider>
        {filterCard ? (
          <div data-filter-card="true" className={OVERLAP_CLASS}>
            <div className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-lg md:px-7 md:py-6">
              {filterCard}
              {chipsToolbar}
            </div>
          </div>
        ) : (
          searchBar && (
            <div data-search-overlay="true" className={OVERLAP_CLASS}>
              {searchBar}
            </div>
          )
        )}
        <div className={cn("mx-auto flex w-full max-w-container flex-col gap-8 px-gutter pb-section-tight", hasOverlay ? "pt-4" : "pt-8")}>
          {!filterCard && chipsToolbar}
          {hasResultsRow && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-8">
              <p className="text-body font-semibold">{resultCount !== undefined ? t("resultCount", { count: resultCount }) : null}</p>
              {sort}
            </div>
          )}
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
      {belowContent}
      {consultBanner}
    </>
  );
}
