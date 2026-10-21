import { PUBLIC_STATUSES } from "../../access/publishedOnly";
import { type Locale, locales } from "../../i18n/routing";
import { resolveInternalDocHref } from "../content/doc-link";

/** Phần của doc đã lưu mà việc dựng link cần; mọi trường đều có thể thiếu/sai kiểu (dữ liệu từ form admin). */
export interface SavedDocForSiteLink {
  slug?: unknown;
  status?: unknown;
  kind?: unknown;
  hasEnglish?: unknown;
  deletedAt?: unknown;
}

export interface PublicDocUrlInput {
  collectionSlug: string | undefined;
  /** Doc đã LƯU (không phải giá trị đang gõ dở trong form); `undefined` khi đang tạo mới. */
  savedDoc: SavedDocForSiteLink | undefined;
  /** Ngôn ngữ đang sửa trong admin. */
  locale: string | undefined;
  /** `NEXT_PUBLIC_SITE_URL`. */
  siteUrl: string;
}

const isLocale = (value: unknown): value is Locale => locales.some((locale) => locale === value);

const isPublicStatus = (collectionSlug: string, status: unknown): boolean => {
  const allowed: readonly string[] = collectionSlug === "rentals" ? PUBLIC_STATUSES.rentals : PUBLIC_STATUSES.default;
  return typeof status === "string" && allowed.includes(status);
};

/**
 * URL tuyệt đối trang công khai của doc đang sửa ("Xem trên website", BL-051 A7), hoặc `null` để KHÔNG hiện nút.
 * Bám đúng điều kiện khách thấy (`publicWhere`): doc đã lưu, status công khai (`published`; Cho thuê thêm `rented`), chưa vào thùng rác,
 * ở EN thì `hasEnglish`; đường dẫn dựng bằng `resolveInternalDocHref` (cùng helper link nội bộ Lexical) nên vi/en đúng route và slug theo ngôn ngữ.
 * Collection không có trang công khai (Lead, Media…) hoặc doc thiếu slug → `null`, không bao giờ link tới 404/bản nháp.
 */
export function publicDocUrl({ collectionSlug, savedDoc, locale, siteUrl }: PublicDocUrlInput): string | null {
  if (!collectionSlug || !savedDoc || !isLocale(locale) || !siteUrl) return null;
  if (!isPublicStatus(collectionSlug, savedDoc.status) || savedDoc.deletedAt) return null;
  const path = resolveInternalDocHref({ relationTo: collectionSlug, value: savedDoc }, locale);
  return path === null ? null : `${siteUrl.replace(/\/+$/, "")}${path}`;
}
