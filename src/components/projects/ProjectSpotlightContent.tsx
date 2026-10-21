import { useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SALES_STATUS_BADGE_VARIANT, type ProjectCardData } from "@/lib/projects/project-view";

interface ProjectSpotlightContentProps {
  data: ProjectCardData;
  /** `h2` khi thẻ nổi bật nằm ngay dưới `h1` của trang danh sách. */
  headingLevel?: "h2" | "h3";
}

/**
 * Phần NỘI DUNG (cột phải) của thẻ nổi bật `/du-an` (BL-052): badge danh mục + tình trạng, tên, địa chỉ (trống → tỉnh), mô tả ngắn,
 * "Giá từ · Diện tích · Bàn giao" (ô trống bị bỏ; giá trống → "Liên hệ"), nút "Xem chi tiết" + "Nhận tư vấn" (→ `#lead-form` trang chi tiết).
 * Thuần trình bày: ảnh + mũi tên + bộ đếm do khung `SpotlightSlider` (P1-T02) lo; P1-T05 ghép. Không icon tim.
 */
export function ProjectSpotlightContent({ data, headingLevel = "h2" }: ProjectSpotlightContentProps) {
  const t = useTranslations("projectCard");
  const tStatus = useTranslations("page.projects.salesStatus");
  const Heading = headingLevel;
  const location = data.address ?? data.provinceName;
  const facts = [
    { key: "price", label: t("priceFrom"), value: data.priceFromLabel ?? t("contact"), accent: true },
    ...(data.areaRangeLabel ? [{ key: "area", label: t("area"), value: data.areaRangeLabel, accent: false }] : []),
    ...(data.handoverTime ? [{ key: "handover", label: t("handover"), value: data.handoverTime, accent: false }] : []),
  ];
  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {data.categoryName && <Badge variant="dark">{data.categoryName}</Badge>}
        <Badge variant={SALES_STATUS_BADGE_VARIANT[data.salesStatus]}>{tStatus(data.salesStatus)}</Badge>
      </div>
      <Heading className="line-clamp-2 font-display text-h3">{data.title}</Heading>
      {location && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <MapPin size={16} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      )}
      {data.summary && <p className="line-clamp-3 text-body text-text-secondary">{data.summary}</p>}
      <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.key} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xsmall text-text-muted">{fact.label}</dt>
            <dd className={`font-semibold ${fact.accent ? "text-accent-text" : "text-text"}`}>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex flex-wrap gap-3">
        <Link href={data.href} className={buttonVariants()}>
          {t("viewDetail")}
          <span className="sr-only">: {data.title}</span>
        </Link>
        <Link href={`${data.href}#lead-form`} className={buttonVariants({ variant: "secondary" })}>
          {t("consult")}
          <span className="sr-only">: {data.title}</span>
        </Link>
      </div>
    </div>
  );
}
