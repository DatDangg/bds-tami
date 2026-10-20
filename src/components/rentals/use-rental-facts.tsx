import { useLocale, useTranslations } from "next-intl";
import { Armchair, Bed, Compass, Ruler } from "@/components/icons";
import type { DetailFact } from "@/components/detail/DetailTitleCard";
import { formatArea } from "@/lib/format";
import type { RentalDetailView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

const ICON_SIZE = 22;

/**
 * Dải thông số trong khối tiêu đề chi tiết Cho thuê (mockup `detail-rent`, BL-045 #5): diện tích · phòng ngủ (nhãn: số WC) · nội thất · hướng nhà. Ô thiếu dữ liệu bị bỏ, không hiện "—".
 * Hook (dùng `useTranslations`/`useLocale`) nên chỉ gọi trong component.
 */
export function useRentalFacts({ areaM2, bedrooms, bathrooms, furnishing, houseDirection }: Pick<RentalDetailView, "areaM2" | "bedrooms" | "bathrooms" | "furnishing" | "houseDirection">): DetailFact[] {
  const t = useTranslations("page.rentalDetail");
  const locale = useLocale() as Locale;
  const layout =
    bedrooms !== null
      ? { value: t("facts.bedroomsValue", { count: bedrooms }), label: bathrooms !== null ? t("facts.bathroomsValue", { count: bathrooms }) : t("specs.bedrooms") }
      : bathrooms !== null
        ? { value: t("facts.bathroomsValue", { count: bathrooms }), label: t("facts.sanitary") }
        : null;
  return [
    { icon: <Ruler size={ICON_SIZE} aria-hidden="true" />, label: t("specs.area"), value: formatArea(areaM2, locale) },
    ...(layout ? [{ icon: <Bed size={ICON_SIZE} aria-hidden="true" />, ...layout }] : []),
    ...(furnishing ? [{ icon: <Armchair size={ICON_SIZE} aria-hidden="true" />, label: t("details.furnishing"), value: t(`furnishing.${furnishing}`) }] : []),
    ...(houseDirection ? [{ icon: <Compass size={ICON_SIZE} aria-hidden="true" />, label: t("facts.direction"), value: t(`direction.${houseDirection}`) }] : []),
  ];
}
