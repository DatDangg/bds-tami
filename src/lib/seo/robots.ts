import type { MetadataRoute } from "next";

/**
 * Crawler AI cho phép đọc nội dung công khai (ai-friendly-web). Gộp chung nhóm quy tắc với `*` nên chịu cùng `disallow`:
 * một nhóm riêng theo tên bot sẽ BỎ QUA nhóm `*`, nếu tách ra sẽ vô tình mở `/admin` cho các bot này.
 */
export const AI_CRAWLERS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "anthropic-ai"] as const;

/**
 * Nội dung `robots.txt`. Ngoài production: chặn toàn bộ (staging không được lên chỉ mục) và KHÔNG khai `Sitemap`.
 * Production: cho phép mọi crawler (kể cả AI), chặn khu quản trị và API, trỏ tới sitemap index khi biết URL gốc.
 */
export function buildRobots(indexingAllowed: boolean, siteUrl?: string): MetadataRoute.Robots {
  if (!indexingAllowed) return { rules: { userAgent: "*", disallow: "/" } };
  // Ảnh upload (kể cả ảnh OG) phục vụ ở /api/media/file/: phải cho crawl dù /api/ bị chặn (longest match thắng).
  return {
    rules: { userAgent: ["*", ...AI_CRAWLERS], allow: ["/", "/api/media/file/"], disallow: ["/admin", "/api/"] },
    ...(siteUrl ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() } : {}),
  };
}
