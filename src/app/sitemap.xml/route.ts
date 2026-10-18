import { sitemapIndexResponse } from "@/lib/seo/sitemap-routes";

// Đọc DB và `NEXT_PUBLIC_SITE_URL` lúc chạy (không prerender lúc build). Cache-Control do route tự đặt (CDN 60s; 503 no-store).
export const dynamic = "force-dynamic";

export const GET = sitemapIndexResponse;
