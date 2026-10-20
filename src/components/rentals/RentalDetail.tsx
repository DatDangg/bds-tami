import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { Info } from "@/components/icons";
import { DetailGalleryHero } from "@/components/detail/DetailGalleryHero";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { DetailSection } from "@/components/detail/DetailSection";
import { DetailTitleCard } from "@/components/detail/DetailTitleCard";
import { LazyMap } from "@/components/media/LazyMap";
import { VideoFacade } from "@/components/media/VideoFacade";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { Badge } from "@/components/ui/badge";
import { publicPath } from "@/lib/content/content-paths";
import { formatVndCompact } from "@/lib/format";
import { RENTAL_SECTION_DOM_ID, visibleRentalSections } from "@/lib/rentals/rental-detail-sections";
import type { RentalCardData, RentalDetailView, SaleContactView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";
import type { Rental } from "@/payload-types";
import { RentalAmenities } from "./RentalAmenities";
import { RentalDetails } from "./RentalSpecs";
import { RentalTerms } from "./RentalTerms";
import { RentalVideoButton } from "./RentalVideoButton";
import { RENTAL_CONTACT_HEADING_ID, SaleContactBox } from "./SaleContactBox";
import { SimilarRentals } from "./SimilarRentals";
import { useRentalFacts } from "./use-rental-facts";

interface RentalDetailProps {
  doc: Pick<Rental, "id" | "description">;
  view: RentalDetailView;
  similar: RentalCardData[];
  sale: SaleContactView | null;
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** URL tuyệt đối canonical cho nút chia sẻ; thiếu thì menu chỉ còn sao chép liên kết trang hiện tại. */
  shareUrl?: string;
  /** Banner tư vấn cuối trang: `<ConsultBanner />` là Server Component async nên trang dựng rồi truyền vào (như `ProjectDetail`). */
  consultBanner?: ReactNode;
}

/** Băng "Đã thuê" dưới khối tiêu đề (`role=status`): tin vẫn mở nhưng không còn nhận khách cho căn này. */
function RentedBanner() {
  const t = useTranslations("page.rentalDetail");
  return (
    <div role="status" className="mx-auto mt-6 w-full max-w-container px-gutter">
      <p className="flex items-start gap-3 rounded-sm bg-dark p-4 text-on-dark">
        <Info size={24} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>{t("rented.banner")}</span>
      </p>
    </div>
  );
}

/** Giá thuê/tháng cho khối tiêu đề: "Thoả thuận" khi không có giá; tin đã thuê chữ mờ (nhãn "Giá tham khảo" do nơi gọi). */
function RentalPrice({ view }: { view: Pick<RentalDetailView, "priceMonthlyVnd" | "rented"> }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const amount =
    view.priceMonthlyVnd === null ? (
      t("specs.negotiable")
    ) : (
      <>
        {formatVndCompact(view.priceMonthlyVnd, locale)}
        <span className="ml-1 text-body font-normal text-text-muted">{t("specs.perMonth")}</span>
      </>
    );
  return view.rented ? <span className="text-text-muted">{amount}</span> : amount;
}

/**
 * Các khối thẻ của cột chính (mockup `detail-rent`), mỗi khối chỉ dựng khi có dữ liệu (cùng điều kiện với `visibleRentalSections`): Tổng quan (mô tả), Thông tin chi tiết,
 * Tiện ích, Điều khoản (tin đã thuê: accordion đóng), Video, Vị trí (bản đồ gần đúng), Pháp lý.
 */
function RentalSections({ doc, view }: Pick<RentalDetailProps, "doc" | "view">) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tDetail = useTranslations("page.detail");
  const tRich = useTranslations("page.richText");
  return (
    <>
      {view.hasDescription && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.overview} eyebrow={t("eyebrow.overview")} title={t("sections.overview")}>
          <RichText data={doc.description} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        </DetailSection>
      )}
      <DetailSection id={RENTAL_SECTION_DOM_ID.details} eyebrow={t("eyebrow.details")} title={t("sections.details")}>
        <RentalDetails view={view} />
      </DetailSection>
      {view.amenities.length > 0 && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.amenities} eyebrow={t("eyebrow.amenities")} title={t("sections.amenities")}>
          <RentalAmenities amenities={view.amenities} />
        </DetailSection>
      )}
      {view.hasTerms && <RentalTerms id={RENTAL_SECTION_DOM_ID.terms} eyebrow={t("eyebrow.terms")} terms={view.terms} collapsed={view.rented} />}
      {view.videoUrl && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.video} eyebrow={t("eyebrow.video")} title={t("sections.video")}>
          <VideoFacade url={view.videoUrl} title={view.title} />
        </DetailSection>
      )}
      {view.map && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.location} eyebrow={tDetail("eyebrow.location")} title={t("sections.location")}>
          <LazyMap location={view.map.location} approximate={view.map.approximate} label={t("location.mapLabel", { name: view.title })} />
        </DetailSection>
      )}
      {view.legalNote && (
        <DetailSection id={RENTAL_SECTION_DOM_ID.legal} eyebrow={tDetail("eyebrow.legal")} title={t("sections.legal")}>
          <p className="max-w-[68ch] text-body whitespace-pre-line text-text-secondary">{view.legalNote}</p>
        </DetailSection>
      )}
    </>
  );
}

