import { useTranslations } from "next-intl";
import { ResponsiveImage, type MediaImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOCUMENTS_DOM_ID, LEAD_FORM_DOM_ID } from "@/lib/projects/project-detail-view";
import { SALES_STATUS_BADGE_VARIANT } from "@/lib/projects/project-view";
import type { SalesStatus } from "@/collections/Projects";

interface ProjectHeroProps {
  title: string;
  salesStatus: SalesStatus;
  /** "Phường, Tỉnh" ngắn. */
  areaLabel: string | null;
  /** Ảnh đầu thư viện = ảnh LCP của trang (tải ngay); `null` → nền tối thay ảnh (mọi ảnh đã bị xoá). */
  image: MediaImage | null;
  hasDocuments: boolean;
}

/**
 * Hero S03: ảnh đại diện toàn màn hình (`100svh`, tối đa 900px) + scrim, đáy trái là badge trạng thái, `h1` tên dự án, địa chỉ ngắn
 * và 2 nút (Nhận tư vấn, Tải tài liệu nếu có). Khối tối để nút Outline thành màu sáng. Ảnh trang trí (`alt` rỗng): thông tin
 * của ảnh nằm ở thư viện ảnh bên dưới. Server Component.
 */
export function ProjectHero({ title, salesStatus, areaLabel, image, hasDocuments }: ProjectHeroProps) {
  const t = useTranslations("page.projectDetail");
  const tStatus = useTranslations("page.projects.salesStatus");
  return (
    <section className="theme-dark-block relative isolate flex min-h-[min(100svh,900px)] items-end overflow-hidden bg-dark-deep">
      {image && <ResponsiveImage media={image} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-dark-deep/85 via-dark-deep/35 to-dark-deep/10" />
      <div className="mx-auto flex w-full max-w-container flex-col items-start gap-4 px-gutter pt-24 pb-10 lg:pb-16">
        <Badge variant={SALES_STATUS_BADGE_VARIANT[salesStatus]}>{tStatus(salesStatus)}</Badge>
        <h1 className="max-w-[20ch] font-display text-display text-balance">{title}</h1>
        {areaLabel && <p className="text-lead text-on-dark-muted">{areaLabel}</p>}
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={`#${LEAD_FORM_DOM_ID}`}>{t("heroConsult")}</a>
          </Button>
          {hasDocuments && (
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a href={`#${DOCUMENTS_DOM_ID}`}>{t("heroDocuments")}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
