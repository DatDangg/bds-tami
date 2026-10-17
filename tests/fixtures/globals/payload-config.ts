import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Media } from "../../../src/collections/Media";
import { Staff } from "../../../src/collections/Staff";
import { createFooter } from "../../../src/globals/Footer";
import { createHeader } from "../../../src/globals/Header";
import { createSiteSettings } from "../../../src/globals/SiteSettings";
import type { RevalidateTags } from "../../../src/hooks/revalidate-global";

/** Config test cho globals: global THẬT (factory, truyền bản ghi nhận revalidate); `push: true` chỉ trên DB tạm. */
export function buildGlobalsTestConfig(databaseUrl: string, revalidate: RevalidateTags) {
  return buildConfig({
    secret: "test-globals-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs],
    globals: [createSiteSettings(revalidate), createHeader(revalidate), createFooter(revalidate)],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
