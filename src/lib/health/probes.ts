import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";
import { getRedis } from "@/lib/redis";
import { getS3ClientConfig } from "@/lib/s3-config";
import { HEALTH_CHECK_TIMEOUT_MS, type HealthProbes } from "./run-health-checks";

let s3Client: S3Client | undefined;
let dbPool: Pool | undefined;

// Chỉ dùng cho HeadBucket, không ghi gì.
function getS3Client(): S3Client {
  s3Client ??= new S3Client(getS3ClientConfig());
  return s3Client;
}

// Pool riêng (không qua getPayload): lúc DB chết adapter của Payload sinh unhandled rejection. Lazy, 1 kết nối, có timeout.
function getDbPool(): Pool {
  if (dbPool) return dbPool;
  dbPool = new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: HEALTH_CHECK_TIMEOUT_MS,
    query_timeout: HEALTH_CHECK_TIMEOUT_MS,
  });
  // Lỗi của client nhàn rỗi (DB restart...) nếu không có listener sẽ làm crash process.
  dbPool.on("error", () => {});
  return dbPool;
}

async function headBucket(bucket: string): Promise<void> {
  await getS3Client().send(new HeadBucketCommand({ Bucket: bucket }), {
    abortSignal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
  });
}

export function createHealthProbes(): HealthProbes {
  return {
    db: async () => {
      await getDbPool().query("select 1");
    },
    redis: async () => {
      await getRedis().ping();
    },
    storage: async () => {
      const env = getEnv();
      await Promise.all([headBucket(env.S3_BUCKET_PUBLIC), headBucket(env.S3_BUCKET_PRIVATE)]);
    },
  };
}
