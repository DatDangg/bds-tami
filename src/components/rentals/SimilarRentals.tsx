import { useTranslations } from "next-intl";
import { RentalCard } from "@/components/rentals/RentalCard";
import type { RentalCardData } from "@/lib/rentals/rental-view";

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
        <h2 id="similar-rentals" className="mb-8 font-display text-h2-sm">
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
