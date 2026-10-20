import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatArea } from "@/lib/format";
import type { RentalDetailView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

/**
 * Nội dung khối "Thông tin chi tiết" (mockup `.kv`): `<dl>` 2 cột gồm mã tin, danh mục, diện tích, tầng, phòng ngủ, WC, nội thất, hướng nhà, hướng ban công, dự án, ngày đăng.
 * Dòng thiếu dữ liệu bị bỏ. Tiêu đề khối do `DetailSection` ở `RentalDetail` lo. Tiện ích có khối riêng (`RentalAmenities`), giá nằm ở khối tiêu đề và thẻ liên hệ.
 */
export function RentalDetails({ view }: { view: RentalDetailView }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const linkClass = "inline-flex min-h-11 items-center underline underline-offset-4";
  const items: { label: string; value: ReactNode }[] = [
    { label: t("code"), value: view.code },
    ...(view.category ? [{ label: t("details.category"), value: <Link href={view.category.href} className={linkClass}>{view.category.label}</Link> }] : []),
    { label: t("specs.area"), value: formatArea(view.areaM2, locale) },
    ...(view.floor ? [{ label: t("details.floor"), value: view.floor }] : []),
    ...(view.bedrooms !== null ? [{ label: t("specs.bedrooms"), value: String(view.bedrooms) }] : []),
    ...(view.bathrooms !== null ? [{ label: t("specs.bathrooms"), value: String(view.bathrooms) }] : []),
    ...(view.furnishing ? [{ label: t("details.furnishing"), value: t(`furnishing.${view.furnishing}`) }] : []),
    ...(view.houseDirection ? [{ label: t("details.houseDirection"), value: t(`direction.${view.houseDirection}`) }] : []),
    ...(view.balconyDirection ? [{ label: t("details.balconyDirection"), value: t(`direction.${view.balconyDirection}`) }] : []),
    ...(view.project ? [{ label: t("details.project"), value: <Link href={view.project.href} className={linkClass}>{view.project.label}</Link> }] : []),
    ...(view.postedAtLabel && view.postedAtIso ? [{ label: t("postedAt"), value: <time dateTime={view.postedAtIso}>{view.postedAtLabel}</time> }] : []),
  ];
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-1 border-b border-border pb-3">
          <dt className="text-small text-text-muted">{item.label}</dt>
          <dd className="font-semibold break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
