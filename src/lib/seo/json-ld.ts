export interface BreadcrumbEntry {
  label: string;
  /** Đường dẫn nội bộ đã có tiền tố ngôn ngữ (vd `/en/projects`). */
  href: string;
}

/**
 * JSON-LD `BreadcrumbList` (schema.org). `position` bắt đầu từ 1; URL tuyệt đối vì Google không nhận đường dẫn tương đối.
 * Mục cuối (trang hiện tại) cũng có `item` để mỗi mục đều hợp lệ.
 */
export function buildBreadcrumbJsonLd(entries: readonly BreadcrumbEntry[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.label,
      item: new URL(entry.href, siteUrl).toString(),
    })),
  };
}

/** Nhúng JSON vào `<script>`: thay `<` để chuỗi như `</script>` trong nội dung không đóng thẻ sớm (XSS). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
