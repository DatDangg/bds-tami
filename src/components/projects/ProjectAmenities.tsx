import { useId } from "react";
import { useTranslations } from "next-intl";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { DetailFeatureList } from "@/components/detail/DetailFeatureList";
import { DetailSection } from "@/components/detail/DetailSection";
import { CardSlider } from "@/components/layout/CardSlider";
import { CheckCircle } from "@/components/icons";
import { SECTION_DOM_ID, type AmenityView } from "@/lib/projects/project-detail-view";

/** Hiện ngần này tiện ích trước nút "Khám phá tất cả tiện ích" (design: 5 mục cạnh ảnh). */
const INITIAL_AMENITIES = 5;

/** Bề rộng thẻ trong slider: khớp `SLIDE_WIDTH` của `CardSlider` (82% < sm, 320px ≥ sm, 272px ≥ lg). */
const SLIDER_IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

function AmenityCard({ amenity }: { amenity: AmenityView }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="relative aspect-[4/3] bg-surface-muted">
        {amenity.image ? (
          <ResponsiveImage media={amenity.image} alt={amenity.image.alt ?? amenity.name} sizes={SLIDER_IMAGE_SIZES} />
        ) : (
          <div className="flex size-full items-center justify-center text-accent-text" aria-hidden="true">
            <CheckCircle size={40} weight="fill" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-body font-semibold">{amenity.name}</h3>
        {amenity.description && <p className="line-clamp-3 text-small text-text-secondary">{amenity.description}</p>}
      </div>
    </article>
  );
}

/**
 * Khối Tiện ích nổi bật (BL-052, design `detail-du-an`; dải rộng hết khung): eyebrow "Không gian sống" + `h2`. Hai chế độ:
 * - Có ≥ 1 tiện ích có ảnh riêng (BL-060) → slider thẻ (`CardSlider` dùng chung, mũi tên hai mép từ md, vuốt ở mobile): ảnh 4:3 + tên + mô tả; mục không ảnh dùng ô nền muted + dấu tích để thẻ đều nhau. `amenitiesImage` chung không dùng.
 * - Không mục nào có ảnh → như cũ: `amenitiesImage` lớn bên trái (không có → rộng hết) + danh sách icon + tên + mô tả, > 5 mục → nút "Khám phá tất cả tiện ích".
 * Trường `icon` của dữ liệu là chữ tự do chưa có bảng ánh xạ tới bộ icon nên danh sách dùng dấu tích chung. Server Component (slider/danh sách là client).
 */
export function ProjectAmenities({ amenities, image }: { amenities: AmenityView[]; image: MediaImage | null }) {
  const t = useTranslations("page.projectDetail.v2");
  const sliderLabelId = useId();
  const hasImages = amenities.some((amenity) => amenity.image);
  return (
    <DetailSection id={SECTION_DOM_ID.amenities} eyebrow={t("eyebrow.amenities")} title={t("titles.amenities")}>
      {hasImages ? (
        <>
          <p id={sliderLabelId} className="sr-only">
            {t("titles.amenities")}
          </p>
          {/* `CardSlider` tự đệm `px-gutter`: kéo ra hai bên đúng bấy nhiêu để thẻ đầu thẳng hàng với cột nội dung. */}
          <div className="-mx-gutter">
            <CardSlider
              items={amenities.map((amenity) => (
                <AmenityCard key={amenity.id} amenity={amenity} />
              ))}
              labelledBy={sliderLabelId}
              arrows="sides"
              labels={{
                slide: t.raw("amenitiesSlider.slide") as string,
                previous: t("amenitiesSlider.previous"),
                next: t("amenitiesSlider.next"),
                dots: t("amenitiesSlider.dots"),
                goTo: t.raw("amenitiesSlider.goTo") as string,
              }}
            />
          </div>
        </>
      ) : (
        <DetailFeatureList
          items={amenities.map((amenity) => ({ title: amenity.name, description: amenity.description }))}
          initialCount={INITIAL_AMENITIES}
          expandLabel={t("amenitiesExpand")}
          image={image}
        />
      )}
    </DetailSection>
  );
}
