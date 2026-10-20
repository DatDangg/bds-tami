import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bed, MapPin, Ruler } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CARD_TITLE_CLASS, CardFooter, CardPin } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
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
 * Thẻ tin cho thuê DÙNG CHUNG cho danh sách S04, "tin tương tự" S07 và trang chủ (BL-045): cùng khung thẻ Dự án (ảnh 11:10, badge "Còn trống", tên 2 dòng),
 * thân: tên → ghim khu vực → thông số nhanh (diện tích, phòng ngủ) → chân thẻ giá/tháng vàng đậm + mũi tên tròn (đúng mockup). Danh sách chỉ có tin còn trống nên badge luôn "Còn trống".
 * Cả thẻ là MỘT link. Dữ liệu từ `RentalCardData` (dựng từ doc Payload hoặc từ DTO của `SearchService`).
 */
export function RentalCard({ data, headingLevel = 3, priority = false, imageSizes }: RentalCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentals.card");
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="h-full">
      <Link href={data.href} className={CARD_LINK_CLASS}>
        <div className={`relative aspect-[11/10] w-full shrink-0 overflow-hidden bg-surface-muted ${CARD_IMAGE_ZOOM}`}>
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes={imageSizes ?? "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} priority={priority} decorative />
          ) : (
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
          <Badge className="absolute top-3 left-3">{t("available")}</Badge>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          <Heading className={CARD_TITLE_CLASS}>{data.title}</Heading>
          {data.areaLabel && (
            <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
              <CardPin label={data.areaLabel} />
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Ruler size={16} aria-hidden="true" className="shrink-0" />
              {formatArea(data.areaM2, locale)}
            </span>
            {data.bedrooms !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Bed size={16} aria-hidden="true" className="shrink-0" />
                {t("bedrooms", { count: data.bedrooms })}
              </span>
            )}
          </p>
          {/* Thứ tự theo mockup data-cards=rent: tên → ghim → thông số → chân thẻ (giá + mũi tên). */}
          <CardFooter labelClassName="text-body font-semibold text-accent-text">
            {data.priceMonthlyVnd === null ? (
              t("negotiable")
            ) : (
              <>
                {formatVndCompact(data.priceMonthlyVnd, locale)}
                {t("perMonth")}
              </>
            )}
          </CardFooter>
        </div>
      </Link>
    </article>
  );
}
