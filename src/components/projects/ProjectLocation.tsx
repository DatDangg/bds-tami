import { useTranslations } from "next-intl";
import { LazyMap } from "@/components/media/LazyMap";
import type { LatLng } from "@/components/media/map-geometry";
import { SECTION_DOM_ID } from "@/lib/projects/project-detail-view";
import { ProjectSection } from "./ProjectSection";

interface ProjectLocationProps {
  projectName: string;
  location: LatLng | null;
  address: string | null;
  areaLabel: string | null;
}

/**
 * Khối Vị trí (S03 khối 5): bản đồ lười 7 cột + địa chỉ 5 cột (≥ lg); < lg bản đồ trên, địa chỉ dưới. Không có toạ độ hợp lệ thì chỉ
 * hiện địa chỉ (không dựng bản đồ sai chỗ). Dự án luôn công khai địa chỉ nên bản đồ ghim chính xác, không phải vòng gần đúng.
 */
export function ProjectLocation({ projectName, location, address, areaLabel }: ProjectLocationProps) {
  const t = useTranslations("page.projectDetail");
  const addressText = [address, areaLabel].filter(Boolean).join(", ");
  return (
    <ProjectSection id={SECTION_DOM_ID.location} title={t("sections.location")}>
      <div className="grid gap-8 xl:grid-cols-12 xl:gap-12">
        {location && (
          <div className="xl:col-span-7">
            <LazyMap location={location} label={t("location.mapLabel", { name: projectName })} />
          </div>
        )}
        {addressText && (
          <div className={location ? "xl:col-span-5" : "xl:col-span-12"}>
            <h3 className="mb-2 text-small font-semibold text-text-muted">{t("location.address")}</h3>
            <p className="font-display text-h3">{addressText}</p>
          </div>
        )}
      </div>
    </ProjectSection>
  );
}
