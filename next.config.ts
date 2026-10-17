import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import { cacheControlHeaders } from "./src/lib/http/cache-policy";
import { shouldEmitBrowserSourceMaps } from "./src/lib/monitoring/browser-sourcemaps";

// Không bật `output: "standalone"`: image Docker (docker/Dockerfile) chạy `app` (next start) và `jobs`/`migrate` (payload CLI + loader TS) từ cùng cây node_modules production, nên trace standalone không đủ cho jobs.
// agentRules: false — `next dev` không tự chèn block `nextjs-agent-rules` vào AGENTS.md (AGENTS.md do template quản lý).
// Không đưa APP_ENV/DSN vào bundle qua `env`/NEXT_PUBLIC_*: một image build 1 lần rồi promote staging -> prod (ARCHITECTURE §6.4).
// productionBrowserSourceMaps: chỉ khi có GLITCHTIP_AUTH_TOKEN (build release): `scripts/upload-sourcemaps.mjs` upload lên GlitchTip rồi xoá `.map`.
const nextConfig: NextConfig = {
  agentRules: false,
  experimental: { globalNotFound: true },
  productionBrowserSourceMaps: shouldEmitBrowserSourceMaps(process.env),
  headers: async () => cacheControlHeaders(),
  // URL một đoạn có đuôi file (`/wp-login.php`) không qua `proxy.ts` nên sẽ khớp `[locale]` với locale sai, rồi `notFound()` ở layout
  // chỉ cho shell `__next_error__` rỗng. Rewrite sang đường dẫn không route nào khớp để Next trả 404 qua `app/not-found.tsx` (HTML đầy đủ).
  // `afterFiles`: file trong `public/` và route tĩnh (`/robots.txt`, `/sitemap.xml`) được phục vụ trước, rewrite này chỉ chạm URL còn lại.
  rewrites: async () => ({ beforeFiles: [], afterFiles: [{ source: "/:segment([^/]*[.][^/]*)", destination: "/__not-found__/:segment" }], fallback: [] }),
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withPayload(withNextIntl(nextConfig));
