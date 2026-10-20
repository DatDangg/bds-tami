import { useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CARD_TITLE_CLASS, CardFooter, CardPin } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { SALES_STATUS_BADGE_VARIANT, type ProjectCardData } from "@/lib/projects/project-view";

/** Phần dữ liệu thẻ cần; `salesStatus` null (slider trang chủ khi thiếu dữ liệu) thì không dựng badge. */
export type ProjectCardView = Pick<ProjectCardData, "id" | "title" | "href" | "provinceName" | "cover"> & { salesStatus: ProjectCardData["salesStatus"] | null };

interface ProjectCardProps {
  data: ProjectCardView;
  /** Ảnh LCP của trang (thẻ đầu tiên): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Cấp heading của tên dự án theo vị trí trong trang: `h2` ở danh sách (ngay dưới `h1`), `h3` ở khối đã có `h2` (trang chủ, "Dự án khác"). */
  headingLevel?: "h2" | "h3";
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới danh sách (slider trang chủ). */
  sizes?: string;
}

const DEFAULT_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * Thẻ Dự án DÙNG CHUNG (lưới `/du-an`, slider "Dự án nổi bật" trang chủ, "Dự án khác"; BL-045): thẻ trắng bo 20px viền token, ảnh 11:10 + badge trạng thái mở bán
 * góc trên trái, tên 2 dòng, hàng cuối ghim tỉnh/thành + nút mũi tên tròn. Không có icon tim. Cả thẻ là MỘT link (không lồng link). Server hoặc Client Component.
 */
export function ProjectCard({ data, priority = false, headingLevel = "h2", sizes }: ProjectCardProps) {
  const t = useTranslations("page.projects");
  const Heading = headingLevel;
  return (
    <article className="h-full">
      <Link href={data.href} className={CARD_LINK_CLASS}>
        <div className={`relative aspect-[11/10] w-full shrink-0 overflow-hidden bg-surface-muted ${CARD_IMAGE_ZOOM}`}>
          {data.cover ? (
            <ResponsiveImage media={data.cover} sizes={sizes ?? DEFAULT_SIZES} priority={priority} decorative />
          ) : (
            // Dự án xuất bản nhưng mọi ảnh thư viện đã bị xoá: khung giữ nguyên tỉ lệ, không vỡ lưới.
            <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
          )}
          {data.salesStatus && (
            <Badge variant={SALES_STATUS_BADGE_VARIANT[data.salesStatus]} className="absolute top-3 left-3">
              {t(`salesStatus.${data.salesStatus}`)}
            </Badge>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <Heading className={CARD_TITLE_CLASS}>{data.title}</Heading>
          <CardFooter>{data.provinceName && <CardPin label={data.provinceName} />}</CardFooter>
        </div>
      </Link>
    </article>
  );
}
