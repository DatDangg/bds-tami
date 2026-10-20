import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RichText } from "@/components/content/RichText";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { DetailGalleryHero } from "@/components/detail/DetailGalleryHero";
import { DetailLayout, DETAIL_ASIDE_CARD_CLASS } from "@/components/detail/DetailLayout";
import { DetailSection } from "@/components/detail/DetailSection";
import { DetailTitleCard } from "@/components/detail/DetailTitleCard";
import { Badge } from "@/components/ui/badge";
import { Documents } from "@/components/projects/Documents";
import { FloorPlans } from "@/components/projects/FloorPlans";
import { LegalPolicy, type PolicyBlock } from "@/components/projects/LegalPolicy";
import { PriceTable } from "@/components/projects/PriceTable";
import { ProjectAmenities } from "@/components/projects/ProjectAmenities";
import { ProjectFaq } from "@/components/projects/ProjectFaq";
import { ProjectHighlights } from "@/components/projects/ProjectHighlights";
import { ProjectListings, type ProjectListingCards } from "@/components/projects/ProjectListings";
import { ProjectLocation } from "@/components/projects/ProjectLocation";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { SimilarProjects } from "@/components/projects/SimilarProjects";
import { useProjectFacts } from "@/components/projects/use-project-facts";
import { publicPath } from "@/lib/content/content-paths";
import { formatVndCompact } from "@/lib/format";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { DOCUMENTS_DOM_ID, SECTION_DOM_ID, visibleSections, type ProjectDetailView } from "@/lib/projects/project-detail-view";
import { SALES_STATUS_BADGE_VARIANT, type ProjectCardData } from "@/lib/projects/project-view";
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
  /** URL tuyệt đối canonical cho nút chia sẻ; thiếu thì menu chỉ còn sao chép liên kết trang hiện tại. */
  shareUrl?: string;
  /** Banner tư vấn cuối trang: `<ConsultBanner />` là Server Component async nên trang dựng rồi truyền vào (như `CategoryListTemplate`). */
  consultBanner?: ReactNode;
}

/**
 * Bố cục S03 theo mockup BL-045 qua `DetailLayout sectionStyle="cards"`: ảnh lớn kiểu hero (`DetailGalleryHero`, breadcrumb kính trên ảnh) → khối tiêu đề nổi có dải thông số
 * (`DetailTitleCard`, chứa `h1`) → thanh mục con viên thuốc dính → lưới 2 cột ≥ lg (cột chính: các mục là thẻ trắng bo 20px riêng — Tổng quan, Nổi bật, Vị trí (bản đồ + tiện ích quanh), Tiện ích, Mặt bằng,
 * Pháp lý (richText + tài liệu PDF) + Chính sách, Bảng giá, Tin liên quan, Hỏi đáp; cột phải: thẻ Tư vấn 1:1 dính chứa form lead) → "Dự án tương tự" (slider, nền trắng) → banner tư vấn.
 * KHÔNG còn mục "Thư viện" (Q7): ảnh xem ở ảnh lớn + lightbox. Khối nào thiếu dữ liệu thì ẩn hẳn (cùng điều kiện với thanh mục con: `visibleSections`). Server Component;
 * phần tương tác (ảnh lớn, thanh mục con, mặt bằng, accordion, thanh dính đáy) là client.
 */
export function ProjectDetail({ doc, view, related, listings = { rentals: [], posts: [] }, hotline, ownPath, shareUrl, consultBanner }: ProjectDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail");
  const tDetail = useTranslations("page.detail");
  const tStatus = useTranslations("page.projects.salesStatus");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const turnstileSiteKey = readTurnstileSiteKey();
  const facts = useProjectFacts(view);
  const hasListings = listings.rentals.length > 0 || listings.posts.length > 0;
  const sections = visibleSections(view, { hasListings });
  const shown = new Set(sections);

  const policyBlocks: PolicyBlock[] = [
    ...(shown.has("legal")
      ? [
          {
            id: SECTION_DOM_ID.legal,
            anchorIds: [DOCUMENTS_DOM_ID],
            eyebrow: tDetail("eyebrow.legal"),
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
      ? [{ id: SECTION_DOM_ID.policy, eyebrow: tDetail("eyebrow.policy"), title: t("sections.policy"), content: <RichText data={doc.salesPolicy} locale={locale} tableLabel={tRich("table")} /> }]
      : []),
  ];

  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        sectionStyle="cards"
        before={
          <>
            <DetailGalleryHero
              images={view.gallery}
              breadcrumb={
                <Breadcrumb
                  variant="overlay"
                  items={[
                    { label: tNav("projects"), href: publicPath("/du-an", locale) },
                    { label: view.title, href: ownPath },
                  ]}
                />
              }
            />
            <DetailTitleCard
              eyebrow={view.categoryName}
              badge={<Badge variant={SALES_STATUS_BADGE_VARIANT[view.salesStatus]}>{tStatus(view.salesStatus)}</Badge>}
              title={view.title}
              location={view.areaLabel}
              {...(view.priceFromVnd ? { priceLabel: tDetail("priceFrom") } : {})}
              price={view.priceFromVnd ? formatVndCompact(view.priceFromVnd, locale) : t("price.contact")}
              facts={facts}
              factsLabel={t("facts.label")}
              shareTitle={view.title}
              {...(shareUrl ? { shareUrl } : {})}
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
            <SimilarProjects projects={related} />
            {/* Banner cuối trang: nút chính cuộn tới thẻ Tư vấn (form lead duy nhất), không nhân đôi form. */}
            {consultBanner}
          </>
        }
      >
        <ProjectOverview view={view} overview={doc.overview} />
        {shown.has("highlights") && <ProjectHighlights highlights={view.highlights} />}
        {shown.has("location") && <ProjectLocation projectName={view.title} location={view.location} address={view.address} areaLabel={view.areaLabel} nearby={view.nearby} />}
        {shown.has("amenities") && <ProjectAmenities amenities={view.amenities} />}
        {shown.has("floorPlans") && (
          <DetailSection id={SECTION_DOM_ID.floorPlans} eyebrow={tDetail("eyebrow.floorPlans")} title={t("sections.floorPlans")}>
            <FloorPlans plans={view.floorPlans} />
          </DetailSection>
        )}
        {policyBlocks.length > 0 && (
          <div className="rounded-[20px] bg-surface p-5 md:p-8">
            <LegalPolicy blocks={policyBlocks} />
          </div>
        )}
        {shown.has("pricing") && <PriceTable rows={view.priceRows} updatedAt={view.priceUpdatedAt} />}
        <ProjectListings {...listings} />
        {shown.has("faq") && <ProjectFaq faqs={view.faqs} />}
      </DetailLayout>
      <ClickRefMarker collection="projects" id={doc.id} />
      <ProjectStickyCta />
    </article>
  );
}
