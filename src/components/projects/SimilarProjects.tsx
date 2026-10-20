import { useTranslations } from "next-intl";
import { useId } from "react";
import { CardSlider } from "@/components/layout/CardSlider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectCardData } from "@/lib/projects/project-view";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * "Dự án tương tự" cuối trang chi tiết Dự án (BL-045 Q8, mockup `.sec.white`, DECISIONS #6): dải nền TRẮNG (tách khỏi phần thông tin nền vàng nhạt), đầu khối canh TRÁI
 * (eyebrow, tiêu đề + chữ nhấn, mô tả) rồi `CardSlider` của `ProjectCard` (cùng thẻ "Dự án nổi bật", không icon tim). Rỗng → không dựng gì. Server Component.
 */
export function SimilarProjects({ projects }: { projects: ProjectCardData[] }) {
  const t = useTranslations("page.projectDetail.similar");
  const headingId = useId();
  if (projects.length === 0) return null;
  const items = projects.map((card) => <ProjectCard key={card.id} data={card} headingLevel="h3" sizes={IMAGE_SIZES} />);
  // `raw`: giữ nguyên `{index}` / `{total}` để CardSlider thay (nhãn truyền được từ Server Component).
  const labels = { slide: t.raw("slide") as string, previous: t("previous"), next: t("next"), dots: t("dots"), goTo: t.raw("goTo") as string };
  return (
    <section aria-labelledby={headingId} className="bg-surface py-section-tight">
      <div className="mx-auto mb-8 w-full max-w-container px-gutter">
        <SectionHeading id={headingId} eyebrow={t("eyebrow")} title={t("title")} titleAccent={t("titleAccent")} description={t("description")} />
      </div>
      {/* Bọc trong container: thẻ đầu thẳng hàng với tiêu đề (CardSlider tự chừa `px-gutter` ở hai đầu danh sách); mockup `.slider` cũng bị cắt ở mép container. */}
      <div className="mx-auto w-full max-w-container">
        <CardSlider items={items} labelledBy={headingId} labels={labels} />
      </div>
    </section>
  );
}
