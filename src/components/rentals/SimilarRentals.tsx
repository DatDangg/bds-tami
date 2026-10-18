import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { formatArea, formatVndCompact } from "@/lib/format";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

/** Thẻ tin cho thuê: ảnh 4:3, tên (2 dòng), khu vực, giá/tháng + diện tích + phòng ngủ. Cả thẻ là MỘT link. */
function RentalCard({ data }: { data: RentalCardData }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const facts = [formatArea(data.areaM2, locale), ...(data.bedrooms !== null ? [t("similar.bedroomsValue", { count: data.bedrooms })] : [])];
  return (
    <article className="h-full">
      <Link href={data.href} className="group flex min-h-11 flex-col gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 80vw" decorative />
          ) : (
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="line-clamp-2 font-display text-h4 group-hover:underline group-hover:underline-offset-4">{data.title}</h3>
          {data.areaLabel && <p className="text-small text-text-muted">{data.areaLabel}</p>}
          <p className="text-small font-semibold">
            {data.priceMonthlyVnd === null ? (
              t("specs.negotiable")
            ) : (
              <>
                {formatVndCompact(data.priceMonthlyVnd, locale)}
                {t("specs.perMonth")}
              </>
            )}
          </p>
          <p className="text-small text-text-secondary">{facts.join(" · ")}</p>
        </div>
      </Link>
    </article>
  );
}

/**
 * "Tin tương tự" (design-spec S07): cùng danh mục + cùng tỉnh. Lưới 1/2/4 cột, < sm carousel cuộn ngang. Tin đã thuê dùng tiêu đề
 * "Căn tương tự đang trống" (khối này được kéo lên ngay sau thư viện ảnh). Không có thẻ nào thì không render.
 */
export function SimilarRentals({ cards, rented = false }: { cards: RentalCardData[]; rented?: boolean }) {
  const t = useTranslations("page.rentalDetail");
  if (cards.length === 0) return null;
  return (
    <section aria-labelledby="similar-rentals" className="bg-bg-alt py-section-tight">
      <div className="mx-auto w-full max-w-container px-gutter">
        <h2 id="similar-rentals" className="mb-8 font-display text-h2">
          {rented ? t("similar.titleRented") : t("similar.title")}
        </h2>
        <ul className="-mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {cards.map((card) => (
            <li key={card.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <RentalCard data={card} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
