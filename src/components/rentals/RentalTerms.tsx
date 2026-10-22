import { useTranslations } from "next-intl";
import { DETAIL_SECTION_FRAME_CLASS, DetailSection } from "@/components/detail/DetailSection";
import { CaretDown } from "@/components/icons";
import type { RentalTermsView } from "@/lib/rentals/rental-view";
import { cn } from "@/lib/utils";

interface RentalTermsProps {
  /** `id` khối: đích của mục "Điều khoản" trên thanh mục con. */
  id: string;
  terms: RentalTermsView;
  /** Dòng nhỏ vàng trên tiêu đề (kiểu thẻ của khung chi tiết mới). */
  eyebrow?: string;
  /** Tin đã thuê: điều khoản thu gọn thành accordion đóng (design-spec S07) — khách chỉ tham khảo. */
  collapsed?: boolean;
}

/**
 * Khối "Điều khoản thuê" `<dl>`: thời hạn tối thiểu, đặt cọc, kỳ thanh toán, ngày trống, dịch vụ bao gồm (chip trung tính). Dùng khung `DetailSection` chung;
 * tin đã thuê thu gọn thành accordion `<details>` (tiêu đề nằm ở summary). Server Component.
 */
export function RentalTerms({ id, terms, eyebrow, collapsed = false }: RentalTermsProps) {
  const t = useTranslations("page.rentalDetail");
  const items = [
    ...(terms.minLeaseMonths !== null ? [{ label: t("terms.minLease"), value: t("terms.months", { count: terms.minLeaseMonths }) }] : []),
    ...(terms.depositMonths !== null ? [{ label: t("terms.deposit"), value: t("terms.months", { count: terms.depositMonths }) }] : []),
    ...(terms.paymentCycle ? [{ label: t("terms.paymentCycle"), value: t(`terms.cycle.${terms.paymentCycle}`) }] : []),
    ...(terms.availableFromLabel ? [{ label: t("terms.availableFrom"), value: terms.availableFromLabel, iso: terms.availableFromIso }] : []),
  ];
  const body = (
    <dl className="grid gap-x-8 @md/detail:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-baseline justify-between gap-4 border-b border-border py-3">
          <dt className="text-small text-text-muted">{item.label}</dt>
          <dd className="text-right font-semibold">{"iso" in item && item.iso ? <time dateTime={item.iso}>{item.value}</time> : item.value}</dd>
        </div>
      ))}
      {terms.services.length > 0 && (
        <div className="flex flex-col gap-2 @md/detail:col-span-2">
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
    // Không dùng DetailSection (sẽ thêm h2 thứ hai): tiêu đề là summary. Khung/scroll-mt dùng chung với DetailSection để thẻ và neo đồng nhất.
    return (
      <div id={id} tabIndex={-1} className={cn("scroll-mt-[calc(var(--sticky-top)+4.5rem)] focus:outline-none", DETAIL_SECTION_FRAME_CLASS)}>
        {eyebrow && <p className="mb-1.5 text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{eyebrow}</p>}
        <details className="group border-b border-border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-h3 [&::-webkit-details-marker]:hidden">
            {t("terms.title")}
            <CaretDown size={20} aria-hidden="true" className="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="pb-4">{body}</div>
        </details>
      </div>
    );
  }
  return (
    <DetailSection id={id} title={t("terms.title")} {...(eyebrow ? { eyebrow } : {})}>
      {body}
    </DetailSection>
  );
}
