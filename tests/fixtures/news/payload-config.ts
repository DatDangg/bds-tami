import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Categories } from "../../../src/collections/Categories";
import { createNews } from "../../../src/collections/News";
import { Media } from "../../../src/collections/Media";
import { Staff } from "../../../src/collections/Staff";
import type { RevalidatePaths } from "../../../src/hooks/revalidate-content";

/** Config test cho tin tức: collection THẬT `news` + `categories` (guard xoá danh mục thấy `news` thật); `push: true` chỉ trên DB tạm. */
export function buildNewsTestConfig(databaseUrl: string, revalidatePaths: RevalidatePaths) {
  return buildConfig({
    secret: "test-news-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, Categories, createNews(revalidatePaths)],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
