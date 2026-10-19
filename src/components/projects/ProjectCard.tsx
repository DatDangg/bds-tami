import { useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { SALES_STATUS_BADGE_VARIANT, type ProjectCardData } from "@/lib/projects/project-view";

const IMAGE_ZOOM =
  "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";

interface ProjectCardProps {
  data: ProjectCardData;
  /** Ảnh LCP của trang (thẻ đầu tiên): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Cấp heading của tên dự án theo vị trí trong trang: `h2` ở danh sách (ngay dưới `h1`), `h3` ở "Dự án khác" cuối trang chi tiết. */
  headingLevel?: "h2" | "h3";
}

/**
 * Thẻ Dự án (design-spec §3.2): ảnh 4:5 (< md) / 4:3 (≥ md), badge trạng thái mở bán góc trên trái ảnh, tên dự án tối đa 2 dòng,
 * tỉnh/thành và "Từ <giá>". Cả thẻ là MỘT link (không lồng link); tên là `h2` vì thẻ nằm ngay dưới `h1` của banner. Server Component.
 */
export function ProjectCard({ data, priority = false, headingLevel = "h2" }: ProjectCardProps) {
  const t = useTranslations("page.projects");
  const Heading = headingLevel;
  return (
    <article>
      <Link
        href={data.href}
        className="group flex min-h-11 flex-col gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
      >
        <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-muted md:aspect-[4/3] ${IMAGE_ZOOM}`}>
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" priority={priority} decorative />
          ) : (
            // Dự án xuất bản nhưng mọi ảnh thư viện đã bị xoá: khung giữ nguyên tỉ lệ, không vỡ lưới.
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
          <Badge variant={SALES_STATUS_BADGE_VARIANT[data.salesStatus]} className="absolute top-3 left-3">
            {t(`salesStatus.${data.salesStatus}`)}
          </Badge>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Heading className="line-clamp-2 font-display text-h3 group-hover:underline group-hover:underline-offset-4">{data.title}</Heading>
          {data.provinceName && <p className="text-small text-text-muted">{data.provinceName}</p>}
          {data.priceFrom && <p className="text-small font-semibold">{t("priceFrom", { price: data.priceFrom })}</p>}
        </div>
      </Link>
    </article>
  );
}
