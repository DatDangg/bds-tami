import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { Staff } from "./collections/Staff";
import { migrations } from "../migrations";
import { jobsConfig } from "./jobs";
import { getEnv } from "./lib/env";
import { createEmailAdapter } from "./lib/email/transport";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = getEnv();

export default buildConfig({
  admin: {
    user: Staff.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  // Chỉ tài khoản nội bộ ở task này; collection nghiệp vụ thêm ở các layer sau.
  collections: [Staff],
  editor: lexicalEditor(),
  email: createEmailAdapter(env),
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
});
