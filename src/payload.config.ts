import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { AuditLogs } from "./collections/AuditLogs";
import { ClickEvents } from "./collections/ClickEvents";
import { ClickStatsDaily } from "./collections/ClickStatsDaily";
import { Media } from "./collections/Media";
import { PrivateFiles } from "./collections/PrivateFiles";
import { Staff } from "./collections/Staff";
import { migrations } from "../migrations";
import { clickEventsEndpoint } from "./endpoints/public/click-events";
import { jobsConfig } from "./jobs";
import { getEnv } from "./lib/env";
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
  collections: [Staff, Media, PrivateFiles, AuditLogs, ClickEvents, ClickStatsDaily],
  editor: lexicalEditor(),
  email: createEmailAdapter(env),
  endpoints: [clickEventsEndpoint],
  jobs: jobsConfig,
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
    pool: { connectionString: env.DATABASE_URL },
    idType: "uuid",
    // Schema chỉ đổi qua migration versioned; cấm push ở mọi môi trường.
    push: false,
    migrationDir: path.resolve(dirname, "../migrations"),
    prodMigrations: migrations,
  }),
  sharp,
  // Trần 20MB (PDF lớn nhất); busboy cắt và trả 413. Giới hạn theo loại file do `createUploadGuard` kiểm.
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
  plugins: [
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
