import { useTranslations } from "next-intl";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { DetailFeatureList } from "@/components/detail/DetailFeatureList";
import { DetailSection } from "@/components/detail/DetailSection";
import { SECTION_DOM_ID, type AmenityView } from "@/lib/projects/project-detail-view";

/** Hiện ngần này tiện ích trước nút "Khám phá tất cả tiện ích" (design: 5 mục cạnh ảnh). */
const INITIAL_AMENITIES = 5;

/**
 * Khối Tiện ích nổi bật (BL-052, design `detail-du-an`; dải rộng hết khung): eyebrow "Không gian sống" + `h2` → `amenitiesImage` lớn bên trái (không có → danh sách rộng hết, 2 cột)
 * + danh sách tiện ích (icon + tên + mô tả), > 5 mục → nút "Khám phá tất cả tiện ích" mở phần còn lại. Trường `icon` của dữ liệu là chữ tự do chưa có bảng ánh xạ tới bộ icon
 * nên mọi mục dùng dấu tích chung (mặc định của `DetailFeatureList`) thay vì đoán theo tên. Server Component (danh sách là client).
 */
export function ProjectAmenities({ amenities, image }: { amenities: AmenityView[]; image: MediaImage | null }) {
  const t = useTranslations("page.projectDetail.v2");
  return (
    <DetailSection id={SECTION_DOM_ID.amenities} eyebrow={t("eyebrow.amenities")} title={t("titles.amenities")}>
      <DetailFeatureList
        items={amenities.map((amenity) => ({ title: amenity.name, description: amenity.description }))}
        initialCount={INITIAL_AMENITIES}
        expandLabel={t("amenitiesExpand")}
        image={image}
      />
    </DetailSection>
  );
}
