import { useLocale, useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { Info, MapPin } from "@/components/icons";
import { Gallery } from "@/components/media/Gallery";
import { LazyMap } from "@/components/media/LazyMap";
import { VideoFacade } from "@/components/media/VideoFacade";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { Badge } from "@/components/ui/badge";
import { publicPath } from "@/lib/content/content-paths";
import type { RentalCardData, RentalDetailView, SaleContactView } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";
import type { Rental } from "@/payload-types";
import { RentalDetails, RentalSpecs } from "./RentalSpecs";
import { RentalTerms } from "./RentalTerms";
import { SaleContactBox } from "./SaleContactBox";
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

const SECTION_HEADING = "mb-4 font-display text-h2-sm";

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

/** Các phần dài cuối cột nội dung, mỗi phần chỉ hiện khi có dữ liệu: mô tả, video, vị trí (bản đồ gần đúng), pháp lý. */
function RentalLongSections({ doc, view }: Pick<RentalDetailProps, "doc" | "view">) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tRich = useTranslations("page.richText");
  return (
    <>
      {view.hasDescription && (
        <section aria-labelledby="rental-description">
          <h2 id="rental-description" className={SECTION_HEADING}>
            {t("sections.description")}
          </h2>
          <RichText data={doc.description} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        </section>
      )}
      {view.videoUrl && (
        <section aria-labelledby="rental-video">
          <h2 id="rental-video" className={SECTION_HEADING}>
            {t("sections.video")}
          </h2>
          <VideoFacade url={view.videoUrl} title={view.title} />
        </section>
      )}
      {view.map && (
        <section aria-labelledby="rental-location">
          <h2 id="rental-location" className={SECTION_HEADING}>
            {t("sections.location")}
          </h2>
          <LazyMap location={view.map.location} approximate={view.map.approximate} label={t("location.mapLabel", { name: view.title })} />
        </section>
      )}
      {view.legalNote && (
        <section aria-labelledby="rental-legal">
          <h2 id="rental-legal" className={SECTION_HEADING}>
            {t("sections.legal")}
          </h2>
          <p className="max-w-[68ch] text-body whitespace-pre-line text-text-secondary">{view.legalNote}</p>
        </section>
      )}
    </>
  );
}

/**
 * Bố cục S07: breadcrumb → (băng "Đã thuê") → thư viện ảnh (badge "Đã thuê" góc ảnh đầu) → [tin đã thuê: tin tương tự lên ngay đây] → 2 cột
 * ≥ lg (nội dung 8 cột + khung phải 4 cột dính) → tin tương tự (tin còn trống). < lg DOM theo thứ tự tiêu đề + thông số chính → khung giá/form
 * → phần còn lại, nên khung nằm ngay sau thông số chính (design-spec mốc 375). Tin đã thuê KHÔNG có JSON-LD (kể cả breadcrumb) vì noindex.
 * `h1` duy nhất là tiêu đề tin. Server Component; chỉ thư viện ảnh, bản đồ, video, thanh dính đáy là client.
 */
export function RentalDetail({ doc, view, similar, sale, hotline, ownPath }: RentalDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const tNav = useTranslations("layout.nav.items");
  const similarBlock = <SimilarRentals cards={similar} rented={view.rented} />;

  return (
    <article className="pb-16 lg:pb-0">
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
        <div className="mx-auto mt-4 w-full max-w-container px-gutter">
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
      {view.rented && similarBlock}
      <div className="mx-auto grid w-full max-w-container gap-x-12 gap-y-10 px-gutter py-section-tight lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <header className="flex flex-col gap-2">
            <h1 className="font-display text-h2 text-balance">{view.title}</h1>
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
        </div>
        <aside className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:self-start lg:sticky lg:top-28">
          <SaleContactBox view={view} rentalId={doc.id} sale={sale} {...(hotline ? { hotline } : {})} />
        </aside>
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-8 lg:col-start-1 lg:row-start-2">
          <RentalDetails view={view} />
          {view.hasTerms && <RentalTerms terms={view.terms} collapsed={view.rented} />}
          <RentalLongSections doc={doc} view={view} />
        </div>
      </div>
      {!view.rented && similarBlock}
      <ClickRefMarker collection="rentals" id={doc.id} />
      <ProjectStickyCta label={view.rented ? t("stickyConsultRented") : t("stickyConsult")} />
    </article>
  );
}
