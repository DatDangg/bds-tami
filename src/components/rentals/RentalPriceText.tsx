import { useLocale, useTranslations } from "next-intl";
import { formatVndCompact } from "@/lib/format";
import type { RentalDetailView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

/** `priceNegotiable` đọc thẳng từ doc: view gộp "tick thương lượng" và "chưa nhập giá" thành `priceMonthlyVnd = null`, trang chi tiết cần tách hai chữ. */
export type RentalPriceInput = Pick<RentalDetailView, "rented" | "priceMonthlyVnd"> & { priceNegotiable: boolean };

/**
 * Giá thuê của trang chi tiết (BL-052): "12 triệu" + "/tháng"; không có giá → "Thương lượng" (admin tick thương lượng) hoặc "Liên hệ" (chưa nhập giá).
 * Hook (next-intl) nên chỉ gọi trong component.
 */
export function useRentalPrice({ priceMonthlyVnd, priceNegotiable }: RentalPriceInput): { amount: string | null; perMonth: string; text: string } {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const perMonth = t("specs.perMonth");
  if (priceMonthlyVnd !== null) {
    const amount = formatVndCompact(priceMonthlyVnd, locale);
    // U+200B trước "/tháng": ô hẹp (thanh thông số 2 cột < sm) xuống dòng trước "/month" thay vì cắt giữa từ ("VND/mont-h").
    return { amount, perMonth, text: `${amount}​${perMonth}` };
  }
  return { amount: null, perMonth, text: priceNegotiable ? t("v2.spec.negotiable") : t("v2.spec.contact") };
}

/** Giá thuê dạng chữ lớn: phần "/tháng" nhỏ, màu phụ. */
export function RentalPriceText({ view }: { view: RentalPriceInput }) {
  const { amount, perMonth, text } = useRentalPrice(view);
  if (amount === null) return text;
  return (
    <>
      {amount}
      <span className="ml-1 text-body font-normal text-text-muted">{perMonth}</span>
    </>
  );
}
