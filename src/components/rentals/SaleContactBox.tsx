import { useLocale, useTranslations } from "next-intl";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { Phone } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { formatVndCompact } from "@/lib/format";
import type { RentalDetailView, SaleContactView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

interface SaleContactBoxProps {
  view: Pick<RentalDetailView, "rented" | "priceMonthlyVnd">;
  /** Sale phụ trách đang hoạt động và có SĐT; `null` (sale bị khoá, đã xoá, thiếu SĐT) → hotline chung, KHÔNG hiện tên. */
  sale: SaleContactView | null;
  hotline?: { label: string; telHref: string };
}

/**
 * Khung phải của S07 (`--color-primary-subtle`, dính ≥ lg): giá + "/tháng" (tin đã thuê: chữ mờ + "Giá tham khảo") → người phụ trách
 * (avatar, tên, nút gọi) hoặc hotline chung → vùng form lead (`LeadFormSlot`, layer-10-task-01 ráp form thật; tin đã thuê đổi tiêu đề
 * thành "Nhận tư vấn căn tương tự"). Server Component, không đọc DB.
 */
export function SaleContactBox({ view, sale, hotline }: SaleContactBoxProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const contact = sale ? { href: sale.telHref, label: t("contact.callSale", { phone: sale.phoneLabel }) } : hotline ? { href: hotline.telHref, label: t("contact.callHotline", { phone: hotline.label }) } : null;
  return (
    <div className="flex flex-col gap-6 rounded-sm bg-primary-subtle p-6">
      <div className="flex flex-col gap-1">
        <p className="text-small text-text-muted">{view.rented ? t("rented.referencePrice") : t("specs.price")}</p>
        <p className={view.rented ? "font-display text-price text-text-muted" : "font-display text-price"}>
          {view.priceMonthlyVnd === null ? (
            t("specs.negotiable")
          ) : (
            <>
              {formatVndCompact(view.priceMonthlyVnd, locale)}
              <span className="ml-1 text-body font-normal text-text-muted">{t("specs.perMonth")}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {sale ? (
          <div className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-surface-muted">
              {sale.avatar && <ResponsiveImage media={sale.avatar} alt={t("contact.avatarAlt", { name: sale.name })} sizes="48px" />}
            </div>
            <div className="min-w-0">
              <p className="text-small text-text-muted">{t("contact.saleTitle")}</p>
              <p className="font-semibold break-words">{sale.name}</p>
            </div>
          </div>
        ) : (
          <p className="font-semibold">{t("contact.hotlineTitle")}</p>
        )}
        {contact && (
          <Button asChild size="lg" variant="dark" className="w-full normal-case">
            <a href={contact.href}>
              <Phone size={20} weight="fill" aria-hidden="true" />
              {contact.label}
            </a>
          </Button>
        )}
      </div>
      <LeadFormSlot
        title={view.rented ? t("leadForm.titleRented") : t("leadForm.title")}
        className="scroll-mt-30 bg-transparent p-0 lg:scroll-mt-32 lg:p-0"
        fallback={<p className="text-body text-text-secondary">{view.rented ? t("leadForm.fallbackRented") : t("leadForm.fallback")}</p>}
      />
    </div>
  );
}
