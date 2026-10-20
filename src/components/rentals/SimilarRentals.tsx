import { useTranslations } from "next-intl";
import { useId } from "react";
import { CardSlider } from "@/components/layout/CardSlider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { RentalCard } from "@/components/rentals/RentalCard";
import type { RentalCardData } from "@/lib/rentals/rental-view";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * "Căn tương tự" (design-spec S07, mockup `.sec.white`, DECISIONS #6): dải nền TRẮNG, đầu khối canh TRÁI (eyebrow, tiêu đề + chữ nhấn, mô tả) rồi `CardSlider` của `RentalCard`
 * (cùng thẻ danh sách, không icon tim). Cùng danh mục + cùng tỉnh. Tin đã thuê dùng tiêu đề "Căn tương tự đang trống" (khối này được kéo lên ngay sau ảnh lớn).
 * Không có thẻ nào thì không render. Server Component.
 */
export function SimilarRentals({ cards, rented = false }: { cards: RentalCardData[]; rented?: boolean }) {
  const t = useTranslations("page.rentalDetail.similar");
  const headingId = useId();
  if (cards.length === 0) return null;
  const items = cards.map((card) => <RentalCard key={card.id} data={card} headingLevel={3} imageSizes={IMAGE_SIZES} />);
  // `raw`: giữ nguyên `{index}` / `{total}` để CardSlider thay (nhãn truyền được từ Server Component).
  const labels = { slide: t.raw("slide") as string, previous: t("previous"), next: t("next"), dots: t("dots"), goTo: t.raw("goTo") as string };
  return (
    <section aria-labelledby={headingId} className="bg-surface py-section-tight">
      <div className="mx-auto mb-8 w-full max-w-container px-gutter">
        <SectionHeading
          id={headingId}
          eyebrow={t("eyebrow")}
          title={rented ? t("titleRented") : t("title")}
          titleAccent={rented ? t("titleRentedAccent") : t("titleAccent")}
          description={t("description")}
        />
      </div>
      {/* Bọc trong container: thẻ đầu thẳng hàng với tiêu đề (CardSlider tự chừa `px-gutter` ở hai đầu danh sách). */}
      <div className="mx-auto w-full max-w-container">
        <CardSlider items={items} labelledBy={headingId} labels={labels} />
      </div>
    </section>
  );
}
