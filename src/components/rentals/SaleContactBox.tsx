import { useTranslations } from "next-intl";
import { DetailContactAside } from "@/components/detail/DetailContactAside";
import { Phone } from "@/components/icons";
import { LeadForm } from "@/components/leads/LeadForm";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import type { SaleContactView } from "@/lib/rentals/rental-view";
import { RentalPriceText, type RentalPriceInput } from "./RentalPriceText";

/** Id tiêu đề form trong thẻ liên hệ: nhãn cho `<aside>` của khung chi tiết. */
export const RENTAL_CONTACT_HEADING_ID = "rental-consult-heading";

interface SaleContactBoxProps {
  view: RentalPriceInput;
  /** Id tin cho thuê: nguồn của lead (tin đã thuê vẫn là nguồn). */
  rentalId: string;
  /** Sale phụ trách đang hoạt động và có SĐT; `null` (sale bị khoá, đã xoá, thiếu SĐT) → hotline chung, KHÔNG hiện tên. */
  sale: SaleContactView | null;
  hotline?: { label: string; telHref: string };
}

/**
 * Cột liên hệ chi tiết Cho thuê (BL-052, cùng `DetailContactAside` với chi tiết Dự án): một thẻ trắng dính gồm giá thuê/tháng (tin đã thuê: "Giá tham khảo", chữ mờ)
 * → người phụ trách (avatar, tên, nút gọi `tel:`) khi có → form lead `source=rental` duy nhất (`#lead-form`; tin đã thuê đổi tiêu đề thành "Nhận tư vấn căn tương tự", nguồn vẫn là tin đó).
 * Không có sale → khối Hotline nền tối "Gọi ngay" dưới thẻ (không có hotline → ẩn). Server Component, không đọc DB.
 */
export function SaleContactBox({ view, rentalId, sale, hotline }: SaleContactBoxProps) {
  const t = useTranslations("page.rentalDetail");
  const turnstileSiteKey = readTurnstileSiteKey();
  const header = (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-small text-text-muted">{view.rented ? t("rented.referencePrice") : t("specs.price")}</p>
        <p className={view.rented ? "font-display text-price text-text-muted" : "font-display text-price"}>
          <RentalPriceText view={view} />
        </p>
      </div>
      {sale && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg bg-primary-subtle p-3.5">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-primary-soft">
              {sale.avatar && <ResponsiveImage media={sale.avatar} alt={t("contact.avatarAlt", { name: sale.name })} sizes="48px" />}
            </div>
            <div className="min-w-0">
              <p className="text-small text-text-muted">{t("contact.saleTitle")}</p>
              <p className="font-semibold break-words">{sale.name}</p>
            </div>
          </div>
          <Button asChild size="lg" variant="dark" className="w-full normal-case">
            <a href={sale.telHref}>
              <Phone size={20} weight="fill" aria-hidden="true" />
              {t("contact.callSale", { phone: sale.phoneLabel })}
            </a>
          </Button>
        </div>
      )}
    </>
  );
  return (
    <DetailContactAside
      title={view.rented ? t("leadForm.titleRented") : t("leadForm.title")}
      headingId={RENTAL_CONTACT_HEADING_ID}
      header={header}
      hotline={sale ? null : (hotline ?? null)}
    >
      <LeadForm source="rental" sourceId={rentalId} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
    </DetailContactAside>
  );
}
