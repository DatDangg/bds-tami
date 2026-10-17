import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageBanner } from "@/components/layout/PageBanner";
import { Pagination } from "@/components/layout/Pagination";
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
  /** Danh sách cha, dùng cho nút về danh sách khi danh mục chưa có bài. */
  parentListHref: string;
  /** Lưới thẻ do trang truyền vào; template không biết loại thẻ. Bỏ qua khi `isEmpty`. */
  children: ReactNode;
  isEmpty: boolean;
  pagination: { page: number; totalPages: number; buildHref: (page: number) => string };
}

/**
 * Template trang danh mục dùng chung (design-spec S05): banner chữ/ảnh → breadcrumb → chip danh mục con → lưới → phân trang.
 * Server Component thuần bố cục: dữ liệu, metadata, 404 EN khi danh mục không `hasEnglish` do route gọi nó xử lý.
 */
export function CategoryListTemplate({
  title,
  description,
  bannerImage,
  breadcrumb,
  chips,
  parentListHref,
  children,
  isEmpty,
  pagination,
}: CategoryListTemplateProps) {
  return (
    <>
      <PageBanner title={title} description={description} image={bannerImage} />
      <Breadcrumb items={breadcrumb} className="py-2" />
      <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter pt-4 pb-section-tight">
        {chips && chips.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.href}>
                <Link
                  href={chip.href}
                  aria-current={chip.current ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-4 text-small font-semibold",
                    chip.current ? "border-dark bg-dark text-on-dark" : "border-border text-text hover:border-input-border",
                  )}
                >
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {isEmpty ? (
          <EmptyState variant="empty" backHref={parentListHref} />
        ) : (
          <>
            {children}
            <Pagination {...pagination} />
          </>
        )}
      </div>
    </>
  );
}
