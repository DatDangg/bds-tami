import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { DetailDistanceList } from "@/components/detail/DetailDistanceList";
import { DetailSection } from "@/components/detail/DetailSection";
import { Bus, FirstAid, GraduationCap, MapPin, ShoppingBag, Tree } from "@/components/icons";
import { LazyMap, type MapMarker } from "@/components/media/LazyMap";
import type { LatLng } from "@/components/media/map-geometry";
import { SECTION_DOM_ID, type NearbyCategory, type NearbyGroupView } from "@/lib/projects/project-detail-view";

/** Icon theo nhóm địa điểm (cùng giá trị `nearbyAmenities.category`). */
const CATEGORY_ICON: Record<NearbyCategory, ComponentType<{ size?: number }>> = {
  education: GraduationCap,
  healthcare: FirstAid,
  shopping: ShoppingBag,
  park: Tree,
  transport: Bus,
  other: MapPin,
};

interface ProjectLocationProps {
  projectName: string;
  location: LatLng | null;
  address: string | null;
  areaLabel: string | null;
  /** Địa điểm quanh dự án theo nhóm (chỉ nhóm có dòng, đúng thứ tự `NEARBY_CATEGORY_ORDER`). */
  nearby?: NearbyGroupView[];
}

/**
 * Khối Vị trí (BL-052, design `detail-du-an`; dải rộng hết khung): eyebrow "Kết nối" + `h2` + địa chỉ (đoạn mô tả) → ≥ lg bản đồ lười 7 cột (điểm dự án + điểm lân cận có toạ độ)
 * cạnh danh sách "Khoảng cách đến các địa điểm quan trọng" 5 cột (icon theo nhóm, tên, chip khoảng cách; > 8 hàng → "Xem thêm") — thay tab lân cận theo nhóm cũ.
 * Thiếu toạ độ → không bản đồ, danh sách rộng hết; thiếu cả hai → chỉ còn địa chỉ. Server Component.
 */
export function ProjectLocation({ projectName, location, address, areaLabel, nearby = [] }: ProjectLocationProps) {
  const t = useTranslations("page.projectDetail");
  const addressText = [address, areaLabel].filter(Boolean).join(", ");
  const items = nearby.flatMap((group) => {
    const Icon = CATEGORY_ICON[group.category];
    return group.items.map((item) => ({ icon: <Icon size={16} />, name: item.name, distance: item.distance }));
  });
  // Điểm lân cận có toạ độ thành điểm phụ trên bản đồ (bản đồ dựng một lần cho mọi nhóm).
  const markers: MapMarker[] = nearby.flatMap((group) => group.items.flatMap((item) => (item.location ? [{ ...item.location, label: item.name }] : [])));
  return (
    <DetailSection id={SECTION_DOM_ID.location} eyebrow={t("v2.eyebrow.location")} title={t("v2.titles.location")} description={addressText || null}>
      {(location || items.length > 0) && (
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {location && (
            <div className={items.length > 0 ? "min-w-0 lg:col-span-7" : "min-w-0 lg:col-span-12"}>
              <LazyMap location={location} markers={markers} label={t("location.mapLabel", { name: projectName })} />
            </div>
          )}
          {items.length > 0 && (
            <div className={location ? "min-w-0 lg:col-span-5" : "min-w-0 lg:col-span-12"}>
              <DetailDistanceList items={items} title={t("v2.distanceTitle")} />
            </div>
          )}
        </div>
      )}
    </DetailSection>
  );
}
