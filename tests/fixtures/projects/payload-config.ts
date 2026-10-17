import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Categories } from "../../../src/collections/Categories";
import { Developers } from "../../../src/collections/Developers";
import { Media } from "../../../src/collections/Media";
import { createProjects } from "../../../src/collections/Projects";
import { Provinces } from "../../../src/collections/Provinces";
import { Staff } from "../../../src/collections/Staff";
import { contentRedirectsPlugin } from "../../../src/collections/redirects-plugin";
import { Wards } from "../../../src/collections/Wards";
import type { RevalidatePaths } from "../../../src/hooks/revalidate-content";

/** Config test cho dự án: collection THẬT `projects` + `categories`/`developers`/`provinces`/`wards`; `push: true` chỉ trên DB tạm (cần PostGIS, test tự bật). */
export function buildProjectsTestConfig(databaseUrl: string, revalidatePaths: RevalidatePaths) {
  return buildConfig({
    secret: "test-projects-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, Categories, Developers, Provinces, Wards, createProjects(revalidatePaths)],
    plugins: [contentRedirectsPlugin()],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
