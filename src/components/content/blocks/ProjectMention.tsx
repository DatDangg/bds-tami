import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { ProjectCardData } from "@/lib/projects/project-view";
import { cn } from "@/lib/utils";

/**
 * Khối "Dự án nhắc đến" (BL-054): thẻ ngang ảnh · eyebrow · tên · tỉnh/loại/tình trạng · "Xem chi tiết" (< sm xếp dọc). Cả thẻ là MỘT link
 * tới trang dự án theo ngôn ngữ (như thẻ dự án dùng chung). Dữ liệu là dự án công khai đã tải theo `locale` (`loadMentionedProjects`).
 */
export function ProjectMention({ project }: { project: ProjectCardData }) {
  const t = useTranslations("newsBlocks");
  const tProjects = useTranslations("page.projects");
  const meta = [project.provinceName, project.categoryName, tProjects(`salesStatus.${project.salesStatus}`)].filter(Boolean).join(" · ");
  return (
    <div className="my-8 first:mt-0">
      <Link href={project.href} className={cn(CARD_LINK_CLASS, "h-auto gap-4 p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4")}>
        <div className={cn("relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:w-40", CARD_IMAGE_ZOOM)}>
          {project.cover && <ResponsiveImage media={project.cover} sizes="(min-width: 640px) 160px, 100vw" decorative />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-eyebrow font-semibold text-accent-text uppercase">{t("projectMentionEyebrow")}</span>
          <span className="font-display text-h4 transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{project.title}</span>
          {meta && <span className="text-small text-text-muted">{meta}</span>}
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 text-small font-semibold text-accent-text">
          {t("viewDetail")}
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
