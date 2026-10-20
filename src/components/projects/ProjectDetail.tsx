import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { CtaBanner } from "@/components/layout/CtaBanner";
import { Gallery } from "@/components/media/Gallery";
import { DetailLayout, DETAIL_ASIDE_CARD_CLASS } from "@/components/detail/DetailLayout";
import { DetailSection } from "@/components/detail/DetailSection";
import { Documents } from "@/components/projects/Documents";
import { FloorPlans } from "@/components/projects/FloorPlans";
import { LegalPolicy, type PolicyBlock } from "@/components/projects/LegalPolicy";
import { PriceTable } from "@/components/projects/PriceTable";
import { ProjectAmenities } from "@/components/projects/ProjectAmenities";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFaq } from "@/components/projects/ProjectFaq";
import { ProjectHighlights } from "@/components/projects/ProjectHighlights";
import { ProjectListings, type ProjectListingCards } from "@/components/projects/ProjectListings";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectLocation } from "@/components/projects/ProjectLocation";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { publicPath } from "@/lib/content/content-paths";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { DOCUMENTS_DOM_ID, LEAD_FORM_DOM_ID, SECTION_DOM_ID, visibleSections, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import type { ProjectCardData } from "@/lib/projects/project-view";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/payload-types";

/** Id tiêu đề thẻ Tư vấn: nhãn cho `aside` (một thẻ duy nhất mỗi trang). */
const CONSULT_HEADING_ID = "project-consult-heading";

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
 * Bố cục S03 qua `DetailLayout` dùng chung: hero → breadcrumb → thanh mục con viên thuốc dính → lưới 2 cột ≥ lg (cột chính là MỘT thẻ trắng bo lớn: Tổng quan → Điểm nổi bật → Vị trí (bản đồ + tiện ích quanh) → Tiện ích →
 * Mặt bằng → Pháp lý (richText + tài liệu PDF) + Chính sách → Bảng giá → Thư viện (thẻ tối duy nhất) → Tin liên quan → FAQ; cột phải: thẻ Tư vấn 1:1 dính chứa form lead) → Dự án khác → CTA "Đăng ký tham quan" (banner tối). Khối nào thiếu dữ liệu thì ẩn hẳn (cùng điều kiện
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
    ...(shown.has("legal")
      ? [
          {
            id: SECTION_DOM_ID.legal,
            anchorIds: [DOCUMENTS_DOM_ID],
            title: t("sections.legal"),
            // Pháp lý gộp richText + danh sách PDF; một trong hai có là đủ dựng khối.
            content: (
              <div className="flex flex-col gap-8">
                {view.hasLegal && <RichText data={doc.legalInfo} locale={locale} tableLabel={tRich("table")} />}
                <Documents documents={view.documents} />
              </div>
            ),
          },
        ]
      : []),
    ...(view.hasPolicy
      ? [{ id: SECTION_DOM_ID.policy, title: t("sections.policy"), content: <RichText data={doc.salesPolicy} locale={locale} tableLabel={tRich("table")} /> }]
      : []),
  ];

  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        before={
          <>
            <ProjectHero title={view.title} salesStatus={view.salesStatus} areaLabel={view.areaLabel} image={view.hero} hasDocuments={view.documents.length > 0} />
            <Breadcrumb
              className="py-2"
              items={[
                { label: tNav("projects"), href: publicPath("/du-an", locale) },
                { label: view.title, href: ownPath },
              ]}
            />
          </>
        }
        subNav={{ items: sections.map((id) => ({ id: SECTION_DOM_ID[id], label: t(`subNav.${id}`) })), label: t("subNavLabel") }}
        asideLabelledBy={CONSULT_HEADING_ID}
        aside={
          <LeadFormSlot title={t("leadForm.title")} headingId={CONSULT_HEADING_ID} className={DETAIL_ASIDE_CARD_CLASS}>
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
        }
        after={
          <>
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
          </>
        }
      >
        <ProjectOverview view={view} overview={doc.overview} />
        {shown.has("highlights") && <ProjectHighlights highlights={view.highlights} />}
        {shown.has("location") && <ProjectLocation projectName={view.title} location={view.location} address={view.address} areaLabel={view.areaLabel} nearby={view.nearby} />}
        {shown.has("amenities") && <ProjectAmenities amenities={view.amenities} />}
        {shown.has("floorPlans") && (
          <DetailSection id={SECTION_DOM_ID.floorPlans} title={t("sections.floorPlans")}>
            <FloorPlans plans={view.floorPlans} />
          </DetailSection>
        )}
        {policyBlocks.length > 0 && (
          <div className="border-t border-border py-section-tight">
            <LegalPolicy blocks={policyBlocks} />
          </div>
        )}
        {shown.has("pricing") && <PriceTable rows={view.priceRows} updatedAt={view.priceUpdatedAt} />}
        {shown.has("gallery") && (
          <DetailSection id={SECTION_DOM_ID.gallery} title={t("sections.gallery")} tone="dark">
            {/* Ảnh LCP của trang là ảnh hero (cùng ảnh đầu thư viện): thư viện ở đây lazy. */}
            <Gallery images={view.gallery} />
          </DetailSection>
        )}
        <ProjectListings {...listings} />
        {shown.has("faq") && <ProjectFaq faqs={view.faqs} />}
      </DetailLayout>
      <ClickRefMarker collection="projects" id={doc.id} />
      <ProjectStickyCta />
    </article>
  );
}
