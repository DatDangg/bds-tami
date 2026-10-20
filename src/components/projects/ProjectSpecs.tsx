import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { ProjectDetailView } from "@/lib/projects/project-detail-view";
import { formatArea, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type SpecsInput = Pick<ProjectDetailView, "developer" | "scale" | "areaFromM2" | "areaToM2">;

function areaText(from: number | null, to: number | null, locale: Locale): string | null {
  const [low, high] = [from, to].filter((value): value is number => value !== null).sort((a, b) => a - b);
  if (low === undefined) return null;
  return high === undefined || high === low ? formatArea(low, locale) : `${formatNumber(low, locale)} – ${formatArea(high, locale)}`;
}

/**
 * Lưới thông số còn lại trong mục Tổng quan (BL-045): quy mô/số sản phẩm/chủ đầu tư/bàn giao đã lên dải thông số của khối tiêu đề nên ở đây chỉ còn số tòa/tầng, diện tích và link website chủ đầu tư (khi có);
 * loại hình và giá từ đã nằm ở khối tiêu đề nên không lặp lại. 2 cột < md, 4 cột ≥ md. Mục không có dữ liệu bị bỏ; không còn mục nào thì không render gì. Link website mở tab mới, chỉ khi http(s).
 */
export function ProjectSpecs({ developer, scale, areaFromM2, areaToM2 }: SpecsInput) {
  const t = useTranslations("page.projectDetail.specs");
  const locale = useLocale() as Locale;
  const scaleParts = [
    scale.blocks ? t("blocks", { count: formatNumber(scale.blocks, locale) }) : null,
    scale.floors ? t("floors", { count: formatNumber(scale.floors, locale) }) : null,
  ].filter((part): part is string => part !== null);
  const area = areaText(areaFromM2, areaToM2, locale);

  const items: { key: string; label: string; value: ReactNode }[] = [
    // Tên chủ đầu tư đã nằm trong dải thông số của khối tiêu đề: ở đây chỉ còn khi có website để bấm tới.
    ...(developer?.website
      ? [
          {
            key: "developer",
            label: t("developer"),
            value: (
              <a href={developer.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-accent-text underline underline-offset-4 hover:text-text">
                {developer.name}
                <span className="sr-only"> {t("newTab")}</span>
              </a>
            ),
          },
        ]
      : []),
    ...(scaleParts.length > 0 ? [{ key: "scale", label: t("scale"), value: scaleParts.join(" · ") }] : []),
    ...(area ? [{ key: "area", label: t("area"), value: area }] : []),
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
