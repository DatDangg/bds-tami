import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { ProjectSlideView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";
import { ProjectsSlider } from "./ProjectsSlider";
import { SectionHeading } from "./SectionHeading";
import { SectionMoreLink } from "./SectionMoreLink";

interface FeaturedProjectsProps {
  title: string;
  /** Dòng nhỏ trên tiêu đề / mô tả dưới tiêu đề (admin); thiếu (vd chưa có bản EN) thì ẩn. */
  eyebrow?: string | null;
  description?: string | null;
  slides: ProjectSlideView[];
}

/** Dự án nổi bật (design-spec S01.3, mockup BL-044): đầu khối căn giữa (eyebrow, tiêu đề, gạch ngắn, mô tả), slider trong khung nội dung `max-w-container` (BL-075; ít thẻ thì căn giữa, client), "Xem tất cả" → danh sách dự án. */
export function FeaturedProjects({ title, eyebrow, description, slides }: FeaturedProjectsProps) {
  const t = useTranslations("page.home.projects");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section className="relative isolate overflow-hidden bg-bg-alt pt-section pb-10 [[data-block=about]+&]:pt-4">
      <div className="mx-auto w-full max-w-container px-gutter">
        <SectionHeading id={headingId} title={title} eyebrow={eyebrow} description={description} />
      </div>
      <div className="mx-auto w-full max-w-container">
        <ProjectsSlider slides={slides} labelledBy={headingId} />
      </div>
      <div className="mx-auto mt-4 flex w-full max-w-container justify-center px-gutter">
        <SectionMoreLink href={resolveNavLink("projects", locale)?.href ?? "/"}>{t("viewAll")}</SectionMoreLink>
      </div>
    </section>
  );
}
