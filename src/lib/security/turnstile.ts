import { logger } from "@/lib/logger";

const log = logger.child({ component: "turnstile" });
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5_000;
/** Giới hạn token theo tài liệu Turnstile; dài hơn là rác, không gửi sang Cloudflare. */
const MAX_TOKEN_LENGTH = 2048;

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "missing-token" | "invalid-token" | "unavailable" };

export interface VerifyTurnstileOptions {
  remoteIp?: string;
  secret?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Xác thực token Turnstile phía server qua `siteverify`.
 * FAIL CLOSED: lỗi mạng, timeout, HTTP lỗi, JSON lạ, thiếu secret đều trả `ok: false` (endpoint trả 400),
 * vì fail open cho phép kẻ spam né captcha bằng cách làm Cloudflare chậm/lỗi; người dùng thật chỉ phải thử lại.
 * Log chỉ ghi lý do, không ghi token hay secret.
 */
export async function verifyTurnstile(
  token: unknown,
  { remoteIp, secret = process.env.TURNSTILE_SECRET_KEY, fetchImpl = fetch }: VerifyTurnstileOptions = {},
): Promise<TurnstileResult> {
  if (typeof token !== "string" || token.length === 0) return { ok: false, reason: "missing-token" };
  if (token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "invalid-token" };
  if (!secret) {
    log.error("thiếu TURNSTILE_SECRET_KEY, từ chối mọi token");
    return { ok: false, reason: "unavailable" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      log.error({ status: response.status }, "siteverify trả HTTP lỗi");
      return { ok: false, reason: "unavailable" };
    }
    const result: unknown = await response.json();
    const success = typeof result === "object" && result !== null && (result as { success?: unknown }).success === true;
    return success ? { ok: true } : { ok: false, reason: "invalid-token" };
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "không gọi được siteverify");
    return { ok: false, reason: "unavailable" };
  }
}
