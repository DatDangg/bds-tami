import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { formatArea, formatVndCompact } from "@/lib/format";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

interface RentalCardProps {
  data: RentalCardData;
  /** Cấp tiêu đề của tên tin: `h2` ở danh sách (dưới `h1`), `h3` khi thẻ nằm trong một khối đã có `h2` (tin tương tự). */
  headingLevel?: 2 | 3;
  /** Ảnh đầu danh sách (LCP): tải sớm. */
  priority?: boolean;
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới danh sách (vd lưới 2 cột trong cột chính chi tiết dự án). */
  imageSizes?: string;
}

/**
 * Thẻ tin cho thuê DÙNG CHUNG cho danh sách S04 và "tin tương tự" S07: ảnh 4:3, tên (2 dòng), khu vực, giá/tháng + diện tích + phòng ngủ.
 * Cả thẻ là MỘT link. Dữ liệu từ `RentalCardData` (dựng từ doc Payload hoặc từ DTO của `SearchService`).
 */
export function RentalCard({ data, headingLevel = 3, priority = false, imageSizes }: RentalCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentals.card");
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const facts = [formatArea(data.areaM2, locale), ...(data.bedrooms !== null ? [t("bedrooms", { count: data.bedrooms })] : [])];
  return (
    <article className="h-full">
      <Link href={data.href} className="group flex h-full min-h-11 flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes={imageSizes ?? "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} priority={priority} decorative />
          ) : (
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1 p-4">
          <Heading className="line-clamp-2 font-display text-h4 transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{data.title}</Heading>
          {data.areaLabel && <p className="text-small text-text-muted">{data.areaLabel}</p>}
          <p className="text-small font-semibold">
            {data.priceMonthlyVnd === null ? (
              t("negotiable")
            ) : (
              <>
                {formatVndCompact(data.priceMonthlyVnd, locale)}
                {t("perMonth")}
              </>
            )}
          </p>
          <p className="text-small text-text-secondary">{facts.join(" · ")}</p>
        </div>
      </Link>
    </article>
  );
}
