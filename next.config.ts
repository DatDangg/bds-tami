import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import { cacheControlHeaders } from "./src/lib/http/cache-policy";

// Không bật `output: "standalone"`: image Docker (docker/Dockerfile) chạy `app` (next start) và `jobs`/`migrate` (payload CLI + loader TS) từ cùng cây node_modules production, nên trace standalone không đủ cho jobs.
// agentRules: false — `next dev` không tự chèn block `nextjs-agent-rules` vào AGENTS.md (AGENTS.md do template quản lý).
// Không đưa APP_ENV/DSN vào bundle qua `env`/NEXT_PUBLIC_*: một image build 1 lần rồi promote staging -> prod (ARCHITECTURE §6.4).
const nextConfig: NextConfig = {
  agentRules: false,
  headers: async () => cacheControlHeaders(),
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withPayload(withNextIntl(nextConfig));
