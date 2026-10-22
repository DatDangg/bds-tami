import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DetailGalleryGrid } from "@/components/detail/DetailGalleryGrid";
import { DetailHeroMosaic } from "@/components/detail/DetailHeroMosaic";
import { DetailInfoGrid, type DetailInfoItem } from "@/components/detail/DetailInfoGrid";
import { DetailOverviewIntro } from "@/components/detail/DetailOverviewIntro";
import { DetailPageShell, type DetailBand } from "@/components/detail/DetailPageShell";
import { DetailSection } from "@/components/detail/DetailSection";
import { DETAIL_ICON_SIZE as ICON_SIZE } from "@/components/detail/detail-icon-size";
import { DetailSpecBar, type DetailSpecItem } from "@/components/detail/DetailSpecBar";
import { StrengthsBlock } from "@/components/home/StrengthsBlock";
import { Armchair, Bed, Buildings, CalendarCheck, ClipboardText, Clock, Compass, House, Info, Ruler, SquaresFour, Tag } from "@/components/icons";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { LazyMap } from "@/components/media/LazyMap";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { Badge } from "@/components/ui/badge";
import { publicPath } from "@/lib/content/content-paths";
import { formatArea } from "@/lib/format";
import type { StrengthsView } from "@/lib/home/home-view";
import { RENTAL_SECTION_DOM_ID, visibleRentalSections, type RentalSectionId } from "@/lib/rentals/rental-detail-sections";
import type { RentalCardData, RentalDetailView, SaleContactView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";
import type { Rental } from "@/payload-types";
import { RentalAmenities } from "./RentalAmenities";
import { useRentalPrice } from "./RentalPriceText";
import { RentalTerms } from "./RentalTerms";
import { RENTAL_CONTACT_HEADING_ID, SaleContactBox } from "./SaleContactBox";
import { SimilarRentals } from "./SimilarRentals";

/** Chip trên hero nền tối (`theme-dark-block`): viền sáng, chữ trắng — cùng kiểu chip danh mục của chi tiết Dự án. */
const HERO_CHIP_CLASS =
  "inline-flex items-center rounded-pill border border-on-dark/50 bg-dark-deep/30 px-2.5 py-1 text-xsmall font-medium tracking-[0.06em] text-on-dark uppercase";

interface RentalDetailProps {
  doc: Pick<Rental, "id" | "description" | "priceNegotiable">;
  view: RentalDetailView;
  similar: RentalCardData[];
  sale: SaleContactView | null;
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** Dải Điểm mạnh (cờ `listingPages.rentals.showStrengths`); `null` → không dải. */
  strengths?: StrengthsView | null;
  /** Banner tư vấn cuối trang: `<ConsultBanner />` là Server Component async nên trang dựng rồi truyền vào (như `ProjectDetail`). */
  consultBanner?: ReactNode;
}

/** Băng "Đã thuê" dưới thanh thông số (`role=status`): tin vẫn mở nhưng không còn nhận khách cho căn này. */
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

/** "2 phòng ngủ · 1 WC" (phần nào có thì hiện); không có cả hai → `null` (ô bị bỏ). */
function useLayoutText({ bedrooms, bathrooms }: Pick<RentalDetailView, "bedrooms" | "bathrooms">): string | null {
  const t = useTranslations("page.rentalDetail.facts");
  const parts = [bedrooms !== null ? t("bedroomsValue", { count: bedrooms }) : null, bathrooms !== null ? t("bathroomsValue", { count: bathrooms }) : null].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Khối Tổng quan (cạnh cột liên hệ ≥ lg): eyebrow "Giới thiệu" + `h2` → mô tả (richText, khi có) → lưới thông tin (mã tin, danh mục, tầng, hướng ban công, thuộc dự án, ngày đăng;
 * danh mục / dự án là link nội bộ; ô trống bị bỏ). Luôn có vì mã tin luôn có.
 */
function RentalOverview({ doc, view }: Pick<RentalDetailProps, "doc" | "view">) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tOptions = useTranslations("listingOptions");
  const info: DetailInfoItem[] = [
    { icon: <ClipboardText size={ICON_SIZE} />, label: t("code"), value: view.code },
    { icon: <House size={ICON_SIZE} />, label: t("details.category"), value: view.category?.label ?? null, link: view.category ? { kind: "internal", href: view.category.href } : null },
    { icon: <SquaresFour size={ICON_SIZE} />, label: t("details.floor"), value: view.floor },
    { icon: <Compass size={ICON_SIZE} />, label: t("details.balconyDirection"), value: view.balconyDirection ? tOptions(`direction.${view.balconyDirection}`) : null },
    { icon: <Buildings size={ICON_SIZE} />, label: t("v2.info.project"), value: view.project?.label ?? null, link: view.project ? { kind: "internal", href: view.project.href } : null },
    { icon: <Clock size={ICON_SIZE} />, label: t("postedAt"), value: view.postedAtLabel, dateTime: view.postedAtIso },
  ];
  return (
    <DetailSection id={RENTAL_SECTION_DOM_ID.overview} eyebrow={t("v2.eyebrow.overview")} title={t("v2.titles.overview")}>
      <div className="flex flex-col gap-8">
        <DetailOverviewIntro content={doc.description} locale={locale} />
        <DetailInfoGrid items={info} label={t("v2.info.label")} />
      </div>
    </DetailSection>
  );
}

/**
 * Chi tiết Cho thuê theo khung chi tiết BL-052 (cùng `DetailPageShell` với chi tiết Dự án, design `detail-du-an.webp`): hero ảnh full-bleed (`DetailHeroMosaic`: chip danh mục
 * + badge "Đã thuê" + mã tin, `h1`, vị trí theo quy tắc địa chỉ chính xác, nút video khi có `videoUrl`, 3 ảnh nhỏ) → thanh thông số nổi (Giá thuê · Diện tích · Phòng ngủ/tắm ·
 * Nội thất · Hướng · Dọn vào từ; ô trống bị bỏ) → [tin đã thuê: băng + "Căn tương tự đang trống"] → tab dính → [Tổng quan | cột phải dính: giá + người phụ trách / hotline +
 * form lead `source=rental` duy nhất (`#lead-form`)] → các dải rộng hết khung nền xen kẽ: Vị trí · Tiện ích · Hình ảnh · Điều khoản thuê (tin đã thuê: accordion đóng) · Pháp lý
 * → "Căn tương tự" (tin còn trống) → dải Điểm mạnh → banner tư vấn. Khối thiếu dữ liệu ẩn cả khối lẫn tab (`visibleRentalSections`). Tin đã thuê KHÔNG có JSON-LD (kể cả
 * breadcrumb) vì noindex. Server Component; phần tương tác (hero, tab, bản đồ, slider, accordion, thanh dính đáy) là client.
 */
export function RentalDetail({ doc, view, similar, sale, hotline, ownPath, strengths, consultBanner }: RentalDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tOptions = useTranslations("listingOptions");
  const tDetail = useTranslations("page.detail");
  const tNav = useTranslations("layout.nav.items");
  const priceInput = { rented: view.rented, priceMonthlyVnd: view.priceMonthlyVnd, priceNegotiable: doc.priceNegotiable === true };
  const price = useRentalPrice(priceInput);
  const layoutText = useLayoutText(view);
  const sections = visibleRentalSections(view);
  const similarBlock = <SimilarRentals cards={similar} rented={view.rented} />;

  const specItems: DetailSpecItem[] = [
    { icon: <Tag size={ICON_SIZE} />, label: view.rented ? t("rented.referencePrice") : t("specs.price"), value: price.text },
    { icon: <Ruler size={ICON_SIZE} />, label: t("specs.area"), value: formatArea(view.areaM2, locale) },
    { icon: <Bed size={ICON_SIZE} />, label: t("v2.spec.layout"), value: layoutText },
    { icon: <Armchair size={ICON_SIZE} />, label: t("details.furnishing"), value: view.furnishing ? t(`furnishing.${view.furnishing}`) : null },
    { icon: <Compass size={ICON_SIZE} />, label: t("facts.direction"), value: view.houseDirection ? tOptions(`direction.${view.houseDirection}`) : null },
    { icon: <CalendarCheck size={ICON_SIZE} />, label: t("v2.spec.availableFrom"), value: view.terms.availableFromLabel },
  ];

  const bandContent: Record<Exclude<RentalSectionId, "overview">, ReactNode> = {
    location: view.map && (
      <DetailSection id={RENTAL_SECTION_DOM_ID.location} eyebrow={tDetail("eyebrow.location")} title={t("sections.location")} description={view.addressLine || null}>
        <LazyMap location={view.map.location} approximate={view.map.approximate} label={t("location.mapLabel", { name: view.title })} />
      </DetailSection>
    ),
    amenities: (
      <DetailSection id={RENTAL_SECTION_DOM_ID.amenities} eyebrow={t("eyebrow.amenities")} title={t("sections.amenities")}>
        <RentalAmenities amenities={view.amenities} />
      </DetailSection>
    ),
    gallery: (
      <DetailSection
        id={RENTAL_SECTION_DOM_ID.gallery}
        eyebrow={t("v2.eyebrow.gallery")}
        title={t("v2.titles.gallery")}
        description={t("v2.galleryDescription", { name: view.title })}
      >
        <DetailGalleryGrid images={view.gallery} />
      </DetailSection>
    ),
    terms: <RentalTerms id={RENTAL_SECTION_DOM_ID.terms} eyebrow={t("eyebrow.terms")} terms={view.terms} collapsed={view.rented} />,
    legal: (
      <DetailSection id={RENTAL_SECTION_DOM_ID.legal} eyebrow={tDetail("eyebrow.legal")} title={t("sections.legal")}>
        <p className="max-w-[68ch] text-body whitespace-pre-line text-text-secondary">{view.legalNote}</p>
      </DetailSection>
    ),
  };
  const bands: DetailBand[] = sections.flatMap((id) => (id === "overview" ? [] : [{ key: id, content: bandContent[id] }]));

  return (
    <article className="pb-16 lg:pb-0">
      <DetailPageShell
        hero={
          <DetailHeroMosaic
            images={view.gallery}
            title={view.title}
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
            badges={
              <>
                {view.category && <span className={HERO_CHIP_CLASS}>{view.category.label}</span>}
                {/* `dark` + viền sáng: `neutral` mất tương phản trong `theme-dark-block` (như "Đã bàn giao" của chi tiết Dự án). */}
                {view.rented && (
                  <Badge variant="dark" className="border border-on-dark/40">
                    {t("rented.badge")}
                  </Badge>
                )}
                <span className="text-xsmall font-medium text-on-dark/90">{t("v2.codeChip", { code: view.code })}</span>
              </>
            }
            address={view.addressLine || null}
            videoUrl={view.videoUrl}
          />
        }
        specBar={<DetailSpecBar items={specItems} label={t("facts.label")} />}
        belowSpecBar={
          view.rented ? (
            <>
              <RentedBanner />
              {similar.length > 0 && <div className="mt-8">{similarBlock}</div>}
            </>
          ) : undefined
        }
        subNav={{ items: sections.map((id) => ({ id: RENTAL_SECTION_DOM_ID[id], label: t(`v2.tabs.${id}`) })), label: t("subNavLabel") }}
        asideLabelledBy={RENTAL_CONTACT_HEADING_ID}
        aside={<SaleContactBox view={priceInput} rentalId={doc.id} sale={sale} {...(hotline ? { hotline } : {})} />}
        bands={bands}
        after={
          <>
            {!view.rented && similarBlock}
            {strengths && <StrengthsBlock block={strengths} />}
            {/* Banner cuối trang: nút chính cuộn tới form ở cột phải (form lead duy nhất), không nhân đôi form. */}
            {consultBanner}
          </>
        }
      >
        <RentalOverview doc={doc} view={view} />
      </DetailPageShell>
      <ClickRefMarker collection="rentals" id={doc.id} />
      <ProjectStickyCta label={view.rented ? t("stickyConsultRented") : t("stickyConsult")} />
    </article>
  );
}
