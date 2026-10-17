import type { MetadataRoute } from "next";

/**
 * Nội dung `robots.txt`. Ngoài production: chặn toàn bộ (staging không được lên chỉ mục). Production: cho phép mọi
 * crawler (kể cả AI), chặn khu quản trị và API. `Sitemap` do task sitemap thêm khi route đó tồn tại.
 */
export function buildRobots(indexingAllowed: boolean): MetadataRoute.Robots {
  if (!indexingAllowed) return { rules: { userAgent: "*", disallow: "/" } };
  // Ảnh upload (kể cả ảnh OG) phục vụ ở /api/media/file/: phải cho crawl dù /api/ bị chặn (longest match thắng).
  return { rules: { userAgent: "*", allow: ["/", "/api/media/file/"], disallow: ["/admin", "/api/"] } };
}
