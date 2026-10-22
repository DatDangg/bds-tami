"use client";

import { useDocumentInfo, useLocale, usePayloadAPI, useFormFields } from "@payloadcms/ui";

import {
  buildSeoPreview,
  homepageSeoFallback,
  publicPageUrl,
  resolveDescriptionValue,
  seoDescriptionSource,
  seoNoPublicPageNote,
  seoPagePathKey,
  seoTitleSource,
  type SeoPreviewResult,
} from "@/lib/admin/seo";
import type { Locale } from "@/i18n/routing";
import { lexicalPlainText } from "@/lib/news/read-time";

/** Đọc giá trị nguyên thuỷ của một ô theo đường dẫn (chỉ vẽ lại khi chính ô đó đổi, không theo mọi lần gõ). */
const useFieldValue = (path: string) => useFormFields(([fields]) => fields[path]?.value);

const SEO_NOTE = "Không bắt buộc. Để trống thì trang tự lấy từ Tiêu đề, Tóm tắt và Ảnh đại diện.";

/**
 * Khung xem trước kết quả Google ở đầu khối SEO (BL-058 T05). Mô phỏng tiêu đề + đường dẫn + mô tả theo đúng
 * quy tắc của `buildPageMetadata`: ô SEO trống thì lấy Tiêu đề / mô tả của route / URL trang, tiêu đề nối tên website.
 * Danh mục (T06): tiêu đề từ ô Tên, URL là trang danh mục theo `scope`; scope không có trang công khai (Dự án, Tuyển dụng)
 * thì thay khung bằng một câu báo. Chỉ hiển thị, không ghi dữ liệu.
 *
 * `path` do Payload truyền vào theo ô đang gắn (`seo.metaTitle`) → nhóm cha suy ra từ chính đường dẫn đó.
 */
export function SeoPreview({ path }: { path: string }) {
  const groupPath = path.replace(/\.metaTitle$/, "");
  // Admin có thể đang ở locale "all"; trang công khai chỉ có vi/en nên bản dịch khác mặc định về vi.
  const adminLocale = String(useLocale());
  const locale: Locale = adminLocale === "en" ? "en" : "vi";
  const { collectionSlug, globalSlug } = useDocumentInfo();
  // Tên website nằm trong Cài đặt chung (localized) — cùng nguồn mà trang công khai dùng để nối tiêu đề.
  const [{ data: siteSettings }] = usePayloadAPI(`/api/globals/site-settings?depth=0&locale=${locale}`);

  const metaTitle = useFieldValue(`${groupPath}.metaTitle`);
  const metaDescription = useFieldValue(`${groupPath}.metaDescription`);
  const canonical = useFieldValue(`${groupPath}.canonical`);
  const title = useFieldValue(seoTitleSource(collectionSlug));
  const slug = useFieldValue("slug");
  const kind = useFieldValue("kind");
  // Danh mục: loại nội dung quyết định trang danh mục công khai (hoặc không có trang).
  const scope = useFieldValue("scope");
  // Bản ghi chưa bật bản dịch EN thì trang công khai không có URL EN (global Trang chủ luôn có cả hai ngôn ngữ).
  const hasEnglish = useFieldValue("hasEnglish");
  const descriptionSource = seoDescriptionSource(collectionSlug);
  // Luôn gọi hook với đường dẫn rỗng khi collection không có trường mô tả dự phòng (không gọi hook có điều kiện).
  const descriptionValue = useFieldValue(descriptionSource ?? "");
  const description = resolveDescriptionValue(descriptionSource, descriptionValue, lexicalPlainText);
  // Trang chủ (global) không có ô Tiêu đề/Tóm tắt: trang công khai dùng bản dịch `page.home.*` làm dự phòng.
  const homeFallback = globalSlug ? homepageSeoFallback(locale) : undefined;

  const pageUrl = publicPageUrl({
    origin: typeof window === "undefined" ? "" : window.location.origin,
    locale,
    pathKey: seoPagePathKey({ collectionSlug, globalSlug, kind, scope }),
    slug,
    // Payload để trống (undefined) với bản ghi chưa từng bật EN ⇒ coi như chưa có bản dịch; global luôn có.
    hasEnglish: globalSlug ? true : hasEnglish === true,
  });

  const preview: SeoPreviewResult = buildSeoPreview({
    metaTitle,
    metaDescription,
    canonical,
    title: homeFallback?.title ?? title,
    siteName: (siteSettings as { siteName?: unknown } | undefined)?.siteName,
    description: homeFallback?.description ?? description,
    pageUrl,
  });

  // Không có trang công khai để xem trước → chỉ một câu báo (hook ở trên vẫn gọi đủ, không gọi có điều kiện).
  const noPublicPageNote = seoNoPublicPageNote({ collectionSlug, scope });
  if (noPublicPageNote) {
    return (
      <section className="tami-seo-preview" aria-label="Trang này không có trên website">
        <p className="tami-seo-preview__note">{noPublicPageNote}</p>
      </section>
    );
  }

  return (
    <section className="tami-seo-preview" aria-label="Xem trước kết quả tìm kiếm trên Google">
      <p className="tami-seo-preview__note">{SEO_NOTE}</p>
      <div className="tami-seo-preview__card">
        <div className="tami-seo-preview__title">{preview.title || "Tiêu đề trang"}</div>
        <div className="tami-seo-preview__url">{preview.url || "Đường dẫn sẽ có sau khi lưu trang"}</div>
        <div className="tami-seo-preview__description">{preview.description || "Mô tả trang sẽ hiện ở đây khi có nội dung."}</div>
      </div>
    </section>
  );
}
