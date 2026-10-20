import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Barbell, Car, Door, CookingPot, Elevator, PawPrint, ShieldCheck, Snowflake, SwimmingPool, WashingMachine } from "@/components/icons";
import type { RentalAmenity } from "@/lib/rentals/rental-view";

/** Tiện ích (BL-044) → icon Phosphor. Thêm tiện ích mới ở `RENTAL_AMENITIES` thì TypeScript buộc thêm icon ở đây. */
const AMENITY_ICONS: Record<RentalAmenity, ComponentType<IconProps>> = {
  pool: SwimmingPool,
  gym: Barbell,
  elevator: Elevator,
  parking: Car,
  security: ShieldCheck,
  balcony: Door,
  washing_machine: WashingMachine,
  air_conditioner: Snowflake,
  pet_friendly: PawPrint,
  kitchen: CookingPot,
};

/**
 * Nội dung khối "Tiện ích" (mockup `.amen`): lưới ô icon tròn nền `primary-subtle` + tên. Nhãn dùng chung với bộ lọc `/cho-thue` (`page.rentals.amenityOption`).
 * Rỗng → không dựng (nơi gọi đã ẩn cả khối). Server Component.
 */
export function RentalAmenities({ amenities }: { amenities: RentalAmenity[] }) {
  const t = useTranslations("page.rentalDetail");
  const tAmenity = useTranslations("page.rentals.amenityOption");
  if (amenities.length === 0) return null;
  return (
    <ul aria-label={t("amenitiesLabel")} className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity];
        return (
          <li key={amenity} className="flex min-w-0 items-center gap-3 rounded-lg bg-primary-subtle p-3">
            <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-accent-text">
              <Icon size={22} />
            </span>
            <span className="min-w-0 font-semibold break-words">{tAmenity(amenity)}</span>
          </li>
        );
      })}
    </ul>
  );
}
