import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

// Test key chính thức của Cloudflare (luôn pass / luôn fail). Test không gọi mạng: fetch được mock.
const ALWAYS_PASS_SECRET = "1x0000000000000000000000000000000AA";
const ALWAYS_FAIL_SECRET = "2x0000000000000000000000000000000AA";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("verifyTurnstile", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("token hợp lệ: gọi siteverify bằng POST form có secret + response + remoteip", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    const result = await verifyTurnstile("tok-123", { secret: ALWAYS_PASS_SECRET, remoteIp: "203.0.113.7", fetchImpl });
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init.method).toBe("POST");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe(ALWAYS_PASS_SECRET);
    expect(body.get("response")).toBe("tok-123");
    expect(body.get("remoteip")).toBe("203.0.113.7");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("mặc định lấy secret từ TURNSTILE_SECRET_KEY", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", ALWAYS_PASS_SECRET);
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    await verifyTurnstile("tok", { fetchImpl });
    expect(((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body as URLSearchParams).get("secret")).toBe(
      ALWAYS_PASS_SECRET,
    );
    vi.unstubAllEnvs();
  });

  it("token bị Cloudflare từ chối -> invalid-token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }));
    expect(await verifyTurnstile("bad", { secret: ALWAYS_FAIL_SECRET, fetchImpl })).toEqual({
      ok: false,
      reason: "invalid-token",
    });
  });

  it("thiếu / rỗng / không phải chuỗi / quá dài -> từ chối, không gọi Cloudflare", async () => {
    const fetchImpl = vi.fn();
    for (const token of [undefined, null, "", 123, {}]) {
      expect(await verifyTurnstile(token, { secret: ALWAYS_PASS_SECRET, fetchImpl })).toEqual({
        ok: false,
        reason: "missing-token",
      });
    }
    expect(await verifyTurnstile("x".repeat(2049), { secret: ALWAYS_PASS_SECRET, fetchImpl })).toEqual({
      ok: false,
      reason: "invalid-token",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lỗi mạng -> fail closed + log, log không chứa token/secret", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed: tok-secret-xyz"));
    const result = await verifyTurnstile("tok-secret-xyz", { secret: ALWAYS_PASS_SECRET, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("siteverify");
    expect(logged).not.toContain("tok-secret-xyz");
    expect(logged).not.toContain(ALWAYS_PASS_SECRET);
  });

  it("timeout (AbortSignal.timeout) -> fail closed", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    expect(await verifyTurnstile("tok", { secret: ALWAYS_PASS_SECRET, fetchImpl })).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("HTTP 5xx, JSON hỏng hoặc dạng lạ -> fail closed", async () => {
    const cases = [
      jsonResponse({ success: true }, 500),
      new Response("<html>", { status: 200 }),
      jsonResponse("success"),
      jsonResponse({ success: "true" }),
      jsonResponse(null),
    ];
    for (const response of cases) {
      const fetchImpl = vi.fn().mockResolvedValue(response);
      const result = await verifyTurnstile("tok", { secret: ALWAYS_PASS_SECRET, fetchImpl });
      expect(result.ok).toBe(false);
    }
  });

  it("thiếu secret -> từ chối, không gọi Cloudflare", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchImpl = vi.fn();
    expect(await verifyTurnstile("tok", { fetchImpl })).toEqual({ ok: false, reason: "unavailable" });
    expect(fetchImpl).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
