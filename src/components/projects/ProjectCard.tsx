import { useTranslations } from "next-intl";
import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import type { ProjectCardData } from "@/lib/projects/project-view";

const IMAGE_ZOOM =
  "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";

interface ProjectCardProps {
  data: ProjectCardData;
  /** Ảnh LCP của trang (thẻ đầu tiên): tải ngay thay vì lazy. */
  priority?: boolean;
}

/**
 * Thẻ Dự án (design-spec §3.2): ảnh 4:5 (< md) / 4:3 (≥ md), badge trạng thái mở bán góc trên trái ảnh, tên dự án tối đa 2 dòng,
 * tỉnh/thành và "Từ <giá>". Cả thẻ là MỘT link (không lồng link); tên là `h2` vì thẻ nằm ngay dưới `h1` của banner. Server Component.
 */
export function ProjectCard({ data, priority = false }: ProjectCardProps) {
  const t = useTranslations("page.projects");
  return (
    <article>
      <Link
        href={data.href}
        className="group flex min-h-11 flex-col gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
      >
        <div className={`relative aspect-[4/5] w-full overflow-hidden bg-surface-muted md:aspect-[4/3] ${IMAGE_ZOOM}`}>
          {data.cover && (
            <ResponsiveImage media={data.cover} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" priority={priority} decorative />
          )}
          <Badge variant={data.salesStatus === "handed_over" ? "neutral" : "primary"} className="absolute top-3 left-3">
            {t(`salesStatus.${data.salesStatus}`)}
          </Badge>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="line-clamp-2 font-display text-h3 group-hover:underline group-hover:underline-offset-4">{data.title}</h2>
          {data.provinceName && <p className="text-small text-text-muted">{data.provinceName}</p>}
          {data.priceFrom && <p className="text-small font-semibold">{t("priceFrom", { price: data.priceFrom })}</p>}
        </div>
      </Link>
    </article>
  );
}
