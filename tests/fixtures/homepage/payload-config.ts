import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Categories } from "../../../src/collections/Categories";
import { Developers } from "../../../src/collections/Developers";
import { Media } from "../../../src/collections/Media";
import { News } from "../../../src/collections/News";
import { createProjects } from "../../../src/collections/Projects";
import { createPropertyPosts } from "../../../src/collections/PropertyPosts";
import { Provinces } from "../../../src/collections/Provinces";
import { createRentals } from "../../../src/collections/Rentals";
import { createServices } from "../../../src/collections/Services";
import { Staff } from "../../../src/collections/Staff";
import { contentRedirectsPlugin } from "../../../src/collections/redirects-plugin";
import { Wards } from "../../../src/collections/Wards";
import { createHomepage } from "../../../src/globals/Homepage";
import type { HomepageRevalidators } from "../../../src/hooks/homepage/revalidate-homepage";

/**
 * Config test cho global `homepage`: global THẬT (nhận bản ghi nhận revalidate) + các collection nó tham chiếu
 * (`projects`, `services`, `property-posts`, `news`, `categories`, `media`); `push: true` chỉ trên DB tạm (cần PostGIS, test tự bật).
 */
export function buildHomepageTestConfig(databaseUrl: string, revalidators: HomepageRevalidators) {
  return buildConfig({
    secret: "test-homepage-secret-khong-dung-o-production",
    collections: [
      Staff,
      Media,
      AuditLogs,
      Categories,
      Developers,
      Provinces,
      Wards,
      News,
      createProjects(),
      createRentals(),
      createPropertyPosts(),
      createServices(revalidators.paths, revalidators.tags),
    ],
    globals: [createHomepage(revalidators)],
    plugins: [contentRedirectsPlugin()],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
