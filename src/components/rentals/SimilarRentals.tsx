import { useLocale, useTranslations } from "next-intl";
import { SimilarCarousel } from "@/components/detail/SimilarCarousel";
import { RentalCard } from "@/components/rentals/RentalCard";
import { publicPath } from "@/lib/content/content-paths";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import type { Locale } from "@/i18n/routing";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * "Căn tương tự" (BL-052, cùng `SimilarCarousel` với "Dự án tương tự"): dải nền `primary-subtle` (BL-058), đầu khối canh trái + "Xem tất cả căn cho thuê" (→ `/cho-thue`), slider `RentalCard`
 * như đang có (không icon tim). Cùng danh mục + cùng tỉnh, chỉ tin còn trống. Tin đã thuê dùng tiêu đề "Căn tương tự đang trống" (khối được kéo lên ngay sau thanh thông số).
 * Không có thẻ nào thì không render. Server Component.
 */
export function SimilarRentals({ cards, rented = false }: { cards: RentalCardData[]; rented?: boolean }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.rentalDetail");
  const items = cards.map((card) => <RentalCard key={card.id} data={card} variant="listing" headingLevel={3} imageSizes={IMAGE_SIZES} />);
  // `raw`: giữ nguyên `{index}` / `{total}` để CardSlider thay (nhãn truyền được từ Server Component).
  const labels = {
    slide: t.raw("similar.slide") as string,
    previous: t("similar.previous"),
    next: t("similar.next"),
    dots: t("similar.dots"),
    goTo: t.raw("similar.goTo") as string,
  };
  return (
    <SimilarCarousel
      items={items}
      eyebrow={t("similar.eyebrow")}
      title={rented ? t("similar.titleRented") : t("similar.title")}
      titleAccent={rented ? t("similar.titleRentedAccent") : t("similar.titleAccent")}
      viewAll={{ href: publicPath("/cho-thue", locale), label: t("v2.similarViewAll") }}
      labels={labels}
    />
  );
}
