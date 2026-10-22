import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RichText } from "@/components/content/RichText";
import { DetailContactAside } from "@/components/detail/DetailContactAside";
import { DetailGalleryGrid } from "@/components/detail/DetailGalleryGrid";
import { DetailHeroMosaic } from "@/components/detail/DetailHeroMosaic";
import { DetailPageShell, type DetailBand } from "@/components/detail/DetailPageShell";
import { DetailSection } from "@/components/detail/DetailSection";
import { DETAIL_ICON_SIZE as ICON_SIZE } from "@/components/detail/detail-icon-size";
import { DetailSpecBar, type DetailSpecItem } from "@/components/detail/DetailSpecBar";
import { SimilarCarousel } from "@/components/detail/SimilarCarousel";
import { StrengthsBlock } from "@/components/home/StrengthsBlock";
import { Buildings, CalendarCheck, House, Ruler, SquaresFour, Tag } from "@/components/icons";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { Badge } from "@/components/ui/badge";
import { Documents } from "@/components/projects/Documents";
import { FloorPlans } from "@/components/projects/FloorPlans";
import { LegalPolicy, type PolicyBlock } from "@/components/projects/LegalPolicy";
import { PriceTable } from "@/components/projects/PriceTable";
import { ProjectAmenities } from "@/components/projects/ProjectAmenities";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFaq } from "@/components/projects/ProjectFaq";
import { ProjectHighlights } from "@/components/projects/ProjectHighlights";
import { ProjectListings, type ProjectListingCards } from "@/components/projects/ProjectListings";
import { ProjectLocation } from "@/components/projects/ProjectLocation";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { useHectareText, useProductTypesText } from "@/components/projects/project-labels";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { publicPath } from "@/lib/content/content-paths";
import { formatVndCompact } from "@/lib/format";
import type { StrengthsView } from "@/lib/home/home-view";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import {
  DOCUMENTS_DOM_ID,
  formatAreaRange,
  SECTION_DOM_ID,
  visibleSections,
  type ProjectDetailView,
  type SectionId,
} from "@/lib/projects/project-detail-view";
import type { ProjectCardData } from "@/lib/projects/project-view";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/payload-types";

/** Id tiêu đề thẻ form ở cột phải: nhãn cho `aside` (một thẻ duy nhất mỗi trang). */
const CONSULT_HEADING_ID = "project-consult-heading";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const SIMILAR_IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * Badge tình trạng trên hero nền tối (`theme-dark-block`): `neutral` (nền `surface-muted` + chữ token → chữ trắng trên nền sáng) mất tương phản ở đó,
 * nên "Đã bàn giao" dùng `dark` viền sáng; hai trạng thái còn lại giữ như thẻ dự án.
 */
const HERO_STATUS_VARIANT = { upcoming: "primary", selling: "success", handed_over: "dark" } as const satisfies Record<Project["salesStatus"], string>;

interface ProjectDetailProps {
  doc: Pick<Project, "id" | "overview" | "legalInfo" | "salesPolicy">;
  view: ProjectDetailView;
  related: ProjectCardData[];
  /** Tin cho thuê + tin BĐS thuộc dự án (đã lọc công khai/ngôn ngữ ở truy vấn); bỏ trống = không có khối "Tin liên quan". */
  listings?: ProjectListingCards;
  /** Hotline chung của site: khối "Gọi ngay" dưới form + lối liên hệ trong form. Không có → ẩn khối. */
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** Dải Điểm mạnh (cờ `showProjectStrengths`, dùng chung với `/du-an`); `null` → không dải. */
  strengths?: StrengthsView | null;
  /** Banner tư vấn cuối trang: `<ConsultBanner />` là Server Component async nên trang dựng rồi truyền vào (như `CategoryListTemplate`). */
  consultBanner?: ReactNode;
}

/** Thanh thông số nổi: Giá từ · Quy mô (ha) · Diện tích · Chủ đầu tư · Bàn giao · Loại hình (không ô Pháp lý); ô trống bị bỏ. */
function useProjectSpecItems(view: ProjectDetailView): DetailSpecItem[] {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail.v2.spec");
  return [
    { icon: <Tag size={ICON_SIZE} />, label: t("priceFrom"), value: view.displayPriceFromVnd ? formatVndCompact(view.displayPriceFromVnd, locale) : t("contact") },
    { icon: <SquaresFour size={ICON_SIZE} />, label: t("scale"), value: useHectareText(view.scale.landAreaM2) },
    { icon: <Ruler size={ICON_SIZE} />, label: t("area"), value: formatAreaRange(view.areaFromM2, view.areaToM2, locale) },
    { icon: <Buildings size={ICON_SIZE} />, label: t("developer"), value: view.developer?.name ?? null },
    { icon: <CalendarCheck size={ICON_SIZE} />, label: t("handover"), value: view.handoverTime },
    { icon: <House size={ICON_SIZE} />, label: t("propertyTypes"), value: useProductTypesText(view.productTypes) },
  ];
}

