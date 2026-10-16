import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

// Chưa bật `output: "standalone"` (Windows dev lỗi EPERM symlink); task Dockerfile/deploy sẽ thêm khi build trong Linux.
// agentRules: false — `next dev` không tự chèn block `nextjs-agent-rules` vào AGENTS.md (AGENTS.md do template quản lý).
const nextConfig: NextConfig = { agentRules: false };

export default withPayload(nextConfig);
