import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { DetailInfoGrid, type DetailInfoItem } from "@/components/detail/DetailInfoGrid";
import { DetailSection } from "@/components/detail/DetailSection";
import { DetailStatCards } from "@/components/detail/DetailStatCards";
import { Briefcase, Buildings, CalendarCheck, House, MapPin, SquaresFour } from "@/components/icons";
import { formatNumber } from "@/lib/format";
import { formatAreaRange, formatHectares, SECTION_DOM_ID, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/payload-types";

const ICON_SIZE = 20;

interface ProjectOverviewProps {
  view: ProjectDetailView;
  overview: Project["overview"];
}

/** Quy mô trong lưới thông tin: diện tích đất (ha) · tổng căn · số tòa · số tầng — phần nào có thì hiện. */
function useScaleText({ scale }: Pick<ProjectDetailView, "scale">): string | null {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail");
  const parts = [
    scale.landAreaM2 ? t("v2.spec.hectare", { value: formatHectares(scale.landAreaM2, locale) }) : null,
    scale.totalUnits ? t("facts.unitsValue", { count: formatNumber(scale.totalUnits, locale) }) : null,
    scale.blocks ? t("specs.blocks", { count: formatNumber(scale.blocks, locale) }) : null,
    scale.floors ? t("specs.floors", { count: formatNumber(scale.floors, locale) }) : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Khối Tổng quan (BL-052, design `detail-du-an`; nằm cạnh cột liên hệ ≥ lg): eyebrow "Giới thiệu" + `h2` → `overview` richText (chưa có thì `summary`)
 * → lưới thông tin (Tên thương mại, Chủ đầu tư — link website khi có, Vị trí, Quy mô, Loại hình, Bàn giao; ô trống bị bỏ) cạnh thẻ Sản phẩm (≥ xl hai cột; không có sản phẩm → lưới rộng hết).
 * Server Component, không đọc DB.
 */
export function ProjectOverview({ view, overview }: ProjectOverviewProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail.v2");
  const tType = useTranslations("listingOptions.propertyType");
  const tRich = useTranslations("page.richText");
  const scaleText = useScaleText(view);
  const info: DetailInfoItem[] = [
    { icon: <Buildings size={ICON_SIZE} />, label: t("info.name"), value: view.title },
    {
      icon: <Briefcase size={ICON_SIZE} />,
      label: t("info.developer"),
      value: view.developer?.name ?? null,
      link: view.developer?.website ? { href: view.developer.website, newTabLabel: t("info.newTab") } : null,
    },
    { icon: <MapPin size={ICON_SIZE} />, label: t("info.location"), value: view.areaLabel ?? view.address },
    { icon: <SquaresFour size={ICON_SIZE} />, label: t("info.scale"), value: scaleText },
    { icon: <House size={ICON_SIZE} />, label: t("info.propertyTypes"), value: view.productTypes.map((type) => tType(type)).join(", ") },
    { icon: <CalendarCheck size={ICON_SIZE} />, label: t("info.handover"), value: view.handoverTime },
  ];
  const stats = view.products.map((product) => ({
    value: product.count === null ? null : formatNumber(product.count, locale),
    label: product.type,
    note: formatAreaRange(product.areaFrom, product.areaTo, locale),
  }));
  return (
    <DetailSection id={SECTION_DOM_ID.overview} eyebrow={t("eyebrow.overview")} title={t("titles.overview")}>
      <div className="flex flex-col gap-8">
        {view.hasOverview ? (
          <RichText data={overview} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        ) : (
          view.summary && <p className="max-w-[68ch] text-body text-text-secondary">{view.summary}</p>
        )}
        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
          <DetailInfoGrid items={info} label={t("info.label")} className={stats.length === 0 ? "xl:col-span-2" : undefined} />
          <DetailStatCards items={stats} label={t("products.label")} />
        </div>
      </div>
    </DetailSection>
  );
}
