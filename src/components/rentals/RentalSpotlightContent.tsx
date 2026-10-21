import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatArea } from "@/lib/format";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";
import { MonthlyPrice } from "./RentalCard";

/**
 * Phần NỘI DUNG (cột phải) của thẻ nổi bật `/cho-thue` (BL-052, cùng khung `SpotlightSlider` với `/du-an`): tag danh mục + nội thất, tên, khu vực,
 * "Giá thuê · Diện tích · Phòng ngủ / tắm" (ô trống bị bỏ; không giá → "Thương lượng" / "Liên hệ" như thẻ), nút "Xem chi tiết" + "Nhận tư vấn" (→ `#lead-form` của chi tiết).
 * Tin nổi bật luôn còn trống (trang danh sách chỉ liệt kê tin còn trống) nên không có badge "Đã thuê". Không icon tim.
 */
export function RentalSpotlightContent({ data }: { data: RentalCardData }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentals");
  const tCard = useTranslations("rentalCard");
  const tags = [data.categoryLabel, data.furnishing ? tCard(`furnishing.${data.furnishing}`) : null].filter((tag): tag is string => Boolean(tag));
  const layout = [data.bedrooms === null ? null : tCard("bedroomsLabel", { count: data.bedrooms }), data.bathrooms === null ? null : tCard("bathroomsLabel", { count: data.bathrooms })]
    .filter(Boolean)
    .join(" · ");
  const facts = [
    { key: "price", label: t("spotlight.price"), value: <MonthlyPrice value={data.priceMonthlyVnd} negotiable={data.priceNegotiable} />, accent: true },
    { key: "area", label: t("filterGroups.area"), value: formatArea(data.areaM2, locale), accent: false },
    ...(layout ? [{ key: "layout", label: t("spotlight.layout"), value: layout, accent: false }] : []),
  ];
  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={`${index}:${tag}`} variant={index === 0 && data.categoryLabel ? "dark" : "neutral"}>
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <h2 className="line-clamp-2 font-display text-h3">{data.title}</h2>
      {data.areaLabel && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <MapPin size={16} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{data.areaLabel}</span>
        </p>
      )}
      <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.key} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xsmall text-text-muted">{fact.label}</dt>
            <dd className={`font-semibold ${fact.accent ? "text-accent-text" : "text-text"}`}>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex flex-wrap gap-3">
        <Link href={data.href} className={buttonVariants()}>
          {t("spotlight.viewDetail")}
          <span className="sr-only">: {data.title}</span>
        </Link>
        <Link href={`${data.href}#lead-form`} className={buttonVariants({ variant: "secondary" })}>
          {t("spotlight.consult")}
          <span className="sr-only">: {data.title}</span>
        </Link>
      </div>
    </div>
  );
}
