import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitUnavailableError } from "@/lib/security/rate-limit";
import { runPublicPipeline, type PublicPipelineDeps, type ValidationOutcome } from "./public-pipeline";

const request = () => new Request("https://tami.test/api/public/leads", { method: "POST" });

function setup(overrides: Partial<PublicPipelineDeps> = {}, validation: ValidationOutcome<string> = { ok: true, value: "x" }) {
  const calls: string[] = [];
  const deps: PublicPipelineDeps = {
    rateLimit: vi.fn(async () => {
      calls.push("rateLimit");
      return { allowed: true as const, remaining: 4 };
    }),
    verifyTurnstile: vi.fn(async () => {
      calls.push("turnstile");
      return { ok: true as const };
    }),
    ...overrides,
  };
  const validate = vi.fn(() => {
    calls.push("validate");
    return validation;
  });
  const readToken = vi.fn(async () => {
    calls.push("readToken");
    return "tok";
  });
  const run = () =>
    runPublicPipeline({ request: request(), endpoint: "leads", turnstile: { readToken }, validate }, deps);
  return { calls, deps, validate, run };
}

describe("runPublicPipeline (PERMISSION §5)", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("thứ tự đúng: rateLimit -> turnstile -> validate", async () => {
    const { calls, run } = setup();
    const result = await run();
    expect(result.ok).toBe(true);
    expect(calls).toEqual(["rateLimit", "readToken", "turnstile", "validate"]);
  });

  it("rate limit khoá bằng ipHash, không phải IP thô", async () => {
    const { deps, run } = setup();
    const result = await run();
    const [endpoint, subject] = vi.mocked(deps.rateLimit).mock.calls[0]!;
    expect(endpoint).toBe("leads");
    expect(subject).toMatch(/^[0-9a-f]{64}$/);
    expect(result.ok && result.ipHash).toBe(subject);
  });

  it("vượt giới hạn -> 429 + Retry-After, dừng trước Turnstile/validate", async () => {
    const { calls, run } = setup({
      rateLimit: vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 420 })),
    });
    const result = await run();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(429);
    expect(result.response.headers.get("Retry-After")).toBe("420");
    expect(calls).toEqual([]);
  });

  it("Redis lỗi -> 503 (fail closed), dừng trước Turnstile/validate", async () => {
    const { calls, run } = setup({
      rateLimit: vi.fn(async () => {
        throw new RateLimitUnavailableError(new Error("ECONNREFUSED"));
      }),
    });
    const result = await run();
    expect(!result.ok && result.response.status).toBe(503);
    expect(calls).toEqual([]);
  });

  it("lỗi không phải Redis từ rate limit thì ném tiếp (không nuốt thành 503)", async () => {
    const { run } = setup({
      rateLimit: vi.fn(async () => {
        throw new Error("bug");
      }),
    });
    await expect(run()).rejects.toThrow("bug");
  });

  it("Turnstile sai -> 400, không chạy validate", async () => {
    const { calls, run } = setup({
      verifyTurnstile: vi.fn(async () => ({ ok: false as const, reason: "invalid-token" as const })),
    });
    const result = await run();
    expect(!result.ok && result.response.status).toBe(400);
    expect(calls).not.toContain("validate");
  });

  it("validate sai -> 400 kèm details theo API_SPEC §2", async () => {
    const { run } = setup({}, { ok: false, details: [{ path: ["consent"] }] });
    const result = await run();
    expect(!result.ok && result.response.status).toBe(400);
    if (result.ok) return;
    expect(await result.response.json()).toEqual({
      success: false,
      error: "Dữ liệu không hợp lệ",
      details: [{ path: ["consent"] }],
    });
  });

  it("readToken ném lỗi (body hỏng) -> 400, không 500, dừng trước validate", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { deps, validate } = setup();
    const result = await runPublicPipeline(
      {
        request: request(),
        endpoint: "leads",
        turnstile: { readToken: async () => { throw new SyntaxError("Unexpected token"); } },
        validate,
      },
      deps,
    );
    expect(!result.ok && result.response.status).toBe(400);
    expect(validate).not.toHaveBeenCalled();
  });

  it("validate ném lỗi -> 400", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { deps } = setup();
    const result = await runPublicPipeline(
      { request: request(), endpoint: "leads", turnstile: false, validate: () => { throw new SyntaxError("bad json"); } },
      deps,
    );
    expect(!result.ok && result.response.status).toBe(400);
  });

  it("log lỗi Redis chỉ có tên lỗi, không có object/URL", async () => {
    const cause = Object.assign(new Error("connect ECONNREFUSED redis://user:pw@host"), { name: "ConnectionError" });
    const { run } = setup({
      rateLimit: vi.fn(async () => {
        throw new RateLimitUnavailableError(cause);
      }),
    });
    await run();
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("ConnectionError");
    expect(logged).not.toContain("pw@host");
  });

  it("turnstile: false (endpoint không captcha) bỏ qua Turnstile nhưng vẫn rate limit + validate", async () => {
    const { calls, deps, validate } = setup();
    await runPublicPipeline({ request: request(), endpoint: "rentals", turnstile: false, validate }, deps);
    expect(calls).toEqual(["rateLimit", "validate"]);
  });
});