/** Pháp lý + Chính sách là MỘT dải và MỘT tab ("Pháp lý & chính sách" khi có cả hai), tab trỏ khối đầu tiên có mặt; `#legal` / `#sales-policy` / `#documents` giữ nguyên. */
function useProjectTabs(sections: SectionId[]) {
  const t = useTranslations("page.projectDetail.v2.tabs");
  const shown = new Set<SectionId>(sections);
  return sections.flatMap((id) => {
    if (id === "policy" && shown.has("legal")) return [];
    const label = id === "legal" && shown.has("policy") ? t("legalPolicy") : t(id);
    return [{ id: SECTION_DOM_ID[id], label }];
  });
}

/** Khối Pháp lý (richText + danh sách PDF, neo `#documents`; một trong hai có là đủ) và Chính sách bán hàng — khối nào có trong `shown` thì dựng. */
function usePolicyBlocks(doc: ProjectDetailProps["doc"], view: ProjectDetailView, shown: ReadonlySet<SectionId>): PolicyBlock[] {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail.sections");
  const tEyebrow = useTranslations("page.detail.eyebrow");
  const tRich = useTranslations("page.richText");
  const legal: PolicyBlock = {
    id: SECTION_DOM_ID.legal,
    anchorIds: [DOCUMENTS_DOM_ID],
    eyebrow: tEyebrow("legal"),
    title: t("legal"),
    content: (
      <div className="flex flex-col gap-8">
        {view.hasLegal && <RichText data={doc.legalInfo} locale={locale} tableLabel={tRich("table")} />}
        <Documents documents={view.documents} />
      </div>
    ),
  };
  const policy: PolicyBlock = { id: SECTION_DOM_ID.policy, eyebrow: tEyebrow("policy"), title: t("policy"), content: <RichText data={doc.salesPolicy} locale={locale} tableLabel={tRich("table")} /> };
  return [...(shown.has("legal") ? [legal] : []), ...(shown.has("policy") ? [policy] : [])];
}

/** Các dải rộng hết khung theo thứ tự `sections` (Vị trí · Tiện ích · Hình ảnh · Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp). */
function useProjectBands(doc: ProjectDetailProps["doc"], view: ProjectDetailView, sections: SectionId[], listings: ProjectListingCards): DetailBand[] {
  const t = useTranslations("page.projectDetail");
  const tEyebrow = useTranslations("page.detail.eyebrow");
  const shown = new Set<SectionId>(sections);
  const policyBlocks = usePolicyBlocks(doc, view, shown);
  const bandContent: Partial<Record<SectionId, ReactNode>> = {
    location: <ProjectLocation projectName={view.title} location={view.location} address={view.address} areaLabel={view.areaLabel} nearby={view.nearby} locationMedia={view.locationMedia} />,
    amenities: <ProjectAmenities amenities={view.amenities} image={view.amenitiesImage} />,
    gallery: (
      <DetailSection id={SECTION_DOM_ID.gallery} eyebrow={t("v2.eyebrow.gallery")} title={t("v2.titles.gallery")} description={t("v2.galleryDescription", { name: view.title })}>
        <DetailGalleryGrid images={view.gallery} />
      </DetailSection>
    ),
    highlights: <ProjectHighlights highlights={view.highlights} />,
    floorPlans: (
      <DetailSection id={SECTION_DOM_ID.floorPlans} eyebrow={tEyebrow("floorPlans")} title={t("sections.floorPlans")}>
        <FloorPlans plans={view.floorPlans} />
      </DetailSection>
    ),
    pricing: <PriceTable rows={view.priceRows} updatedAt={view.priceUpdatedAt} />,
    // Một dải cho cả Pháp lý lẫn Chính sách (≥ xl hai cột như trước); dải tự chừa lề dọc vì `LegalPolicy` dựng `section` riêng, không qua `DetailSection`.
    legal: (
      <div className="py-section-tight">
        <LegalPolicy blocks={policyBlocks} />
      </div>
    ),
    listings: <ProjectListings {...listings} />,
    faq: <ProjectFaq faqs={view.faqs} />,
  };
  return sections.flatMap((id) => {
    const content = id === "policy" && !shown.has("legal") ? bandContent.legal : bandContent[id];
    return content ? [{ key: id, content }] : [];
  });
}

