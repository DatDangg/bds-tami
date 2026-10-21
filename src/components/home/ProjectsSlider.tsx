"use client";

import { useTranslations } from "next-intl";
import { CardSlider } from "@/components/layout/CardSlider";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectSlideView } from "@/lib/home/home-view";

/** Khớp bề rộng slide của `CardSlider`: 82vw < sm, 320px ≥ sm, 272px ≥ lg. */
const IMAGE_SIZES = "(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw";

/**
 * Slider dự án nổi bật (design-spec S01 khối 3, BL-044/BL-045): `CardSlider` + `ProjectCard` — biến thể `home` (thẻ BL-045, không tag / giá — BL-052 F3 giữ thẻ trang chủ), KHÔNG icon tim.
 * `ProjectSlideView` đã chứa mọi trường thẻ cần (tên, link, tỉnh, ảnh, trạng thái) nên truyền thẳng làm `data`.
 */
export function ProjectsSlider({ slides, labelledBy }: { slides: ProjectSlideView[]; labelledBy: string }) {
  const t = useTranslations("page.home.projects");
  const items = slides.map((slide) => (
    <ProjectCard
      key={slide.id}
      variant="home"
      data={{ id: slide.id, title: slide.title, href: slide.href, provinceName: slide.provinceName, cover: slide.image, salesStatus: slide.salesStatus }}
      headingLevel="h3"
      sizes={IMAGE_SIZES}
    />
  ));
  // `raw`: giữ nguyên `{index}` / `{total}` để CardSlider thay (nhãn truyền được từ Server Component).
  const labels = { slide: t.raw("slide") as string, previous: t("previous"), next: t("next"), dots: t("dots"), goTo: t.raw("goTo") as string };
  return <CardSlider items={items} labelledBy={labelledBy} labels={labels} />;
}
