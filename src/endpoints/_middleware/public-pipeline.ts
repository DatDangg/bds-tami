import { fail } from "@/lib/http/response";
import { logger } from "@/lib/logger";
import { getClientIp, UNKNOWN_CLIENT_IP } from "@/lib/security/client-ip";
import { ipHash } from "@/lib/security/ip-hash";
import {
  checkEndpointRateLimit,
  RateLimitUnavailableError,
  type RateLimitedEndpoint,
  type RateLimitResult,
} from "@/lib/security/rate-limit";
import { verifyTurnstile, type TurnstileResult } from "@/lib/security/turnstile";

const log = logger.child({ component: "public-pipeline" });

export type ValidationOutcome<T> = { ok: true; value: T } | { ok: false; details: unknown[] };

export interface PublicPipelineInput<T> {
  request: Request;
  endpoint: RateLimitedEndpoint;
  /** Địa chỉ socket nếu runtime cung cấp (xem `getClientIp`). */
  remoteAddress?: string | null;
  /** `false` cho endpoint không dùng captcha (vd GET rentals). Ngược lại đọc token từ body của request. */
  turnstile: false | { readToken: () => Promise<unknown> };
  /** Parse + kiểm schema (zod), gồm `consent === true`. Chỉ chạy sau rate limit và Turnstile. */
  validate: () => Promise<ValidationOutcome<T>> | ValidationOutcome<T>;
}

export type PublicPipelineResult<T> =
  | { ok: true; value: T; ipHash: string }
  | { ok: false; response: Response };

export interface PublicPipelineDeps {
  rateLimit: (endpoint: RateLimitedEndpoint, subject: string) => Promise<RateLimitResult>;
  verifyTurnstile: (token: unknown, options: { remoteIp?: string }) => Promise<TurnstileResult>;
}

const defaultDeps: PublicPipelineDeps = {
  rateLimit: checkEndpointRateLimit,
  verifyTurnstile,
};

/** Body hỏng (JSON sai, multipart lỗi…) là lỗi của client: 400, không để thành 500. Chỉ log tên lỗi. */
function badInput(step: string, endpoint: string, error: unknown, message: string): Response {
  log.warn({ endpoint, step, errorName: error instanceof Error ? error.name : "unknown" }, "đầu vào hỏng, trả 400");
  return fail(400, message);
}

/**
 * Chuỗi bảo vệ endpoint công khai theo PERMISSION §5: rateLimit (429/503) -> verifyTurnstile (400) -> validate (400).
 * Trả `{ ok: false, response }` ở bước đầu tiên thất bại; handler chỉ chạy khi `ok: true`.
 * Rate limit đứng trước để request spam bị chặn rẻ, không tốn một lần gọi Cloudflare hay parse body.
 */
export async function runPublicPipeline<T>(
  input: PublicPipelineInput<T>,
  deps: PublicPipelineDeps = defaultDeps,
): Promise<PublicPipelineResult<T>> {
  const clientIp = getClientIp(input.request.headers, { remoteAddress: input.remoteAddress });
  const hashedIp = ipHash(clientIp);

  let limit: RateLimitResult;
  try {
    limit = await deps.rateLimit(input.endpoint, hashedIp);
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) throw error;
    const reason = error.cause instanceof Error ? error.cause.name : "unknown";
    log.error({ endpoint: input.endpoint, reason }, "Redis lỗi, trả 503 (fail closed)");
    return { ok: false, response: fail(503, "Hệ thống tạm thời không khả dụng, vui lòng thử lại sau") };
  }
  if (!limit.allowed) {
    const response = fail(429, "Bạn gửi quá nhiều lần, vui lòng thử lại sau");
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return { ok: false, response };
  }

  if (input.turnstile) {
    let token: unknown;
    try {
      token = await input.turnstile.readToken();
    } catch (error) {
      return { ok: false, response: badInput("readToken", input.endpoint, error, "Yêu cầu không hợp lệ") };
    }
    const captcha = await deps.verifyTurnstile(token, { remoteIp: clientIp === UNKNOWN_CLIENT_IP ? undefined : clientIp });
    if (!captcha.ok) return { ok: false, response: fail(400, "Xác thực captcha không thành công") };
  }

  let validation: ValidationOutcome<T>;
  try {
    validation = await input.validate();
  } catch (error) {
    return { ok: false, response: badInput("validate", input.endpoint, error, "Dữ liệu không hợp lệ") };
  }
  if (!validation.ok) return { ok: false, response: fail(400, "Dữ liệu không hợp lệ", validation.details) };
  return { ok: true, value: validation.value, ipHash: hashedIp };
}
