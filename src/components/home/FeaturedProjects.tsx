import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { ProjectSlideView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";
import { ProjectsSlider } from "./ProjectsSlider";

interface FeaturedProjectsProps {
  title: string;
  /** Dòng nhỏ trên tiêu đề / mô tả dưới tiêu đề (admin); thiếu (vd chưa có bản EN) thì ẩn. */
  eyebrow?: string | null;
  description?: string | null;
  slides: ProjectSlideView[];
}

/** Dự án nổi bật (design-spec S01.3, mockup BL-044): đầu khối căn giữa (eyebrow, tiêu đề, gạch ngắn, mô tả), slider tràn viền (client), "Xem tất cả" → danh sách dự án. */
export function FeaturedProjects({ title, eyebrow, description, slides }: FeaturedProjectsProps) {
  const t = useTranslations("page.home.projects");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section className="relative isolate overflow-hidden bg-bg-alt pt-section pb-10 [[data-block=about]+&]:pt-4">
      <div className="mx-auto mb-10 flex w-full max-w-container flex-col items-center gap-3 px-gutter text-center">
        {eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{eyebrow}</p>}
        <h2 id={headingId} className="font-display text-h2">
          {title}
        </h2>
        <span aria-hidden="true" className="h-0.5 w-12 bg-primary" />
        {description && <p className="max-w-[80ch] text-lead text-text-secondary">{description}</p>}
      </div>
      <ProjectsSlider slides={slides} labelledBy={headingId} />
      <div className="mx-auto mt-4 flex w-full max-w-container justify-center px-gutter">
        <Button asChild variant="ghost">
          <Link href={resolveNavLink("projects", locale)?.href ?? "/"}>
            {t("viewAll")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
