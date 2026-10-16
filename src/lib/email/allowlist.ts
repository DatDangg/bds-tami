/**
 * Chặn gửi email ra ngoài ở môi trường không phải production (ARCHITECTURE §6.3).
 * Fail-safe: chỉ `production` mới được gửi tự do; dev/test/staging chỉ gửi tới địa chỉ trong EMAIL_ALLOWLIST.
 */

export type AppEnvironment = "development" | "test" | "staging" | "production";

const normalizeAddress = (address: string): string => address.trim().toLowerCase();

/** "a@x.vn, B@y.vn" -> ["a@x.vn", "b@y.vn"]; thiếu/rỗng -> []. */
export function parseEmailAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map(normalizeAddress).filter((address) => address.length > 0);
}

export interface RecipientFilterResult {
  allowed: string[];
  droppedCount: number;
}

export function filterRecipients(args: {
  appEnv: AppEnvironment;
  allowlist: readonly string[];
  recipients: readonly string[];
}): RecipientFilterResult {
  const { appEnv, allowlist, recipients } = args;
  if (appEnv === "production") return { allowed: [...recipients], droppedCount: 0 };
  const permitted = new Set(allowlist.map(normalizeAddress));
  const allowed = recipients.filter((address) => permitted.has(normalizeAddress(address)));
  return { allowed, droppedCount: recipients.length - allowed.length };
}

/**
 * Cấu hình email nguy hiểm cần báo lỗi to khi khởi động process:
 * build production mà quên đặt APP_ENV (mặc định development: mọi email bị chặn im lặng) hoặc môi trường không-prod thiếu allowlist.
 */
export function findEmailConfigProblems(args: {
  nodeEnv: string | undefined;
  appEnv: AppEnvironment;
  allowlist: readonly string[];
}): string[] {
  const problems: string[] = [];
  // staging cũng chạy NODE_ENV=production nhưng phải đặt APP_ENV=staging; chỉ `development` (giá trị mặc định) mới là dấu hiệu quên đặt.
  if (args.nodeEnv === "production" && args.appEnv === "development") {
    problems.push(`NODE_ENV=production nhưng APP_ENV=development (mặc định): email ra ngoài sẽ bị chặn, hãy đặt APP_ENV=production hoặc staging.`);
  }
  if (args.appEnv !== "production" && args.allowlist.length === 0) {
    problems.push(`APP_ENV=${args.appEnv} và EMAIL_ALLOWLIST rỗng: mọi email sẽ bị bỏ.`);
  }
  return problems;
}
