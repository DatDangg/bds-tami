import { useLocale, useTranslations } from "next-intl";
import { Buildings, Clock, Ruler, ShieldCheck } from "@/components/icons";
import type { DetailFact } from "@/components/detail/DetailTitleCard";
import { formatArea, formatNumber } from "@/lib/format";
import type { ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { Locale } from "@/i18n/routing";

const ICON_SIZE = 22;

/**
 * Dải thông số trong khối tiêu đề chi tiết Dự án (BL-045 #5): quy mô (diện tích đất), số sản phẩm, chủ đầu tư, bàn giao. Ô thiếu dữ liệu bị bỏ, không hiện "—".
 * Hook (dùng `useTranslations`/`useLocale`) nên chỉ gọi trong component.
 */
export function useProjectFacts({ scale, developer, handoverTime }: Pick<ProjectDetailView, "scale" | "developer" | "handoverTime">): DetailFact[] {
  const t = useTranslations("page.projectDetail.facts");
  const locale = useLocale() as Locale;
  return [
    ...(scale.landAreaM2 ? [{ icon: <Ruler size={ICON_SIZE} aria-hidden="true" />, label: t("scale"), value: formatArea(scale.landAreaM2, locale) }] : []),
    ...(scale.totalUnits ? [{ icon: <Buildings size={ICON_SIZE} aria-hidden="true" />, label: t("units"), value: t("unitsValue", { count: formatNumber(scale.totalUnits, locale) }) }] : []),
    ...(developer ? [{ icon: <ShieldCheck size={ICON_SIZE} aria-hidden="true" />, label: t("developer"), value: developer.name }] : []),
    ...(handoverTime ? [{ icon: <Clock size={ICON_SIZE} aria-hidden="true" />, label: t("handover"), value: handoverTime }] : []),
  ];
}
