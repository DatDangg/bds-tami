import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { Gallery } from "@/components/media/Gallery";
import { Documents } from "@/components/projects/Documents";
import { FloorPlans } from "@/components/projects/FloorPlans";
import { LegalPolicy, type PolicyBlock } from "@/components/projects/LegalPolicy";
import { ProjectAmenities } from "@/components/projects/ProjectAmenities";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectLocation } from "@/components/projects/ProjectLocation";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectSection } from "@/components/projects/ProjectSection";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { ProjectSubNav } from "@/components/projects/ProjectSubNav";
import { publicPath } from "@/lib/content/content-paths";
import { SECTION_DOM_ID, visibleSections, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { ProjectCardData } from "@/lib/projects/project-view";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/payload-types";

interface ProjectDetailProps {
  doc: Pick<Project, "id" | "overview" | "legalInfo" | "salesPolicy">;
  view: ProjectDetailView;
  related: ProjectCardData[];
  /** Hotline chung của site (khối form chưa có form thật thì hướng khách gọi). */
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
}

/**
 * Bố cục S03 theo thứ tự design-spec: hero → breadcrumb → thanh mục con dính → Tổng quan → Vị trí → Tiện ích → Mặt bằng → Pháp lý +
 * Chính sách → Thư viện (khối tối duy nhất) → Tài liệu → Form lead → Dự án khác. Khối nào thiếu dữ liệu thì ẩn hẳn (cùng điều kiện
 * với thanh mục con: `visibleSections`). `h1` chỉ ở hero. Server Component; phần tương tác (thanh mục con, mặt bằng, accordion, thanh dính đáy) là client.
 */
export function ProjectDetail({ doc, view, related, hotline, ownPath }: ProjectDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const sections = visibleSections(view);
  const shown = new Set(sections);

  const policyBlocks: PolicyBlock[] = [
    ...(view.hasLegal
      ? [{ id: SECTION_DOM_ID.legal, title: t("sections.legal"), content: <RichText data={doc.legalInfo} locale={locale} tableLabel={tRich("table")} /> }]
      : []),
    ...(view.hasPolicy
      ? [{ id: SECTION_DOM_ID.policy, title: t("sections.policy"), content: <RichText data={doc.salesPolicy} locale={locale} tableLabel={tRich("table")} /> }]
      : []),
  ];

  return (
    <article className="pb-16 lg:pb-0">
      <ProjectHero title={view.title} salesStatus={view.salesStatus} areaLabel={view.areaLabel} image={view.hero} hasDocuments={view.documents.length > 0} />
      <Breadcrumb
        className="py-2"
        items={[
          { label: tNav("projects"), href: publicPath("/du-an", locale) },
          { label: view.title, href: ownPath },
        ]}
      />
      <ProjectSubNav items={sections.map((id) => ({ id: SECTION_DOM_ID[id], label: t(`subNav.${id}`) }))} />
      <ProjectOverview view={view} overview={doc.overview} />
      {shown.has("location") && <ProjectLocation projectName={view.title} location={view.location} address={view.address} areaLabel={view.areaLabel} />}
      {shown.has("amenities") && <ProjectAmenities amenities={view.amenities} />}
      {shown.has("floorPlans") && (
        <ProjectSection id={SECTION_DOM_ID.floorPlans} title={t("sections.floorPlans")} tone="alt">
          <FloorPlans plans={view.floorPlans} />
        </ProjectSection>
      )}
      {policyBlocks.length > 0 && (
        <div className="bg-bg py-section-tight">
          <div className="mx-auto w-full max-w-container px-gutter">
            <LegalPolicy blocks={policyBlocks} />
          </div>
        </div>
      )}
      {shown.has("gallery") && (
        <ProjectSection id={SECTION_DOM_ID.gallery} title={t("sections.gallery")} tone="dark">
          {/* Ảnh LCP của trang là ảnh hero (cùng ảnh đầu thư viện): thư viện ở đây lazy. */}
          <Gallery images={view.gallery} />
        </ProjectSection>
      )}
      <Documents documents={view.documents} />
      <div className="bg-bg py-section-tight">
        <div className="mx-auto w-full max-w-container px-gutter">
          <LeadFormSlot
            title={t("leadForm.title")}
            className="scroll-mt-30 lg:scroll-mt-32"
            fallback={
              <div className="flex flex-col gap-3">
                <p className="max-w-[60ch] text-body text-text-secondary">{t("leadForm.fallback")}</p>
                {hotline && (
                  <p>
                    <span className="text-small text-text-muted">{t("leadForm.hotline")}: </span>
                    <a href={hotline.telHref} className="inline-flex min-h-11 items-center font-display text-h3 text-accent-text underline underline-offset-4">
                      {hotline.label}
                    </a>
                  </p>
                )}
              </div>
            }
          />
        </div>
      </div>
      {related.length > 0 && (
        <section aria-labelledby="related-projects" className="bg-bg-alt py-section-tight">
          <div className="mx-auto w-full max-w-container px-gutter">
            <h2 id="related-projects" className="mb-8 font-display text-h2">
              {t("relatedTitle")}
            </h2>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((card) => (
                <li key={card.id}>
                  <ProjectCard data={card} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <ClickRefMarker collection="projects" id={doc.id} />
      <ProjectStickyCta />
    </article>
  );
}
