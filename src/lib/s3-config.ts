import { getEnv } from "./env";

/** Cấu hình S3 client dùng chung (payload.config.ts và health probe). SeaweedFS cần path-style: bucket nằm trong đường dẫn, không phải subdomain. */
export function getS3ClientConfig() {
  const env = getEnv();
  return {
    endpoint: env.S3_ENDPOINT,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  };
}
