import type { RentalTabView } from "@/lib/home/home-view-listings";
import { RentalsTabs } from "./RentalsTabs";

/**
 * Khối "Thuê nhà ở/kinh doanh" (design-spec S01 khối 8, BL-020): tiêu đề giữa + tab danh mục + slider thẻ tin cho thuê.
 * Toàn bộ tin của các tab do server nạp sẵn (không fetch ở client); phần tương tác nằm ở `RentalsTabs`.
 */
export function HomeRentals({ title, tabs }: { title: string; tabs: RentalTabView[] }) {
  return (
    <section className="py-section">
      <RentalsTabs title={title} tabs={tabs} />
    </section>
  );
}
