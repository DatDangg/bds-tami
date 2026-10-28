import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { contentRedirectsPlugin } from "./collections/redirects-plugin";
import { ADMIN_COLLECTIONS, ADMIN_GLOBALS } from "./collections/admin-collections";
import { VN_DATE_TIME_FORMAT } from "./fields/admin-date";
import { Staff } from "./collections/Staff";
import { adminNavGroupsPlugin } from "./components/admin/admin-groups";
import { migrations } from "../migrations";
import { clickEventsEndpoint } from "./endpoints/public/click-events";
import { leadAssignEndpoint } from "./endpoints/admin/lead-assign";
import { leadsExportEndpoint } from "./endpoints/admin/leads-export";
import { privateFileDownloadEndpoint } from "./endpoints/admin/private-file-download";
import { approveEnglishEndpoint } from "./endpoints/admin/approve-english";
import { retranslateEndpoint } from "./endpoints/admin/retranslate";
import { jobApplicationsEndpoint } from "./endpoints/public/job-applications";
import { leadsEndpoint } from "./endpoints/public/leads";
import { rentalsEndpoint } from "./endpoints/public/rentals";
import { newsViewsEndpoint } from "./endpoints/public/news-views";
import { newsletterEndpoint } from "./endpoints/public/newsletter";
import { newsletterExportEndpoint } from "./endpoints/admin/newsletter-export";
import { restorePublicErrorMessage } from "./hooks/restore-public-error-message";
import { jobsConfig } from "./jobs";
import { PAYLOAD_VI_OVERRIDES } from "./lib/admin/payload-vi-overrides";
import { createRichTextEditor } from "./lib/admin/rich-text-editor";
import { getEnv } from "./lib/env";
import { logger } from "./lib/logger";
import { resolveProdMigrations } from "./lib/payload/prod-migrations";
import { registerDbPool, type PoolStats } from "./lib/monitoring/metrics";
import { getS3ClientConfig } from "./lib/s3-config";
import { createEmailAdapter } from "./lib/email/transport";
import { MAX_UPLOAD_BYTES } from "./lib/upload/validate-file";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = getEnv();

const s3ClientConfig = getS3ClientConfig();

export default buildConfig({
  admin: {
    user: Staff.slug,
    // Ngày giờ admin dạng Việt Nam (mặc định Payload là "tháng 10 19 2026, 5:47 PM").
    dateFormat: VN_DATE_TIME_FORMAT,
    components: {
      providers: ["/components/admin/SessionKeepAlive#SessionKeepAlive", "/components/admin/NavigationToastGuard#NavigationToastGuard", "/components/admin/NavAdvancedCollapse#NavAdvancedCollapse", "/components/admin/UploadButtonLabel#UploadButtonLabel", "/components/admin/UploadSizeGuard#UploadSizeGuard", "/components/admin/AdminRoleAttribute#AdminRoleAttribute", "/components/admin/FormErrorFocus#FormErrorFocus"],
      // Nút "Xem website" ở header (BL-041).
      actions: ["/components/admin/SiteLink#SiteLink"],
      // Mục "Tổng quan" đầu sidebar: Payload DefaultNav không có lối vào dashboard (BL-050).
      beforeNavLinks: ["/components/admin/NavDashboardLink#NavDashboardLink"],
      // Banner dịch lỗi (TranslationFailedBanner) do view dashboard tự render: beforeDashboard chỉ chạy ở dashboard mặc định.
      views: { dashboard: { Component: "/components/admin/dashboard/DashboardView#DashboardView" } },
      graphics: { Logo: "/components/admin/Logo#Logo", Icon: "/components/admin/Icon#Icon" },
    },
    meta: {
      titleSuffix: " - TAMI Admin",
      icons: [
        { rel: "icon", type: "image/png", url: "/icon.png" },
        { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", url: "/apple-icon.png" },
      ],
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  // Collection nghiệp vụ thêm dần ở các layer sau.
  collections: ADMIN_COLLECTIONS,
  globals: ADMIN_GLOBALS,
  editor: createRichTextEditor(),
  email: createEmailAdapter(env),
  endpoints: [clickEventsEndpoint, jobApplicationsEndpoint, leadAssignEndpoint, leadsExportEndpoint, leadsEndpoint, privateFileDownloadEndpoint, rentalsEndpoint, retranslateEndpoint, approveEnglishEndpoint, newsViewsEndpoint, newsletterEndpoint, newsletterExportEndpoint],
  jobs: jobsConfig,
  // Build production minify làm `APIError.name` rỗng -> khôi phục message tiếng Việt cho lỗi REST công khai (BL-093).
  hooks: { afterError: [restorePublicErrorMessage] },
  // Logger của Payload dùng chung pino JSON + redact PII với app (stdout -> Loki).
  logger,
  // Pool pg của adapter -> metrics kết nối DB (/api/metrics).
  onInit: (payload) => registerDbPool((payload.db as { pool?: PoolStats }).pool),
  secret: env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // Giai đoạn 1 chỉ dùng REST + Local API (ARCHITECTURE §3).
  graphQL: { disable: true },
  i18n: {
    supportedLanguages: { vi },
    // Ghi đè chữ tiếng Việt mặc định của Payload (gồm `general.noLabel` = `—`): xem payload-vi-overrides.ts.
    translations: { vi: PAYLOAD_VI_OVERRIDES },
    fallbackLanguage: "vi",
  },
  localization: {
    // Có `label` để ô chọn ngôn ngữ nội dung hiện "Tiếng Việt"/"English" thay vì mã vi/en (BL-039); `code` giữ nguyên.
    locales: [
      { code: "vi", label: "Tiếng Việt" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "vi",
    // Không tự rơi về tiếng Việt khi thiếu bản en (BRD BR-07).
    fallback: false,
  },
  db: postgresAdapter({
    // connectionTimeoutMillis: pg mặc định 0 = chờ vô hạn; hết kết nối thì lỗi sau 5s thay vì treo (proxy tra redirect ở mọi trang chi tiết).
    pool: { connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 },
    idType: "uuid",
    // Schema chỉ đổi qua migration versioned; cấm push ở mọi môi trường.
    push: false,
    migrationDir: path.resolve(dirname, "../migrations"),
    // Mặc định KHÔNG tự migrate khi app/jobs khởi động ở production: adapter chạy prodMigrations lúc connect nên
    // app và jobs sẽ đua nhau. Migrate là bước riêng của pipeline deploy (`payload migrate`, ARCHITECTURE §6.4).
    // Chỉ đặt AUTO_MIGRATE_ON_START=true cho môi trường chạy 1 container.
    prodMigrations: resolveProdMigrations(process.env.AUTO_MIGRATE_ON_START, migrations),
  }),
  sharp,
  // Trần 20MB (PDF lớn nhất); busboy cắt và trả 413. Giới hạn theo loại file do `createUploadGuard` kiểm.
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
  plugins: [
    contentRedirectsPlugin(),
    s3Storage({
      bucket: env.S3_BUCKET_PUBLIC,
      config: s3ClientConfig,
      clientCacheKey: "s3-public",
      collections: { media: true },
    }),
    s3Storage({
      bucket: env.S3_BUCKET_PRIVATE,
      config: s3ClientConfig,
      clientCacheKey: "s3-private",
      collections: { "private-files": { disablePayloadAccessControl: true, generateFileURL: () => "" } },
    }),
    // Cuối cùng: sau khi plugin redirects đã nối collection, gán nhóm menu + sắp thứ tự (BL-015 T03).
    adminNavGroupsPlugin,
  ],
});
