import Redis from "ioredis";

import { logger } from "@/lib/logger";

// Cache trên globalThis: hot reload của dev server nạp lại module, biến module-level sẽ mở thêm kết nối.
const globalForRedis = globalThis as typeof globalThis & { __tamiRedis?: Redis };

/**
 * Redis dùng chung (rate limit, cache). Tạo lười, một kết nối cho cả process.
 * Giới hạn thời gian chờ (connect/lệnh 2s, thử lại 1 lần): request công khai phải lỗi nhanh
 * (rate limit sẽ trả 503, fail closed) thay vì treo chờ Redis quay lại.
 */
export function getRedis(): Redis {
  if (globalForRedis.__tamiRedis) return globalForRedis.__tamiRedis;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Thiếu REDIS_URL");
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 2_000,
    retryStrategy: (attempt) => Math.min(attempt * 200, 2_000),
  });
  // ioredis phát 'error' liên tục khi Redis chết; không có listener thì process bị sập (unhandled 'error').
  // Lỗi thật được xử lý ở nơi gọi lệnh (rate limit trả 503); ở đây chỉ ghi tên lỗi, không ghi URL.
  client.on("error", (error: Error) => {
    logger.error({ component: "redis", errorName: error.name }, "lỗi kết nối");
  });
  globalForRedis.__tamiRedis = client;
  return client;
}

/** Đóng kết nối (test, shutdown). */
export async function closeRedis(): Promise<void> {
  const current = globalForRedis.__tamiRedis;
  globalForRedis.__tamiRedis = undefined;
  if (current) await current.quit().catch(() => current.disconnect());
}
