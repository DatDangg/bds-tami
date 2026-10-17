import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { ProjectDetailView } from "@/lib/projects/project-detail-view";
import { formatArea, formatNumber, formatVndCompact } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type SpecsInput = Pick<ProjectDetailView, "developer" | "categoryName" | "scale" | "handoverTime" | "areaFromM2" | "areaToM2" | "priceFromVnd">;

function areaText(from: number | null, to: number | null, locale: Locale): string | null {
  const [low, high] = [from, to].filter((value): value is number => value !== null).sort((a, b) => a - b);
  if (low === undefined) return null;
  return high === undefined || high === low ? formatArea(low, locale) : `${formatNumber(low, locale)} – ${formatArea(high, locale)}`;
}

/**
 * Lưới thông số `<dl>` (design-spec S03 khối 4): 2 cột < md, 4 cột ≥ md, không kẻ dòng. Mục không có dữ liệu bị bỏ; không còn mục nào
 * thì không render gì. Chủ đầu tư là link ra website của họ (mở tab mới) chỉ khi `website` là http(s), không thì là chữ.
 */
export function ProjectSpecs({ developer, categoryName, scale, handoverTime, areaFromM2, areaToM2, priceFromVnd }: SpecsInput) {
  const t = useTranslations("page.projectDetail.specs");
  const locale = useLocale() as Locale;
  const scaleParts = [
    scale.totalUnits ? t("units", { count: formatNumber(scale.totalUnits, locale) }) : null,
    scale.blocks ? t("blocks", { count: formatNumber(scale.blocks, locale) }) : null,
    scale.floors ? t("floors", { count: formatNumber(scale.floors, locale) }) : null,
    scale.landAreaM2 ? t("landArea", { area: formatArea(scale.landAreaM2, locale) }) : null,
  ].filter((part): part is string => part !== null);
  const area = areaText(areaFromM2, areaToM2, locale);

  const items: { key: string; label: string; value: ReactNode }[] = [
    ...(developer
      ? [
          {
            key: "developer",
            label: t("developer"),
            value: developer.website ? (
              <a href={developer.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-accent-text underline underline-offset-4 hover:text-text">
                {developer.name}
                <span className="sr-only"> {t("newTab")}</span>
              </a>
            ) : (
              developer.name
            ),
          },
        ]
      : []),
    ...(categoryName ? [{ key: "category", label: t("category"), value: categoryName }] : []),
    ...(scaleParts.length > 0 ? [{ key: "scale", label: t("scale"), value: scaleParts.join(" · ") }] : []),
    ...(area ? [{ key: "area", label: t("area"), value: area }] : []),
    ...(priceFromVnd ? [{ key: "price", label: t("price"), value: formatVndCompact(priceFromVnd, locale) }] : []),
    ...(handoverTime ? [{ key: "handover", label: t("handover"), value: handoverTime }] : []),
  ];
  if (items.length === 0) return null;

  return (
    <dl aria-label={t("label")} className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="min-w-0">
          <dt className="text-small text-text-muted">{item.label}</dt>
          <dd className="mt-1 font-display text-h4 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
