import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Developers } from "../../../src/collections/Developers";
import { Media } from "../../../src/collections/Media";
import { createPages } from "../../../src/collections/Pages";
import { createServices } from "../../../src/collections/Services";
import { Staff } from "../../../src/collections/Staff";
import { createSiteSettings } from "../../../src/globals/SiteSettings";
import type { RevalidatePaths } from "../../../src/hooks/revalidate-content";
import type { RevalidateTags } from "../../../src/hooks/revalidate-global";

/**
 * Config test cho dịch vụ + trang pháp lý: collection/global THẬT (`pages` và `site-settings` nhận bản ghi nhận revalidate),
 * kèm `developers` để kiểm Duplicate dùng chung `slugField`; `push: true` chỉ trên DB tạm.
 */
export function buildServicesPagesTestConfig(databaseUrl: string, revalidatePaths: RevalidatePaths, revalidateTags: RevalidateTags) {
  return buildConfig({
    secret: "test-services-pages-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, Developers, createServices(revalidatePaths), createPages(revalidatePaths)],
    globals: [createSiteSettings(revalidateTags)],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
