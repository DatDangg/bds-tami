/**
 * Guard của script điền dữ liệu cũ (BL-052 `pnpm backfill:listing-fields`): CHỈ cho chạy trên DB dev cục bộ.
 * Chặt hơn `checkSeedEnvironment` của seed (seed cho staging khi bật cờ): ở đây không có cờ mở cho staging/prod
 * (bài học BL-045 T08 — guard phải chặn cả staging). Chạy staging/prod chỉ khi user bảo, và phải sửa code có chủ đích.
 *
 * Tiêu chí (cần đủ tất cả):
 * 1. `NODE_ENV` khác `production` (image staging/prod luôn `production`).
 * 2. `APP_ENV` trống hoặc là `development` / `dev` / `local`.
 * 3. Có `DATABASE_URL` đọc được dạng URL.
 * 4. Nếu có `DATABASE_URL_STAGING` / `DATABASE_URL_PROD` (tên env theo project-config): so sau khi chuẩn hoá (host chữ thường,
 *    port mặc định 5432, tên DB chữ thường) — trùng **tên DB** hoặc trùng **host:port** đều chặn. Chặn được đường tunnel
 *    `localhost:<port>` → DB staging/prod cùng tên; biến không đọc được dạng URL → chặn (không đoán).
 * 5. Máy chủ DB là máy cục bộ: `localhost`, `127.0.0.1`, `::1` (container staging/prod nối host `postgres` hoặc máy xa → bị chặn).
 * Lý do từ chối không chứa chuỗi kết nối (không lộ mật khẩu ra log).
 */
export type BackfillEnvCheck = { allowed: true } | { allowed: false; reason: string };

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const DEV_APP_ENVS = new Set(["development", "dev", "local"]);
const GUARDED_ENVS = ["DATABASE_URL_STAGING", "DATABASE_URL_PROD"] as const;

interface DbIdentity {
  host: string;
  hostPort: string;
  database: string;
}

function dbIdentity(raw: string): DbIdentity | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase();
    const database = decodeURIComponent(url.pathname.replace(/^\/+/, "")).toLowerCase();
    return { host, hostPort: `${host}:${url.port || "5432"}`, database };
  } catch {
    return null;
  }
}

export function checkBackfillEnvironment(env: Record<string, string | undefined>): BackfillEnvCheck {
  if (env.NODE_ENV === "production") return { allowed: false, reason: "NODE_ENV=production" };
  const appEnv = env.APP_ENV?.trim();
  if (appEnv && !DEV_APP_ENVS.has(appEnv)) return { allowed: false, reason: `APP_ENV=${appEnv} (chỉ cho development/dev/local)` };
  const raw = env.DATABASE_URL?.trim();
  if (!raw) return { allowed: false, reason: "thiếu DATABASE_URL" };
  const current = dbIdentity(raw);
  if (!current) return { allowed: false, reason: "DATABASE_URL không đúng dạng URL" };
  for (const name of GUARDED_ENVS) {
    const guardedRaw = env[name]?.trim();
    if (!guardedRaw) continue;
    const guarded = dbIdentity(guardedRaw);
    if (!guarded) return { allowed: false, reason: `${name} không đúng dạng URL, không so được` };
    if (guarded.database === current.database) return { allowed: false, reason: `tên DB trùng ${name}` };
    if (guarded.hostPort === current.hostPort) return { allowed: false, reason: `host:port DB trùng ${name}` };
  }
  if (!LOCAL_DB_HOSTS.has(current.host)) return { allowed: false, reason: "máy chủ DB không phải máy cục bộ (localhost / 127.0.0.1 / ::1)" };
  return { allowed: true };
}
