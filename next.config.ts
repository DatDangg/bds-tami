import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

// Chưa bật `output: "standalone"` (Windows dev lỗi EPERM symlink); task Dockerfile/deploy sẽ thêm khi build trong Linux.
const nextConfig: NextConfig = {};

export default withPayload(nextConfig);
