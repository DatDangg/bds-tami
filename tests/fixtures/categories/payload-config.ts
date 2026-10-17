import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig, type CollectionConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Categories } from "../../../src/collections/Categories";
import { Developers } from "../../../src/collections/Developers";
import { Media } from "../../../src/collections/Media";
import { Staff } from "../../../src/collections/Staff";

/**
 * Collection `news` giả, chỉ để test chặn xoá danh mục đang có nội dung (collection `news` thật có ở layer 5).
 * Chỉ nằm trong config test + DB tạm, không vào `payload.config.ts`.
 */
const FakeNews: CollectionConfig = {
  slug: "news",
  access: { read: () => true, create: () => true, update: () => true, delete: () => true },
  fields: [
    { name: "title", type: "text" },
    { name: "category", type: "relationship", relationTo: "categories" },
  ],
};

/** Config test cho danh mục nền: collection THẬT `categories`/`developers` + `news` giả; `push: true` chỉ trên DB tạm. */
export function buildCategoriesTestConfig(databaseUrl: string) {
  return buildConfig({
    secret: "test-categories-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, Categories, Developers, FakeNews],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