/**
 * Bố cục S07 theo mockup BL-045 qua `DetailLayout sectionStyle="cards"` (dùng chung với chi tiết dự án): ảnh lớn kiểu hero (`DetailGalleryHero`, breadcrumb kính trên ảnh, nút "Video" khi có) →
 * khối tiêu đề nổi có dải thông số (`DetailTitleCard`, chứa `h1`, badge Còn trống / Đã thuê) → [tin đã thuê: băng "Đã thuê" + "Căn tương tự đang trống" ngay đây] → thanh mục con dính →
 * lưới 2 cột ≥ lg (cột chính: các mục là thẻ trắng bo 20px; cột phải: thẻ liên hệ dính chứa form lead; < lg thẻ liên hệ nằm sau các thẻ) → "Căn tương tự" (slider, nền trắng, tin còn trống) → banner tư vấn.
 * Tin đã thuê KHÔNG có JSON-LD (kể cả breadcrumb) vì noindex. `h1` duy nhất là tiêu đề tin. Server Component; chỉ ảnh lớn, nút video, thanh mục con, chia sẻ, bản đồ, slider, thanh dính đáy là client.
 */
export function RentalDetail({ doc, view, similar, sale, hotline, ownPath, shareUrl, consultBanner }: RentalDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tCard = useTranslations("page.rentals.card");
  const tNav = useTranslations("layout.nav.items");
  const facts = useRentalFacts(view);
  const similarBlock = <SimilarRentals cards={similar} rented={view.rented} />;
  const categoryEyebrow = view.category ? `${view.category.label} · ${view.code}` : view.code;

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
                  jsonLd={!view.rented}
                  items={[
                    { label: tNav("rentals"), href: publicPath("/cho-thue", locale) },
                    ...(view.category ? [{ label: view.category.label, href: view.category.href }] : []),
                    { label: view.code, href: ownPath },
                  ]}
                />
              }
              {...(view.videoUrl ? { actions: <RentalVideoButton url={view.videoUrl} title={view.title} /> } : {})}
            />
            <DetailTitleCard
              eyebrow={categoryEyebrow}
              badge={view.rented ? <Badge variant="dark">{t("rented.badge")}</Badge> : <Badge>{tCard("available")}</Badge>}
              title={view.title}
              location={view.addressLine}
              priceLabel={view.rented ? t("rented.referencePrice") : t("specs.price")}
              price={<RentalPrice view={view} />}
              facts={facts}
              factsLabel={t("facts.label")}
              shareTitle={view.title}
              {...(shareUrl ? { shareUrl } : {})}
            />
            {/* Tin đã thuê: băng + khối "Căn tương tự đang trống" nằm ngay sau khối tiêu đề; `pb-8` chừa khoảng trước thanh mục con (BL-031). */}
            {view.rented && (
              <div className="pb-8">
                <RentedBanner />
                {similar.length > 0 && <div className="mt-8">{similarBlock}</div>}
              </div>
            )}
          </>
        }
        subNav={{ items: visibleRentalSections(view).map((id) => ({ id: RENTAL_SECTION_DOM_ID[id], label: t(`subNav.${id}`) })), label: t("subNavLabel") }}
        asideLabelledBy={RENTAL_CONTACT_HEADING_ID}
        aside={<SaleContactBox view={view} rentalId={doc.id} sale={sale} {...(hotline ? { hotline } : {})} />}
        after={
          <>
            {!view.rented && similarBlock}
            {/* Banner cuối trang: nút chính cuộn tới thẻ liên hệ (form lead duy nhất), không nhân đôi form. */}
            {consultBanner}
          </>
        }
      >
        <RentalSections doc={doc} view={view} />
      </DetailLayout>
      <ClickRefMarker collection="rentals" id={doc.id} />
      <ProjectStickyCta label={view.rented ? t("stickyConsultRented") : t("stickyConsult")} />
    </article>
  );
}
