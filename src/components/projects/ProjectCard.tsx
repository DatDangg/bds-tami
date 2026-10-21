import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CARD_TITLE_CLASS, CardArrow, CardFooter, CardPin } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { SALES_STATUS_BADGE_VARIANT, type ProjectCardData } from "@/lib/projects/project-view";

/** Phần dữ liệu thẻ trang chủ cần; `salesStatus` null (slider trang chủ khi thiếu dữ liệu) thì không dựng badge. */
export type ProjectCardView = Pick<ProjectCardData, "id" | "title" | "href" | "provinceName" | "cover"> & { salesStatus: ProjectCardData["salesStatus"] | null };

interface ProjectCardCommonProps {
  /** Ảnh LCP của trang (thẻ đầu tiên): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Cấp heading của tên dự án theo vị trí trong trang: `h2` ở danh sách (ngay dưới `h1`), `h3` ở khối đã có `h2` (trang chủ, "Dự án tương tự"). */
  headingLevel?: "h2" | "h3";
  /** Ghi đè `sizes` của ảnh khi thẻ nằm trong khung không theo lưới danh sách (slider). */
  sizes?: string;
}

/**
 * - `listing` (mặc định, BL-052): lưới `/du-an`, "Dự án tương tự", thẻ dự án trong trang chi tiết — thêm tag loại sản phẩm + "Giá từ" / "Liên hệ".
 * - `home`: slider "Dự án nổi bật" trang chủ GIỮ thẻ BL-045 (không tag / giá; spec BL-052 F3).
 */
type ProjectCardProps = ProjectCardCommonProps & ({ variant: "home"; data: ProjectCardView } | { variant?: "listing"; data: ProjectCardData });

const DEFAULT_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
/** Số tag loại sản phẩm tối đa trên thẻ; phần còn lại gộp thành "+n". */
const MAX_TYPE_TAGS = 3;

/** Ảnh 11:10 + badge trạng thái mở bán góc trên trái (chung hai biến thể). */
function CardMedia({ data, priority, sizes }: { data: ProjectCardView; priority: boolean; sizes: string }) {
  const t = useTranslations("page.projects");
  return (
    <div className={`relative aspect-[11/10] w-full shrink-0 overflow-hidden bg-surface-muted ${CARD_IMAGE_ZOOM}`}>
      {data.cover ? (
        <ResponsiveImage media={data.cover} sizes={sizes} priority={priority} decorative />
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
  );
}

/** Thân thẻ `listing`: ghim tỉnh → ≤ 3 tag loại sản phẩm (+n) → chân thẻ "Giá từ" vàng (hoặc "Liên hệ") + mũi tên tròn. */
function ListingBody({ data }: { data: ProjectCardData }) {
  const t = useTranslations("projectCard");
  const tType = useTranslations("listingOptions.propertyType");
  const shownTypes = data.productTypes.slice(0, MAX_TYPE_TAGS);
  const hiddenTypes = data.productTypes.length - shownTypes.length;
  return (
    <>
      {data.provinceName && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <CardPin label={data.provinceName} />
        </p>
      )}
      {shownTypes.length > 0 && (
        <ul aria-label={t("productTypesLabel")} className="flex flex-wrap gap-1.5">
          {shownTypes.map((type) => (
            <li key={type} className="rounded-pill bg-surface-muted px-2.5 py-0.5 text-xsmall text-text-secondary">
              {tType(type)}
            </li>
          ))}
          {hiddenTypes > 0 && (
            <li className="rounded-pill bg-surface-muted px-2.5 py-0.5 text-xsmall text-text-secondary">
              <span aria-hidden="true">{t("moreTypes", { count: hiddenTypes })}</span>
              <span className="sr-only">{t("moreTypesLabel", { count: hiddenTypes })}</span>
            </li>
          )}
        </ul>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        {data.priceFromLabel ? (
          <p className="flex min-w-0 flex-col">
            <span className="text-xsmall text-text-muted">{t("priceFrom")}</span>
            <span className="truncate text-body font-semibold text-accent-text">{data.priceFromLabel}</span>
          </p>
        ) : (
          <p className="text-body font-semibold text-accent-text">{t("contact")}</p>
        )}
        <CardArrow />
      </div>
    </>
  );
}

/**
 * Thẻ Dự án DÙNG CHUNG: thẻ trắng bo 20px viền token, ảnh 11:10 + badge trạng thái, tên 2 dòng, nút mũi tên tròn. Không icon tim.
 * Cả thẻ là MỘT link (không lồng link; hover BL-034). Server hoặc Client Component. Biến thể: xem `ProjectCardProps`.
 */
export function ProjectCard(props: ProjectCardProps) {
  const { priority = false, headingLevel = "h2", sizes = DEFAULT_SIZES } = props;
  const Heading = headingLevel;
  let body: ReactNode;
  if (props.variant === "home") {
    body = <CardFooter>{props.data.provinceName && <CardPin label={props.data.provinceName} />}</CardFooter>;
  } else {
    body = <ListingBody data={props.data} />;
  }
  return (
    <article className="h-full" data-card-variant={props.variant ?? "listing"}>
      <Link href={props.data.href} className={CARD_LINK_CLASS}>
        <CardMedia data={props.data} priority={priority} sizes={sizes} />
        <div className={`flex min-w-0 flex-1 flex-col p-4 sm:p-5 ${props.variant === "home" ? "gap-3" : "gap-2"}`}>
          <Heading className={CARD_TITLE_CLASS}>{props.data.title}</Heading>
          {body}
        </div>
      </Link>
    </article>
  );
}
