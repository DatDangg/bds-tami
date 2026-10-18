import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { AuditLogs } from "./collections/AuditLogs";
import { Categories } from "./collections/Categories";
import { ClickEvents } from "./collections/ClickEvents";
import { ClickStatsDaily } from "./collections/ClickStatsDaily";
import { TranslationUsage } from "./collections/TranslationUsage";
import { Developers } from "./collections/Developers";
import { Provinces } from "./collections/Provinces";
import { Wards } from "./collections/Wards";
import { contentRedirectsPlugin } from "./collections/redirects-plugin";
import { JobApplications } from "./collections/JobApplications";
import { JobPostings } from "./collections/JobPostings";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { PrivateFiles } from "./collections/PrivateFiles";
import { News } from "./collections/News";
import { Projects } from "./collections/Projects";
import { LeadActivities } from "./collections/LeadActivities";
import { Leads } from "./collections/Leads";
import { PropertyPosts } from "./collections/PropertyPosts";
import { Rentals } from "./collections/Rentals";
import { Services } from "./collections/Services";
import { Staff } from "./collections/Staff";
import { Footer } from "./globals/Footer";
import { Header } from "./globals/Header";
import { Homepage } from "./globals/Homepage";
import { SiteSettings } from "./globals/SiteSettings";
import { migrations } from "../migrations";
import { clickEventsEndpoint } from "./endpoints/public/click-events";
import { leadAssignEndpoint } from "./endpoints/admin/lead-assign";
import { privateFileDownloadEndpoint } from "./endpoints/admin/private-file-download";
import { jobApplicationsEndpoint } from "./endpoints/public/job-applications";
import { leadsEndpoint } from "./endpoints/public/leads";
import { rentalsEndpoint } from "./endpoints/public/rentals";
import { jobsConfig } from "./jobs";
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
    components: {
      providers: ["/components/admin/SessionKeepAlive#SessionKeepAlive"],
      graphics: { Logo: "/components/admin/Logo#Logo", Icon: "/components/admin/Icon#Icon" },
    },
    meta: {
      titleSuffix: " - TAMI Admin",
      icons: [{ rel: "icon", type: "image/png", url: "/brand/tami-icon-gold.png" }],
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  // Collection nghiệp vụ thêm dần ở các layer sau.
  collections: [Staff, Media, PrivateFiles, AuditLogs, ClickEvents, ClickStatsDaily, TranslationUsage, Categories, Developers, Provinces, Wards, Services, Pages, News, Projects, Rentals, PropertyPosts, JobPostings, JobApplications, Leads, LeadActivities],
  globals: [SiteSettings, Homepage, Header, Footer],
  editor: lexicalEditor(),
  email: createEmailAdapter(env),
  endpoints: [clickEventsEndpoint, jobApplicationsEndpoint, leadAssignEndpoint, leadsEndpoint, privateFileDownloadEndpoint, rentalsEndpoint],
  jobs: jobsConfig,
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
    fallbackLanguage: "vi",
  },
  localization: {
    locales: ["vi", "en"],
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
  ],
});
