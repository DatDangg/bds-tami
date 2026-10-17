import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Media } from "../../../src/collections/Media";
import { Provinces } from "../../../src/collections/Provinces";
import { Staff } from "../../../src/collections/Staff";
import { Wards } from "../../../src/collections/Wards";

/** Config test cho địa giới: collection THẬT `provinces`/`wards` (+ `staff` để kiểm quyền); `push: true` chỉ trên DB tạm. */
export function buildGeoTestConfig(databaseUrl: string) {
  return buildConfig({
    secret: "test-geo-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, Provinces, Wards],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
