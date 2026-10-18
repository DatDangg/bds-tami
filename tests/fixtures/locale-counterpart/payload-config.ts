import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Categories } from "../../../src/collections/Categories";
import { Developers } from "../../../src/collections/Developers";
import { Media } from "../../../src/collections/Media";
import { createPages } from "../../../src/collections/Pages";
import { createProjects } from "../../../src/collections/Projects";
import { Provinces } from "../../../src/collections/Provinces";
import { createRentals } from "../../../src/collections/Rentals";
import { Staff } from "../../../src/collections/Staff";
import { contentRedirectsPlugin } from "../../../src/collections/redirects-plugin";
import { Wards } from "../../../src/collections/Wards";
import { createSiteSettings } from "../../../src/globals/SiteSettings";

/**
 * Config test cho nút chuyển ngôn ngữ: collection THẬT `rentals` (kèm `categories`, `provinces`, `wards`) và `pages` (trang pháp lý, kèm global `site-settings`),
 * để `resolveCounterpartPath` chạy với `publicWhere`/slug localized thật. `push: true` chỉ trên DB tạm (cần PostGIS và `rentals_code_seq`).
 */
export function buildLocaleCounterpartTestConfig(databaseUrl: string) {
  return buildConfig({
    secret: "test-locale-counterpart-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, Categories, Developers, Provinces, Wards, createProjects(), createRentals(() => undefined), createPages(() => undefined)],
    plugins: [contentRedirectsPlugin()],
    // Lưu trang pháp lý privacy đồng bộ phiên bản sang `site-settings` nên cần global này.
    globals: [createSiteSettings(() => undefined)],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
