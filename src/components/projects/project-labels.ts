import { useLocale, useTranslations } from "next-intl";
import { formatHectares, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { Locale } from "@/i18n/routing";

/**
 * Nhãn dùng chung giữa thanh thông số (`ProjectDetail`) và lưới thông tin (`ProjectOverview`) của chi tiết Dự án — một chỗ định dạng, hai nơi hiện giống nhau.
 * Hook (dùng được trong Server Component đồng bộ như `useTranslations`).
 */

/** "Căn hộ, Nhà phố" theo `productTypes`; rỗng → `""` (ô bị bỏ). */
export function useProductTypesText(productTypes: ProjectDetailView["productTypes"]): string {
  const tType = useTranslations("listingOptions.propertyType");
  return productTypes.map((type) => tType(type)).join(", ");
}

/** "12,5 ha" từ diện tích đất (m²); không có → `null`. */
export function useHectareText(landAreaM2: ProjectDetailView["scale"]["landAreaM2"]): string | null {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail.v2.spec");
  return landAreaM2 ? t("hectare", { value: formatHectares(landAreaM2, locale) }) : null;
}
