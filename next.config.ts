import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Chưa bật `output: "standalone"` (Windows dev lỗi EPERM symlink); task Dockerfile/deploy sẽ thêm khi build trong Linux.
// agentRules: false — `next dev` không tự chèn block `nextjs-agent-rules` vào AGENTS.md (AGENTS.md do template quản lý).
const nextConfig: NextConfig = { agentRules: false };

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withPayload(withNextIntl(nextConfig));
