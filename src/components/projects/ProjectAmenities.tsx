import { useTranslations } from "next-intl";
import { Check } from "@/components/icons";
import { SECTION_DOM_ID, type AmenityView } from "@/lib/projects/project-detail-view";
import { ProjectSection } from "./ProjectSection";

/**
 * Khối Tiện ích (S03 khối 6): lưới tên tiện ích, 2 cột mobile / 4 cột ≥ lg. Trường `icon` của dữ liệu là chữ tự do (chưa có bảng ánh xạ
 * tới bộ icon), nên mọi tiện ích dùng một dấu tích chung thay vì đoán icon theo tên. Server Component.
 */
export function ProjectAmenities({ amenities }: { amenities: AmenityView[] }) {
  const t = useTranslations("page.projectDetail");
  return (
    <ProjectSection id={SECTION_DOM_ID.amenities} title={t("sections.amenities")}>
      <ul aria-label={t("amenitiesLabel")} className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
        {amenities.map((amenity) => (
          <li key={amenity.id} className="flex items-start gap-3 text-body">
            <Check size={20} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            <span className="min-w-0 break-words">{amenity.name}</span>
          </li>
        ))}
      </ul>
    </ProjectSection>
  );
}
