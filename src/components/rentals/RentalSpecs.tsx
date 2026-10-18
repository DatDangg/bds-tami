import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatArea, formatVndCompact } from "@/lib/format";
import type { RentalDetailView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

/** Hàng "Thông số chính": giá/tháng, diện tích, phòng ngủ, WC dạng chữ lớn (design-spec S07: không thẻ). Ô thiếu dữ liệu thì ẩn. */
export function RentalSpecs({ view }: { view: RentalDetailView }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const price =
    view.priceMonthlyVnd === null ? (
      t("specs.negotiable")
    ) : (
      <>
        {formatVndCompact(view.priceMonthlyVnd, locale)}
        <span className="text-small font-normal text-text-muted">{t("specs.perMonth")}</span>
      </>
    );
  const cells: { label: string; value: ReactNode; muted?: boolean }[] = [
    { label: view.rented ? t("rented.referencePrice") : t("specs.price"), value: price, muted: view.rented },
    { label: t("specs.area"), value: formatArea(view.areaM2, locale) },
    ...(view.bedrooms !== null ? [{ label: t("specs.bedrooms"), value: String(view.bedrooms) }] : []),
    ...(view.bathrooms !== null ? [{ label: t("specs.bathrooms"), value: String(view.bathrooms) }] : []),
  ];
  return (
    <section aria-labelledby="rental-specs-title">
      <h2 id="rental-specs-title" className="sr-only">
        {t("specs.label")}
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-small text-text-muted">{cell.label}</dt>
            <dd className={cell.muted ? "font-display text-h3 text-text-muted" : "font-display text-h3"}>{cell.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Khối "Chi tiết" `<dl>` 2 cột: tầng, hướng nhà, hướng ban công, nội thất, danh mục, dự án. Không có mục nào thì không render khối. */
export function RentalDetails({ view }: { view: RentalDetailView }) {
  const t = useTranslations("page.rentalDetail");
  const linkClass = "inline-flex min-h-11 items-center underline underline-offset-4";
  const items: { label: string; value: ReactNode }[] = [
    ...(view.floor ? [{ label: t("details.floor"), value: view.floor }] : []),
    ...(view.houseDirection ? [{ label: t("details.houseDirection"), value: t(`direction.${view.houseDirection}`) }] : []),
    ...(view.balconyDirection ? [{ label: t("details.balconyDirection"), value: t(`direction.${view.balconyDirection}`) }] : []),
    ...(view.furnishing ? [{ label: t("details.furnishing"), value: t(`furnishing.${view.furnishing}`) }] : []),
    ...(view.category
      ? [{ label: t("details.category"), value: <Link href={view.category.href} className={linkClass}>{view.category.label}</Link> }]
      : []),
    ...(view.project
      ? [{ label: t("details.project"), value: <Link href={view.project.href} className={linkClass}>{view.project.label}</Link> }]
      : []),
  ];
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="rental-details-title">
      <h2 id="rental-details-title" className="mb-4 font-display text-h3">
        {t("details.title")}
      </h2>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col gap-1 border-b border-border pb-3">
            <dt className="text-small text-text-muted">{item.label}</dt>
            <dd className="font-semibold break-words">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
