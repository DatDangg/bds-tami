import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { ProjectSlideView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";
import { ProjectsSlider } from "./ProjectsSlider";

/** Dự án nổi bật (design-spec S01.3): tiêu đề giữa, slider tràn viền (client), "Xem tất cả" → danh sách dự án. */
export function FeaturedProjects({ title, slides }: { title: string; slides: ProjectSlideView[] }) {
  const t = useTranslations("page.home.projects");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section className="relative isolate overflow-hidden bg-bg-alt py-section">
      <h2 id={headingId} className="mx-auto mb-10 w-full max-w-container px-gutter text-center font-display text-h2">
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
