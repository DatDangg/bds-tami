import { getRedis } from "@/lib/redis";

export interface RateLimitRule {
  /** Số lần tối đa trong một cửa sổ. */
  limit: number;
  windowSeconds: number;
}

/** Giới hạn từng endpoint (API_SPEC §3; xuất Excel: API_SPEC §4). Khoá theo IP băm, riêng endpoint admin theo user id. */
export const RATE_LIMITS = {
  leads: { limit: 5, windowSeconds: 10 * 60 },
  "job-applications": { limit: 3, windowSeconds: 60 * 60 },
  rentals: { limit: 60, windowSeconds: 60 },
  "click-events": { limit: 30, windowSeconds: 60 },
  "admin-export-excel": { limit: 10, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitedEndpoint = keyof typeof RATE_LIMITS;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/** Redis lỗi/mất kết nối: người gọi phải trả 503 (fail closed), không được bỏ qua rate limit. */
export class RateLimitUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Không kiểm tra được giới hạn gửi (Redis không sẵn sàng)", { cause });
    this.name = "RateLimitUnavailableError";
  }
}

// Một lệnh Lua = atomic trên Redis: nhiều bản app/request song song không đếm sót hay đặt TTL sai.
// Nếu khoá vì lý do nào đó mất TTL (PTTL < 0) thì đặt lại, tránh bị chặn vĩnh viễn.
const COUNT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

/**
 * Fixed window counter. Request thứ `limit + 1` trong cửa sổ bị chặn; cửa sổ bắt đầu ở request đầu tiên
 * và hết hạn bằng TTL. Chấp nhận nhược điểm của fixed window (tối đa ~2x limit quanh ranh giới cửa sổ)
 * vì đủ cho chống spam form và rẻ hơn sliding window.
 * `subject` là ipHash (không bao giờ là IP thô) hoặc user id.
 */
export async function checkRateLimit(
  scope: string,
  subject: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const key = `rl:${scope}:${subject}`;
  let count: number;
  let ttlMs: number;
  try {
    const reply = (await getRedis().eval(COUNT_SCRIPT, 1, key, String(rule.windowSeconds * 1000))) as [
      number,
      number,
    ];
    [count, ttlMs] = reply;
  } catch (error) {
    throw new RateLimitUnavailableError(error);
  }
  if (count > rule.limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)) };
  return { allowed: true, remaining: rule.limit - count };
}

export function checkEndpointRateLimit(endpoint: RateLimitedEndpoint, subject: string): Promise<RateLimitResult> {
  return checkRateLimit(endpoint, subject, RATE_LIMITS[endpoint]);
}
