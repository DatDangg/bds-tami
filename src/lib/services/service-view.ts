import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { Locale } from "../../i18n/routing";
import type { Media, Service } from "../../payload-types";
import { CONTENT_ROUTES } from "../content/content-paths";
import { publicDetailPath } from "../content/redirect-paths";

export interface ServiceCardData {
  id: string;
  title: string;
  summary: string;
  href: string;
  cover: MediaImage | null;
}

/** Media đã populate (object) hoặc `null` khi chỉ có id / không có ảnh. */
export function populatedCover(value: Service["coverImage"]): Media | null {
  return value && typeof value === "object" ? value : null;
}

/** Dịch vụ thiếu tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng. */
export function toServiceCards(docs: readonly Service[], locale: Locale): ServiceCardData[] {
  return docs.flatMap((doc) =>
    doc.title && doc.slug
      ? [
          {
            id: doc.id,
            title: doc.title,
            summary: doc.summary ?? "",
            href: publicDetailPath(CONTENT_ROUTES.services, locale, doc.slug),
            cover: populatedCover(doc.coverImage),
          },
        ]
      : [],
  );
}
