import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { CtaBanner } from "@/components/layout/CtaBanner";
import { Gallery } from "@/components/media/Gallery";
import { Documents } from "@/components/projects/Documents";
import { FloorPlans } from "@/components/projects/FloorPlans";
import { LegalPolicy, type PolicyBlock } from "@/components/projects/LegalPolicy";
import { ProjectAmenities } from "@/components/projects/ProjectAmenities";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectListings, type ProjectListingCards } from "@/components/projects/ProjectListings";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectLocation } from "@/components/projects/ProjectLocation";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectSection } from "@/components/projects/ProjectSection";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { ProjectSubNav } from "@/components/projects/ProjectSubNav";
import { publicPath } from "@/lib/content/content-paths";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { LEAD_FORM_DOM_ID, SECTION_DOM_ID, visibleSections, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { ProjectCardData } from "@/lib/projects/project-view";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/payload-types";

/** Id tiêu đề thẻ Tư vấn: nhãn cho `aside` (một thẻ duy nhất mỗi trang). */
const CONSULT_HEADING_ID = "project-consult-heading";
/**
 * Thẻ "Tư vấn 1:1" (trắng, bo 20px). ≥ lg dính ngay dưới header nổi + thanh mục con (top = 6.5rem + 4.5rem); cao tối đa bằng phần viewport còn lại và tự cuộn bên trong nếu
 * form dài hơn, nên không bao giờ kẹt dính / che nội dung (cột phải có bề rộng riêng).
 */
const CONSULT_CARD_CLASS =
  "rounded-[20px] border border-border bg-surface p-6 shadow-md lg:sticky lg:top-[calc(var(--header-offset)+4.5rem)] lg:max-h-[calc(100dvh-var(--header-offset)-5.5rem)] lg:overflow-y-auto lg:p-6 scroll-mt-[calc(var(--header-offset)+4.5rem)]";

interface ProjectDetailProps {
  doc: Pick<Project, "id" | "overview" | "legalInfo" | "salesPolicy">;
  view: ProjectDetailView;
  related: ProjectCardData[];
  /** Tin cho thuê + tin BĐS thuộc dự án (đã lọc công khai/ngôn ngữ ở truy vấn); bỏ trống = không có khối "Tin liên quan". */
  listings?: ProjectListingCards;
  /** Hotline chung của site (khối form chưa có form thật thì hướng khách gọi). */
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
}

/**
 * Bố cục S03 theo thứ tự design-spec: hero → breadcrumb → thanh mục con viên thuốc dính → lưới 2 cột ≥ lg (cột chính: Tổng quan → Vị trí → Tiện ích → Mặt bằng → Pháp lý +
 * Chính sách → Thư viện (thẻ tối duy nhất) → Tài liệu → Tin liên quan; cột phải: thẻ Tư vấn 1:1 dính chứa form lead) → Dự án khác → CTA "Đăng ký tham quan" (banner tối). Khối nào thiếu dữ liệu thì ẩn hẳn (cùng điều kiện
 * với thanh mục con: `visibleSections`). `h1` chỉ ở hero. Server Component; phần tương tác (thanh mục con, mặt bằng, accordion, thanh dính đáy) là client.
 */
export function ProjectDetail({ doc, view, related, listings = { rentals: [], posts: [] }, hotline, ownPath }: ProjectDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const turnstileSiteKey = readTurnstileSiteKey();
  const hasListings = listings.rentals.length > 0 || listings.posts.length > 0;
  const sections = visibleSections(view, { hasListings });
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
      <div className="mx-auto w-full max-w-container px-gutter lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-12">
        <div className="min-w-0">
          <ProjectOverview view={view} overview={doc.overview} />
          {shown.has("location") && <ProjectLocation projectName={view.title} location={view.location} address={view.address} areaLabel={view.areaLabel} />}
          {shown.has("amenities") && <ProjectAmenities amenities={view.amenities} />}
          {shown.has("floorPlans") && (
            <ProjectSection id={SECTION_DOM_ID.floorPlans} title={t("sections.floorPlans")}>
              <FloorPlans plans={view.floorPlans} />
            </ProjectSection>
          )}
          {policyBlocks.length > 0 && (
            <div className="border-t border-border py-section-tight">
              <LegalPolicy blocks={policyBlocks} />
            </div>
          )}
          {shown.has("gallery") && (
            <ProjectSection id={SECTION_DOM_ID.gallery} title={t("sections.gallery")} tone="dark">
              {/* Ảnh LCP của trang là ảnh hero (cùng ảnh đầu thư viện): thư viện ở đây lazy. */}
              <Gallery images={view.gallery} />
            </ProjectSection>
          )}
          <Documents documents={view.documents} />
          <ProjectListings {...listings} />
        </div>
        {/* Cột phải ≥ lg; < lg nằm dưới nội dung (đúng chỗ form cũ). Form chỉ có MỘT bản trong DOM (không nhân đôi id). Chỉ thẻ bên trong dính (sticky trong chiều cao cột). */}
        <aside aria-labelledby={CONSULT_HEADING_ID} className="border-t border-border py-section-tight lg:border-t-0">
          <LeadFormSlot title={t("leadForm.title")} headingId={CONSULT_HEADING_ID} className={CONSULT_CARD_CLASS}>
            <div className="flex flex-col gap-4">
              {hotline && (
                <p>
                  <span className="text-small text-text-muted">{t("leadForm.hotline")}: </span>
                  <a href={hotline.telHref} className="inline-flex min-h-11 items-center font-display text-h3 text-accent-text underline underline-offset-4">
                    {hotline.label}
                  </a>
                </p>
              )}
              <LeadForm source="project" sourceId={doc.id} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
            </div>
          </LeadFormSlot>
        </aside>
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
      {/* CTA cuối trang: cuộn tới thẻ Tư vấn (form lead duy nhất), không nhân đôi form. */}
      <CtaBanner
        title={t("visitCta.title")}
        description={t("visitCta.description")}
        actionLabel={t("visitCta.button")}
        actionHref={`#${LEAD_FORM_DOM_ID}`}
        {...(hotline ? { secondaryLabel: `${t("visitCta.hotline")}: ${hotline.label}`, secondaryHref: hotline.telHref } : {})}
      />
      <ClickRefMarker collection="projects" id={doc.id} />
      <ProjectStickyCta />
    </article>
  );
}
