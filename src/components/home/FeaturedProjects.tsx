import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { ProjectSlideView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";
import { ProjectsSlider } from "./ProjectsSlider";

/** Dự án nổi bật (design-spec S01.3): tiêu đề giữa + watermark, slider tràn viền (client), "Xem tất cả" → danh sách dự án. */
export function FeaturedProjects({ title, slides }: { title: string; slides: ProjectSlideView[] }) {
  const t = useTranslations("page.home.projects");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section className="relative isolate overflow-hidden bg-bg-alt py-section">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-8 left-1/2 -z-10 hidden -translate-x-1/2 font-display text-watermark text-accent-display/10 uppercase select-none md:block"
      >
        {t("watermark")}
      </span>
      <h2 id={headingId} className="mx-auto mb-10 w-full max-w-container px-gutter text-center font-display text-h1 uppercase">
        {title}
      </h2>
      <ProjectsSlider slides={slides} labelledBy={headingId} />
      <div className="mx-auto mt-8 flex w-full max-w-container justify-center px-gutter">
        <Button asChild variant="ghost">
          <Link href={resolveNavLink("projects", locale)?.href ?? "/"}>{t("viewAll")}</Link>
        </Button>
      </div>
    </section>
  );
}
