import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RateLimitUnavailableError } from "../../lib/security/rate-limit";
import type { PublicPipelineDeps } from "../_middleware/public-pipeline";
import { handleClickEvent, type ClickEventInput } from "./click-events";

const allowed: PublicPipelineDeps = {
  rateLimit: vi.fn(async () => ({ allowed: true as const, remaining: 29 })),
  verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
};

function post(body: unknown, raw = false) {
  return new Request("https://tami.test/api/public/click-events", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

describe("POST /api/public/click-events", () => {
  const save = vi.fn<(input: ClickEventInput) => Promise<void>>(async () => undefined);

  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    save.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("body hợp lệ -> 204 không nội dung và ghi đúng một lượt bấm", async () => {
    const response = await handleClickEvent(post({ type: "zalo", pagePath: "/cho-thue" }), save, allowed);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(save).toHaveBeenCalledExactlyOnceWith({ type: "zalo", pagePath: "/cho-thue" });
  });

  it("nhận kèm refCollection/refId và null", async () => {
    const ok = await handleClickEvent(
      post({ type: "hotline", pagePath: "/cho-thue/abc", refCollection: "rentals", refId: "7f1c-aa" }),
      save,
      allowed,
    );
    const nulls = await handleClickEvent(post({ type: "fanpage", pagePath: "/", refCollection: null, refId: null }), save, allowed);
    expect([ok.status, nulls.status]).toEqual([204, 204]);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["type ngoài hotline/zalo/fanpage", { type: "email", pagePath: "/" }],
    ["thiếu type", { pagePath: "/" }],
    ["thiếu pagePath", { type: "zalo" }],
    ["pagePath không bắt đầu bằng /", { type: "zalo", pagePath: "https://evil.example" }],
    ["pagePath quá dài", { type: "zalo", pagePath: `/${"a".repeat(600)}` }],
    ["refCollection sai định dạng", { type: "zalo", pagePath: "/", refCollection: "Rentals; DROP" }],
    ["refId sai định dạng", { type: "zalo", pagePath: "/", refId: "a b" }],
    ["body không phải object", "zalo"],
  ])("%s -> 400, không ghi", async (_name, body) => {
    const response = await handleClickEvent(post(body), save, allowed);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(save).not.toHaveBeenCalled();
  });

  it("body không phải JSON hoặc quá lớn -> 400", async () => {
    expect((await handleClickEvent(post("{khong-phai-json", true), save, allowed)).status).toBe(400);
    expect((await handleClickEvent(post({ type: "zalo", pagePath: "/", pad: "x".repeat(3_000) }), save, allowed)).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });

  it("vượt giới hạn -> 429 kèm Retry-After, không ghi", async () => {
    const deps = { ...allowed, rateLimit: vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 42 })) };
    const response = await handleClickEvent(post({ type: "zalo", pagePath: "/" }), save, deps);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(save).not.toHaveBeenCalled();
  });

  it("Redis lỗi -> 503 (fail closed), không ghi", async () => {
    const deps = {
      ...allowed,
      rateLimit: vi.fn(async () => {
        throw new RateLimitUnavailableError(new Error("down"));
      }),
    };
    const response = await handleClickEvent(post({ type: "zalo", pagePath: "/" }), save, deps);
    expect(response.status).toBe(503);
    expect(save).not.toHaveBeenCalled();
  });

  it("dùng rate limit endpoint click-events và không gọi Turnstile", async () => {
    const rateLimit = vi.fn(async () => ({ allowed: true as const, remaining: 1 }));
    const verifyTurnstile = vi.fn(async () => ({ ok: true as const }));
    await handleClickEvent(post({ type: "zalo", pagePath: "/" }), save, { rateLimit, verifyTurnstile });
    expect(rateLimit).toHaveBeenCalledWith("click-events", expect.any(String));
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });
});
