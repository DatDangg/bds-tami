import type { Locale } from "../../i18n/routing";
import { CONTENT_ROUTES, LEGAL_PAGE_ROUTES, publicPath, type LegalPageKind } from "./content-paths";
import { publicDetailPath } from "./redirect-paths";

/** Giá trị trường `fields.doc` của link nội bộ trong Lexical: `{ relationTo, value }`, `value` là doc đã populate hoặc chỉ id. */
interface InternalDocRef {
  relationTo?: unknown;
  value?: unknown;
}

interface PopulatedDoc {
  slug?: unknown;
  kind?: unknown;
  hasEnglish?: unknown;
}

const isLegalKind = (kind: unknown): kind is LegalPageKind => typeof kind === "string" && Object.hasOwn(LEGAL_PAGE_ROUTES, kind);

/**
 * URL công khai của một link nội bộ (`linkType: "internal"`) theo ngôn ngữ đang xem; `null` nếu không dựng được link an toàn:
 * doc chưa populate (chỉ có id, vd doc đã vào thùng rác nên khách không đọc được), collection không có trang công khai
 * (vd `leads`), hoặc ở `/en` mà doc chưa có bản EN (tránh link tới 404). Nơi gọi giữ chữ của link khi trả `null`.
 */
export function resolveInternalDocHref(ref: unknown, locale: Locale): string | null {
  if (typeof ref !== "object" || ref === null) return null;
  const { relationTo, value } = ref as InternalDocRef;
  if (typeof relationTo !== "string" || typeof value !== "object" || value === null) return null;
  const doc = value as PopulatedDoc;
  if (locale === "en" && doc.hasEnglish !== true) return null;

  if (relationTo === "pages") return isLegalKind(doc.kind) ? publicPath(LEGAL_PAGE_ROUTES[doc.kind], locale) : null;
  if (!Object.hasOwn(CONTENT_ROUTES, relationTo)) return null;
  if (typeof doc.slug !== "string" || doc.slug === "") return null;
  return publicDetailPath(CONTENT_ROUTES[relationTo as keyof typeof CONTENT_ROUTES], locale, doc.slug);
}
