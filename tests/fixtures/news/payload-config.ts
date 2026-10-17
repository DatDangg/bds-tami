import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { createCategories } from "../../../src/collections/Categories";
import { createNews } from "../../../src/collections/News";
import { Media } from "../../../src/collections/Media";
import { Staff } from "../../../src/collections/Staff";
import { contentRedirectsPlugin } from "../../../src/collections/redirects-plugin";
import type { RevalidatePaths } from "../../../src/hooks/revalidate-content";

/** Config test cho tin tức: collection THẬT `news` + `categories` (guard xoá danh mục thấy `news` thật; hook làm mới cache của cả hai ghi vào cùng `revalidatePaths`); `push: true` chỉ trên DB tạm. */
export function buildNewsTestConfig(databaseUrl: string, revalidatePaths: RevalidatePaths) {
  return buildConfig({
    secret: "test-news-secret-khong-dung-o-production",
    collections: [Staff, Media, AuditLogs, createCategories(revalidatePaths), createNews(revalidatePaths)],
    plugins: [contentRedirectsPlugin()],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
