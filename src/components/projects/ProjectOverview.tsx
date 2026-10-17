import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { SECTION_DOM_ID, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/payload-types";
import { ProjectSection } from "./ProjectSection";
import { ProjectSpecs } from "./ProjectSpecs";

interface ProjectOverviewProps {
  view: ProjectDetailView;
  overview: Project["overview"];
}

/**
 * Khối Tổng quan (S03 khối 4): lưới thông số + `overview` richText (`max-width: 68ch`). Chưa có `overview` thì hiện `summary` thay
 * (dự án mới xuất bản chỉ có mô tả ngắn). Server Component, không đọc DB.
 */
export function ProjectOverview({ view, overview }: ProjectOverviewProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail");
  const tRich = useTranslations("page.richText");
  return (
    <ProjectSection id={SECTION_DOM_ID.overview} title={t("sections.overview")}>
      <div className="flex flex-col gap-10">
        <ProjectSpecs {...view} />
        {view.hasOverview ? (
          <RichText data={overview} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        ) : (
          view.summary && <p className="max-w-[68ch] text-body text-text-secondary">{view.summary}</p>
        )}
      </div>
    </ProjectSection>
  );
}
