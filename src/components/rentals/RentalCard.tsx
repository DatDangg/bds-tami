import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bathtub, Bed, MapPin, Ruler } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CARD_TITLE_CLASS, CardArrow, CardFooter, CardPin } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { formatArea, formatVndCompact } from "@/lib/format";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

interface RentalCardProps {
  data: RentalCardData;
  /**
   * - `listing` (mặc định, BL-052): danh sách `/cho-thue`, "Căn tương tự", tin cho thuê trong trang dự án — badge "Đã thuê" (nếu có), tag danh mục + nội thất,
   *   giá/tháng, diện tích · phòng ngủ · phòng tắm, mũi tên.
   * - `home`: khối Cho thuê trang chủ GIỮ thẻ BL-045 (badge "Còn trống", không tag; spec BL-052 F3).
   */
  variant?: "listing" | "home";
  /** Cấp tiêu đề của tên tin: `h2` ở danh sách (dưới `h1`), `h3` khi thẻ nằm trong một khối đã có `h2` (tin tương tự). */
  headingLevel?: 2 | 3;
  /** Ảnh đầu danh sách (LCP): tải sớm. */
  priority?: boolean;
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới danh sách (vd lưới 2 cột trong cột chính chi tiết dự án). */
  imageSizes?: string;
}

const DEFAULT_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/** Giá/tháng; tin không có giá → "Thương lượng" (admin tick thương lượng) hoặc "Liên hệ" (chưa nhập giá) — cùng chữ với trang chi tiết (BL-052, bỏ "Thoả thuận"). */
export function MonthlyPrice({ value, negotiable }: { value: number | null; negotiable: boolean }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentals.card");
  const tPrice = useTranslations("page.rentalDetail.v2.spec");
  if (value === null) return <>{tPrice(negotiable ? "negotiable" : "contact")}</>;
  return (
    <>
      {formatVndCompact(value, locale)}
      {t("perMonth")}
    </>
  );
}

/** Trang chủ chỉ có tin còn trống: badge luôn "Còn trống" (BL-045). Thẻ `listing` chỉ gắn badge khi tin đã thuê. */
function CardBadge({ variant, rented }: { variant: "listing" | "home"; rented: boolean }) {
  const tHome = useTranslations("page.rentals.card");
  const tCard = useTranslations("rentalCard");
  if (variant === "home") return <Badge className="absolute top-3 left-3">{tHome("available")}</Badge>;
  if (!rented) return null;
  return (
    <Badge variant="dark" className="absolute top-3 left-3">
      {tCard("rented")}
    </Badge>
  );
}

/** Thân thẻ `home` (BL-045, giữ nguyên): ghim khu vực → diện tích + phòng ngủ → chân thẻ giá + mũi tên. */
function HomeBody({ data }: { data: RentalCardData }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentals.card");
  return (
    <>
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
        <MonthlyPrice value={data.priceMonthlyVnd} negotiable={data.priceNegotiable} />
      </CardFooter>
    </>
  );
}

/** Thân thẻ `listing` (BL-052): ghim khu vực → tag danh mục + nội thất → giá/tháng → thông số + mũi tên. */
function ListingBody({ data }: { data: RentalCardData }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("rentalCard");
  const tags = [data.categoryLabel, data.furnishing ? t(`furnishing.${data.furnishing}`) : null].filter((tag): tag is string => Boolean(tag));
  return (
    <>
      {data.areaLabel && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <CardPin label={data.areaLabel} />
        </p>
      )}
      {tags.length > 0 && (
        <ul aria-label={t("tagsLabel")} className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <li key={`${index}:${tag}`} className="rounded-pill bg-surface-muted px-2.5 py-0.5 text-xsmall text-text-secondary">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <p className="text-body font-semibold text-accent-text">
        <MonthlyPrice value={data.priceMonthlyVnd} negotiable={data.priceNegotiable} />
      </p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        <ul aria-label={t("specsLabel")} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
          <li className="inline-flex items-center gap-1.5">
            <Ruler size={16} aria-hidden="true" className="shrink-0" />
            {formatArea(data.areaM2, locale)}
          </li>
          {data.bedrooms !== null && (
            <li className="inline-flex items-center gap-1.5">
              <Bed size={16} aria-hidden="true" className="shrink-0" />
              <span aria-hidden="true">{t("bedrooms", { count: data.bedrooms })}</span>
              <span className="sr-only">{t("bedroomsLabel", { count: data.bedrooms })}</span>
            </li>
          )}
          {data.bathrooms !== null && (
            <li className="inline-flex items-center gap-1.5">
              <Bathtub size={16} aria-hidden="true" className="shrink-0" />
              <span aria-hidden="true">{t("bathrooms", { count: data.bathrooms })}</span>
              <span className="sr-only">{t("bathroomsLabel", { count: data.bathrooms })}</span>
            </li>
          )}
        </ul>
        <CardArrow />
      </div>
    </>
  );
}

/**
 * Thẻ tin cho thuê DÙNG CHUNG: cùng khung thẻ Dự án (ảnh 11:10, tên 2 dòng, mũi tên tròn; không icon tim). Cả thẻ là MỘT link (hover BL-034).
 * Dữ liệu từ `RentalCardData` (dựng từ doc Payload hoặc từ DTO của `SearchService`). Biến thể: xem `RentalCardProps.variant`.
 */
export function RentalCard({ data, variant = "listing", headingLevel = 3, priority = false, imageSizes }: RentalCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="h-full" data-card-variant={variant}>
      <Link href={data.href} className={CARD_LINK_CLASS}>
        <div className={`relative aspect-[11/10] w-full shrink-0 overflow-hidden bg-surface-muted ${CARD_IMAGE_ZOOM}`}>
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes={imageSizes ?? DEFAULT_SIZES} priority={priority} decorative />
          ) : (
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
          <CardBadge variant={variant} rented={data.rented} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          <Heading className={CARD_TITLE_CLASS}>{data.title}</Heading>
          {variant === "home" ? <HomeBody data={data} /> : <ListingBody data={data} />}
        </div>
      </Link>
    </article>
  );
}
