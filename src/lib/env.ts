import { z } from "zod";

/**
 * Biến môi trường của app. Danh sách bắt buộc khớp `.context/project-config.md` § Secrets.
 * Lỗi chỉ nêu TÊN biến, không bao giờ in giá trị (có thể là secret).
 */
const nonEmpty = z.string().min(1, "bắt buộc");

const envSchema = z.object({
  DATABASE_URL: nonEmpty,
  DATABASE_URL_TEST: z.string().min(1).optional(),
  PAYLOAD_SECRET: nonEmpty,
  REDIS_URL: nonEmpty,
  S3_ENDPOINT: nonEmpty,
  S3_ACCESS_KEY_ID: nonEmpty,
  S3_SECRET_ACCESS_KEY: nonEmpty,
  S3_BUCKET_PUBLIC: nonEmpty,
  S3_BUCKET_PRIVATE: nonEmpty,
  TURNSTILE_SITE_KEY: nonEmpty,
  TURNSTILE_SECRET_KEY: nonEmpty,
  SMTP_HOST: nonEmpty,
  SMTP_USER: nonEmpty,
  SMTP_PASS: nonEmpty,
  ANTHROPIC_API_KEY: nonEmpty,
  TRANSLATION_MODEL: nonEmpty,
  TRANSLATION_MONTHLY_BUDGET_USD: z.coerce.number().nonnegative(),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly invalidVariables: string[]) {
    super(`Cấu hình môi trường không hợp lệ. Biến thiếu hoặc sai: ${invalidVariables.join(", ")}`);
    this.name = "EnvValidationError";
  }
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;
  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
  throw new EnvValidationError(names);
}

let cached: Env | undefined;

/** Đọc + validate `process.env` một lần; gọi lại trả bản đã cache. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