/** Hero ảnh: breadcrumb (Dự án › tên), badge danh mục + tình trạng, `h1`, địa chỉ, mô tả ngắn, nút video khi có `videoUrl`. */
function ProjectHero({ view, ownPath }: Pick<ProjectDetailProps, "view" | "ownPath">) {
  const locale = useLocale() as Locale;
  const tStatus = useTranslations("page.projects.salesStatus");
  const tNav = useTranslations("layout.nav.items");
  return (
    <DetailHeroMosaic
      images={view.gallery}
      title={view.title}
      breadcrumb={
        <Breadcrumb
          variant="overlay"
          items={[
            { label: tNav("projects"), href: publicPath("/du-an", locale) },
            { label: view.title, href: ownPath },
          ]}
        />
      }
      badges={
        <>
          {view.categoryName && (
            <span className="inline-flex items-center rounded-pill border border-on-dark/50 bg-dark-deep/30 px-2.5 py-1 text-xsmall font-medium tracking-[0.06em] text-on-dark uppercase">
              {view.categoryName}
            </span>
          )}
          <Badge variant={HERO_STATUS_VARIANT[view.salesStatus]} className={cn(view.salesStatus === "handed_over" && "border border-on-dark/40")}>
            {tStatus(view.salesStatus)}
          </Badge>
        </>
      }
      address={view.areaLabel ?? view.address}
      summary={view.summary}
      videoUrl={view.videoUrl}
    />
  );
}

/** Sau khung: "Dự án tương tự" (slider) → dải Điểm mạnh → banner tư vấn (nút chính cuộn tới form ở cột phải, không nhân đôi form). */
function ProjectAfter({ related, strengths, consultBanner }: Pick<ProjectDetailProps, "related" | "strengths" | "consultBanner">) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail");
  const similarLabels = { slide: t.raw("similar.slide") as string, previous: t("similar.previous"), next: t("similar.next"), dots: t("similar.dots"), goTo: t.raw("similar.goTo") as string };
  return (
    <>
      <SimilarCarousel
        items={related.map((card) => <ProjectCard key={card.id} data={card} headingLevel="h3" sizes={SIMILAR_IMAGE_SIZES} />)}
        eyebrow={t("similar.eyebrow")}
        title={t("similar.title")}
        titleAccent={t("similar.titleAccent")}
        viewAll={{ href: publicPath("/du-an", locale), label: t("v2.similarViewAll") }}
        labels={similarLabels}
      />
      {strengths && <StrengthsBlock block={strengths} />}
      {consultBanner}
    </>
  );
}

/**
 * Chi tiết Dự án theo design BL-052 (`detail-du-an.webp`) trên `DetailPageShell`: hero ảnh full-bleed (`DetailHeroMosaic`: badge danh mục + tình trạng, `h1`, địa chỉ, mô tả ngắn,
 * nút video khi có `videoUrl`, 3 ảnh nhỏ) → thanh thông số nổi (Giá từ · Quy mô · Diện tích · Chủ đầu tư · Bàn giao · Loại hình; không ô Pháp lý) → tab dính → [Tổng quan | cột
 * phải dính: form "Nhận thông tin dự án" (`#lead-form` duy nhất) + Hotline] → các dải rộng hết khung nền xen kẽ: Vị trí · Tiện ích · Hình ảnh · Nổi bật · Mặt bằng · Bảng giá ·
 * Pháp lý & chính sách (+ tài liệu, neo `#documents`) · Tin liên quan · Hỏi đáp → "Dự án tương tự" → dải Điểm mạnh → banner tư vấn. Khối thiếu dữ liệu ẩn cả khối lẫn tab
 * (`visibleSections`). Server Component; phần tương tác (hero, tab, danh sách mở rộng, mặt bằng, accordion, thanh dính đáy) là client.
 */
export function ProjectDetail({ doc, view, related, listings = { rentals: [], posts: [] }, hotline, ownPath, strengths, consultBanner }: ProjectDetailProps) {
  const t = useTranslations("page.projectDetail");
  const turnstileSiteKey = readTurnstileSiteKey();
  const sections = visibleSections(view, { hasListings: listings.rentals.length > 0 || listings.posts.length > 0 });
  const tabs = useProjectTabs(sections);
  const specItems = useProjectSpecItems(view);
  const bands = useProjectBands(doc, view, sections, listings);

  return (
    <article className="pb-16 lg:pb-0">
      <DetailPageShell
        hero={<ProjectHero view={view} ownPath={ownPath} />}
        specBar={<DetailSpecBar items={specItems} label={t("v2.spec.label")} />}
        subNav={{ items: tabs, label: t("subNavLabel") }}
        asideLabelledBy={CONSULT_HEADING_ID}
        aside={
          <DetailContactAside title={t("leadForm.title")} headingId={CONSULT_HEADING_ID} description={t("v2.contactDescription")} hotline={hotline ?? null}>
            <LeadForm layout="compact" source="project" sourceId={doc.id} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
          </DetailContactAside>
        }
        bands={bands}
        after={<ProjectAfter related={related} strengths={strengths} consultBanner={consultBanner} />}
      >
        <ProjectOverview view={view} overview={doc.overview} />
      </DetailPageShell>
      <ClickRefMarker collection="projects" id={doc.id} />
      <ProjectStickyCta />
    </article>
  );
}
