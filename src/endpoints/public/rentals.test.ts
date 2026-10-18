import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RentalSearchParams, RentalSearchResult } from "../../shared/types/api";
import { RateLimitUnavailableError } from "../../lib/security/rate-limit";
import type { PublicPipelineDeps } from "../_middleware/public-pipeline";
import { handleRentalsSearch, parseRentalSearchParams } from "./rentals";

const allowed: PublicPipelineDeps = {
  rateLimit: vi.fn(async () => ({ allowed: true as const, remaining: 59 })),
  verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
};
const empty: RentalSearchResult = { items: [], total: 0, page: 1, totalPages: 0 };

const get = (query: string) => ({ url: `https://tami.test/api/public/rentals${query}`, headers: new Headers() });

describe("GET /api/public/rentals", () => {
  const search = vi.fn<(params: RentalSearchParams) => Promise<RentalSearchResult>>(async () => empty);

  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    search.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("200 { success, data } kèm Cache-Control s-maxage=60, truyền tham số đã kiểm cho service", async () => {
    const response = await handleRentalsSearch(get("?locale=en&q=studio&bedrooms=2&limit=24"), { search }, allowed);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60");
    expect(await response.json()).toEqual({ success: true, data: empty });
    expect(search).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ locale: "en", q: "studio", bedrooms: 2, limit: 24, page: 1, sort: "newest" }));
  });

  it("tham số sai -> 400 + no-store, service không được gọi", async () => {
    const response = await handleRentalsSearch(get("?limit=49"), { search }, allowed);
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = (await response.json()) as { success: boolean; details: unknown[] };
    expect(body.success).toBe(false);
    expect(body.details).toHaveLength(1);
    expect(search).not.toHaveBeenCalled();
  });

  it("vượt rate limit -> 429 + Retry-After + no-store; Redis lỗi -> 503 (fail closed)", async () => {
    const limited = await handleRentalsSearch(get(""), { search }, {
      ...allowed,
      rateLimit: async () => ({ allowed: false as const, retryAfterSeconds: 17 }),
    });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("17");
    expect(limited.headers.get("Cache-Control")).toBe("no-store");
    const down = await handleRentalsSearch(get(""), { search }, {
      ...allowed,
      rateLimit: async () => {
        throw new RateLimitUnavailableError(new Error("redis"));
      },
    });
    expect(down.status).toBe(503);
    expect(search).not.toHaveBeenCalled();
  });

  it("rate limit dùng endpoint rentals; không đòi Turnstile", async () => {
    const rateLimit = vi.fn(async () => ({ allowed: true as const, remaining: 1 }));
    const verifyTurnstile = vi.fn(async () => ({ ok: true as const }));
    await handleRentalsSearch(get(""), { search }, { rateLimit, verifyTurnstile });
    expect(rateLimit).toHaveBeenCalledWith("rentals", expect.any(String));
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });
});

describe("parseRentalSearchParams", () => {
  it("khoá lặp lấy giá trị đầu; khoá lạ bị bỏ qua", () => {
    const outcome = parseRentalSearchParams("https://tami.test/x?q=a&q=b&foo=bar");
    expect(outcome).toEqual({ ok: true, value: expect.objectContaining({ q: "a" }) });
    expect(outcome.ok && "foo" in outcome.value).toBe(false);
  });
});
