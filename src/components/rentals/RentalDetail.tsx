import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { Info, MapPin } from "@/components/icons";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { DetailSection } from "@/components/detail/DetailSection";
import { Gallery } from "@/components/media/Gallery";
import { LazyMap } from "@/components/media/LazyMap";
import { VideoFacade } from "@/components/media/VideoFacade";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { Badge } from "@/components/ui/badge";
import { publicPath } from "@/lib/content/content-paths";
import { RENTAL_SECTION_DOM_ID, visibleRentalSections } from "@/lib/rentals/rental-detail-sections";
import type { RentalCardData, RentalDetailView, SaleContactView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";
import type { Rental } from "@/payload-types";
import { RentalDetails, RentalSpecs } from "./RentalSpecs";
import { RentalTerms } from "./RentalTerms";
import { RENTAL_CONTACT_HEADING_ID, SaleContactBox } from "./SaleContactBox";
import { SimilarRentals } from "./SimilarRentals";

interface RentalDetailProps {
  doc: Pick<Rental, "id" | "description">;
  view: RentalDetailView;
  similar: RentalCardData[];
  sale: SaleContactView | null;
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
}

/** Băng "Đã thuê" đầu trang (`role=status`): tin vẫn mở nhưng không còn nhận khách cho căn này. */
function RentedBanner() {
  const t = useTranslations("page.rentalDetail");
  return (
    <div role="status" className="mx-auto mt-2 w-full max-w-container px-gutter">
      <p className="flex items-start gap-3 rounded-sm bg-dark p-4 text-on-dark">
        <Info size={24} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>{t("rented.banner")}</span>
      </p>
    </div>
  );
}

/**
 * Khối Tổng quan (`#overview`, luôn có, đầu thẻ trắng): tiêu đề tin (`h1` duy nhất, cũng là nhãn của khối) + mã tin/ngày đăng + địa chỉ → Thông số chính → Chi tiết.
 * Không dùng `DetailSection` vì không có `h2` "Tổng quan" hiển thị.
 */
function RentalOverview({ view }: { view: RentalDetailView }) {
  const t = useTranslations("page.rentalDetail");
  return (
    <section
      id={RENTAL_SECTION_DOM_ID.overview}
      tabIndex={-1}
      aria-labelledby="rental-title"
      className="flex scroll-mt-[calc(var(--sticky-top)+4.5rem)] flex-col gap-8 focus:outline-none not-last:pb-section-tight"
    >
      <header className="flex flex-col gap-2">
        <h1 id="rental-title" className="font-display text-h2 text-balance">
          {view.title}
        </h1>
        <p className="text-xsmall text-text-muted">
          {t("code")}: <span className="font-semibold">{view.code}</span>
          {view.postedAtLabel && view.postedAtIso && (
            <>
              {" · "}
              {t("postedAt")}: <time dateTime={view.postedAtIso}>{view.postedAtLabel}</time>
            </>
          )}
        </p>
        {view.addressLine && (
          <p className="flex items-start gap-2 text-body text-text-secondary">
            <MapPin size={20} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            <span>{view.addressLine}</span>
          </p>
        )}
      </header>
      <RentalSpecs view={view} />
      <RentalDetails view={view} />
    </section>
  );
}

/** Các khối dài sau Điều khoản, mỗi khối chỉ dựng khi có dữ liệu (cùng điều kiện với `visibleRentalSections`): mô tả, video, vị trí (bản đồ gần đúng), pháp lý. */
function RentalLongSections({ doc, view }: Pick<RentalDetailProps, "doc" | "view">) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tRich = useTranslations("page.richText");
  return (
    <>
      {view.hasDescription && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.description} title={t("sections.description")}>
          <RichText data={doc.description} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        </DetailSection>
      )}
      {view.videoUrl && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.video} title={t("sections.video")}>
          <VideoFacade url={view.videoUrl} title={view.title} />
        </DetailSection>
      )}
      {view.map && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.location} title={t("sections.location")}>
          <LazyMap location={view.map.location} approximate={view.map.approximate} label={t("location.mapLabel", { name: view.title })} />
        </DetailSection>
      )}
      {view.legalNote && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.legal} title={t("sections.legal")}>
          <p className="max-w-[68ch] text-body whitespace-pre-line text-text-secondary">{view.legalNote}</p>
        </DetailSection>
      )}
    </>
  );
}

/**
 * Bố cục S07 qua `DetailLayout` dùng chung với chi tiết dự án: breadcrumb → (băng "Đã thuê") → thư viện ảnh (badge "Đã thuê" góc ảnh đầu; ảnh LCP) → [tin đã thuê:
 * tin tương tự lên ngay đây] → thanh mục con dính (Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý, khối trống tự ẩn) → lưới 2 cột ≥ lg (MỘT thẻ trắng nội dung +
 * thẻ liên hệ dính; < lg thẻ liên hệ nằm sau thẻ nội dung) → tin tương tự (tin còn trống). Tin đã thuê KHÔNG có JSON-LD (kể cả breadcrumb) vì noindex.
 * `h1` duy nhất là tiêu đề tin. Server Component; chỉ thư viện ảnh, thanh mục con, bản đồ, video, thanh dính đáy là client.
 */
export function RentalDetail({ doc, view, similar, sale, hotline, ownPath }: RentalDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tNav = useTranslations("layout.nav.items");
  const similarBlock = <SimilarRentals cards={similar} rented={view.rented} />;

  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        before={
          <>
            <Breadcrumb
              className="py-2"
              jsonLd={!view.rented}
              items={[
                { label: tNav("rentals"), href: publicPath("/cho-thue", locale) },
                ...(view.category ? [{ label: view.category.label, href: view.category.href }] : []),
                { label: view.code, href: ownPath },
              ]}
            />
            {view.rented && <RentedBanner />}
            {view.gallery.length > 0 && (
              <div className="mx-auto mt-4 w-full max-w-container px-gutter pb-8">
                <div className="relative">
                  {/* Ảnh LCP của trang là ảnh đầu thư viện. */}
                  <Gallery images={view.gallery} priorityFirst />
                  {view.rented && (
                    <Badge variant="dark" className="pointer-events-none absolute top-3 left-3 z-10">
                      {t("rented.badge")}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {/* Tin đã thuê: khối tin tương tự nền xám nằm ngay trên thanh mục con → chừa cùng khoảng pb-8 như dưới thư viện ảnh (BL-031). */}
            {view.rented && similar.length > 0 && <div className="pb-8">{similarBlock}</div>}
          </>
        }
        subNav={{ items: visibleRentalSections(view).map((id) => ({ id: RENTAL_SECTION_DOM_ID[id], label: t(`subNav.${id}`) })), label: t("subNavLabel") }}
        asideLabelledBy={RENTAL_CONTACT_HEADING_ID}
        aside={<SaleContactBox view={view} rentalId={doc.id} sale={sale} {...(hotline ? { hotline } : {})} />}
        after={!view.rented ? similarBlock : null}
      >
        <RentalOverview view={view} />
        {view.hasTerms && <RentalTerms id={RENTAL_SECTION_DOM_ID.terms} terms={view.terms} collapsed={view.rented} />}
        <RentalLongSections doc={doc} view={view} />
      </DetailLayout>
      <ClickRefMarker collection="rentals" id={doc.id} />
      <ProjectStickyCta label={view.rented ? t("stickyConsultRented") : t("stickyConsult")} />
    </article>
  );
}
