import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { SalesStatus } from "../../collections/Projects";
import type { Locale } from "../../i18n/routing";
import type { Project, Province } from "../../payload-types";
import { CONTENT_ROUTES } from "../content/content-paths";
import { publicDetailPath } from "../content/redirect-paths";
import { populatedMedia, visibleCategory } from "../news/news-view";

export interface ProjectCardData {
  id: string;
  title: string;
  href: string;
  salesStatus: SalesStatus;
  /** Tên tỉnh/thành (ngắn nếu có), `null` khi tỉnh chưa populate. */
  provinceName: string | null;
  categoryName: string | null;
  /** Ảnh đầu tiên của thư viện ảnh = ảnh đại diện (ERD §4.5). */
  cover: MediaImage | null;
}

function provinceLabel(province: Project["province"]): string | null {
  if (!province || typeof province !== "object") return null;
  return (province as Province).shortName || (province as Province).name || null;
}

export function toProjectCardData(doc: Project, locale: Locale): ProjectCardData | null {
  // Dự án không có tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng.
  if (!doc.title || !doc.slug) return null;
  const firstImage = doc.gallery?.find((item) => populatedMedia(item) !== null);
  return {
    id: doc.id,
    title: doc.title,
    href: publicDetailPath(CONTENT_ROUTES.projects, locale, doc.slug),
    salesStatus: doc.salesStatus,
    provinceName: provinceLabel(doc.province),
    categoryName: visibleCategory(doc.category, locale)?.name ?? null,
    cover: firstImage ? populatedMedia(firstImage) : null,
  };
}

export function toProjectCards(docs: readonly Project[], locale: Locale): ProjectCardData[] {
  return docs.flatMap((doc) => {
    const card = toProjectCardData(doc, locale);
    return card ? [card] : [];
  });
}

/** Màu badge trạng thái mở bán (BL-020): Đang bán = gradient xanh, Sắp mở bán = gradient vàng, Đã bàn giao = trung tính. */
export const SALES_STATUS_BADGE_VARIANT = { upcoming: "primary", selling: "success", handed_over: "neutral" } as const satisfies Record<SalesStatus, string>;
