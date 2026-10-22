import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { DetailDistanceList } from "@/components/detail/DetailDistanceList";
import { DetailSection } from "@/components/detail/DetailSection";
import { Bus, FirstAid, GraduationCap, MapPin, ShoppingBag, Tree } from "@/components/icons";
import { cn } from "@/lib/utils";
import { LazyMap, type MapMarker } from "@/components/media/LazyMap";
import type { LatLng } from "@/components/media/map-geometry";
import { SECTION_DOM_ID, type LocationMediaView, type NearbyCategory, type NearbyGroupView } from "@/lib/projects/project-detail-view";
import { ProjectLocationMedia } from "./ProjectLocationMedia";

/** Icon theo nhóm địa điểm (cùng giá trị `nearbyAmenities.category`). */
const CATEGORY_ICON: Record<NearbyCategory, ComponentType<{ size?: number }>> = {
  education: GraduationCap,
  healthcare: FirstAid,
  shopping: ShoppingBag,
  park: Tree,
  transport: Bus,
  other: MapPin,
};

/**
 * Số cột (lưới 12 cột ≥ lg) của từng phần. Chuỗi class viết nguyên văn để Tailwind quét được. Không có thẻ media → 7/5 như cũ (hoặc 12 khi chỉ còn một phần).
 * Có thẻ: đủ ba phần → xl 5/4/3 (lg: bản đồ + danh sách 7/5, thẻ hàng dưới 5 cột); thiếu một phần → phần còn lại + thẻ chia 8/4.
 */
function mapSpan(hasList: boolean, hasMedia: boolean): string {
  if (!hasMedia) return hasList ? "lg:col-span-7" : "lg:col-span-12";
  return hasList ? "lg:col-span-7 xl:col-span-5" : "lg:col-span-8";
}

function listSpan(hasMap: boolean, hasMedia: boolean): string {
  if (!hasMedia) return hasMap ? "lg:col-span-5" : "lg:col-span-12";
  return hasMap ? "lg:col-span-5 xl:col-span-4" : "lg:col-span-8";
}

function mediaSpan(hasMap: boolean, hasList: boolean): string {
  if (hasMap && hasList) return "lg:col-span-5 xl:col-span-3";
  return hasMap || hasList ? "lg:col-span-4" : "lg:col-span-6";
}

interface ProjectLocationProps {
  projectName: string;
  location: LatLng | null;
  address: string | null;
  areaLabel: string | null;
  /** Địa điểm quanh dự án theo nhóm (chỉ nhóm có dòng, đúng thứ tự `NEARBY_CATEGORY_ORDER`). */
  nearby?: NearbyGroupView[];
  /** Thẻ ảnh/video "Kết nối hạ tầng" (BL-060); có thì thêm cột bên phải, không có thì bố cục như cũ. */
  locationMedia?: LocationMediaView | null;
}

/**
 * Khối Vị trí (BL-052, design `detail-du-an`; dải rộng hết khung): eyebrow "Kết nối" + `h2` + địa chỉ (đoạn mô tả) → ≥ lg bản đồ lười 7 cột (điểm dự án + điểm lân cận có toạ độ)
 * cạnh danh sách "Khoảng cách đến các địa điểm quan trọng" 5 cột (icon theo nhóm, tên, chip khoảng cách; > 8 hàng → "Xem thêm") — thay tab lân cận theo nhóm cũ.
 * Thiếu toạ độ → không bản đồ, danh sách rộng hết; thiếu cả hai → chỉ còn địa chỉ. Có `locationMedia` (BL-060) → thêm thẻ ảnh/video "Kết nối hạ tầng": ≥ xl lưới 5 · 4 · 3 cột (bản đồ · danh sách · thẻ),
 * lg bản đồ + danh sách như cũ và thẻ xuống hàng dưới, < lg xếp dọc; thiếu bản đồ hoặc danh sách thì thẻ nhận phần còn lại (8 · 4 cột). Server Component.
 */
export function ProjectLocation({ projectName, location, address, areaLabel, nearby = [], locationMedia = null }: ProjectLocationProps) {
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
      {(location || items.length > 0 || locationMedia) && (
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {location && (
            <div className={cn("min-w-0", mapSpan(items.length > 0, locationMedia !== null))}>
              <LazyMap location={location} markers={markers} label={t("location.mapLabel", { name: projectName })} />
            </div>
          )}
          {items.length > 0 && (
            <div className={cn("min-w-0", listSpan(location !== null, locationMedia !== null))}>
              <DetailDistanceList items={items} title={t("v2.distanceTitle")} />
            </div>
          )}
          {locationMedia && (
            <div className={cn("min-w-0", mediaSpan(location !== null, items.length > 0))}>
              <ProjectLocationMedia media={locationMedia} />
            </div>
          )}
        </div>
      )}
    </DetailSection>
  );
}
