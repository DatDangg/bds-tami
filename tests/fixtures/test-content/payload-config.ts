import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Media } from "../../../src/collections/Media";
import { Staff } from "../../../src/collections/Staff";
import { contentRedirectsPlugin } from "../../../src/collections/redirects-plugin";
import { TestContent } from "./collection";

/**
 * Config Payload riêng cho test collection nội dung: chỉ gồm Staff, Media (avatar/ogImage), AuditLogs và
 * `test-content`. Cấu hình cục bộ giống production (localization vi/en, uuid). `push: true` CHỈ để tạo bảng trên
 * database tạm của test; config production luôn `push: false` và đổi schema bằng migration.
 */
export function buildTestContentConfig(databaseUrl: string) {
  return buildConfig({
    secret: "test-content-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, TestContent],
    plugins: [contentRedirectsPlugin()],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
