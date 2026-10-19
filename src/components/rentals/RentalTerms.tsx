import { useTranslations } from "next-intl";
import { CaretDown } from "@/components/icons";
import type { RentalTermsView } from "@/lib/rentals/rental-view";

interface RentalTermsProps {
  terms: RentalTermsView;
  /** Tin đã thuê: điều khoản thu gọn thành accordion đóng (design-spec S07) — khách chỉ tham khảo. */
  collapsed?: boolean;
}

/** Khối "Điều khoản thuê" `<dl>`: thời hạn tối thiểu, đặt cọc, kỳ thanh toán, ngày trống, dịch vụ bao gồm (chip trung tính). Server Component (accordion dùng `<details>` gốc). */
export function RentalTerms({ terms, collapsed = false }: RentalTermsProps) {
  const t = useTranslations("page.rentalDetail");
  const items = [
    ...(terms.minLeaseMonths !== null ? [{ label: t("terms.minLease"), value: t("terms.months", { count: terms.minLeaseMonths }) }] : []),
    ...(terms.depositMonths !== null ? [{ label: t("terms.deposit"), value: t("terms.months", { count: terms.depositMonths }) }] : []),
    ...(terms.paymentCycle ? [{ label: t("terms.paymentCycle"), value: t(`terms.cycle.${terms.paymentCycle}`) }] : []),
    ...(terms.availableFromLabel ? [{ label: t("terms.availableFrom"), value: terms.availableFromLabel, iso: terms.availableFromIso }] : []),
  ];
  const body = (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-1 border-b border-border pb-3">
          <dt className="text-small text-text-muted">{item.label}</dt>
          <dd className="font-semibold">{"iso" in item && item.iso ? <time dateTime={item.iso}>{item.value}</time> : item.value}</dd>
        </div>
      ))}
      {terms.services.length > 0 && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <dt className="text-small text-text-muted">{t("terms.services")}</dt>
          <dd>
            <ul className="flex flex-wrap gap-2">
              {terms.services.map((service) => (
                <li key={service} className="rounded-sm bg-surface-muted px-2.5 py-1 text-small">
                  {t(`terms.service.${service}`)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </dl>
  );

  if (collapsed) {
    return (
      <details className="group border-b border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-h3 [&::-webkit-details-marker]:hidden">
          {t("terms.title")}
          <CaretDown size={20} aria-hidden="true" className="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="pb-4">{body}</div>
      </details>
    );
  }
  return (
    <section aria-labelledby="rental-terms-title">
      <h2 id="rental-terms-title" className="mb-4 font-display text-h2-sm">
        {t("terms.title")}
      </h2>
      {body}
    </section>
  );
}
