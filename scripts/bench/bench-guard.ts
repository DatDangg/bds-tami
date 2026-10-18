/**
 * Chặn bench chèn 100.000 tin giả (`BENCH-*`, trạng thái published) vào DB thật. Chỉ cho chạy khi MÔI TRƯỜNG là dev/test VÀ DB ở máy này.
 * Trả lý do chặn (chuỗi) hoặc `null` nếu được chạy. Không có đường vòng bằng cờ env: muốn bench trên DB khác thì sửa script có chủ đích.
 */
const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const BLOCKED_APP_ENVS = new Set(["staging", "production"]);

export function benchBlockedReason(env: Record<string, string | undefined>): string | null {
  if (env.NODE_ENV === "production") return "NODE_ENV=production";
  if (env.APP_ENV && BLOCKED_APP_ENVS.has(env.APP_ENV)) return `APP_ENV=${env.APP_ENV}`;
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) return "DATABASE_URL chưa đặt (không xác định được DB)";
  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    return "DATABASE_URL không đọc được (không xác định được host DB)";
  }
  return LOCAL_DB_HOSTS.has(host) ? null : `host DB "${host}" không phải máy dev (chỉ localhost/127.0.0.1/::1)`;
}
