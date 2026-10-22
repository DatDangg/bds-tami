import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Logger thật ghi ra stdout; test kiểm nội dung log qua mock.
const log = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { child: () => log, ...log } }));

import { ViewDedupeUnavailableError } from "../../lib/news/view-dedupe";
import { RateLimitUnavailableError } from "../../lib/security/rate-limit";
import type { PublicPipelineDeps } from "../_middleware/public-pipeline";
import { handleNewsView, type NewsViewDeps } from "./news-views";

const NEWS_ID = "5b1d7c1e-6d5f-4a43-9a5e-0c1b2a3d4e5f";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const IP = "203.0.113.77";
const NOW = new Date("2026-10-22T03:00:00Z");

const allowed: PublicPipelineDeps = {
  rateLimit: vi.fn(async () => ({ allowed: true as const, remaining: 29 })),
  verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
};

function post(body: unknown, { raw = false, headers = {} as Record<string, string> } = {}) {
  return new Request("https://tami.test/api/public/news-views", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8", "User-Agent": CHROME, "CF-Connecting-IP": IP, ...headers },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

/** Giả lập Redis `SET NX` bằng Set trong bộ nhớ + DB bằng bộ đếm. */
function fakeDeps(overrides: Partial<NewsViewDeps> = {}) {
  const claimed = new Set<string>();
  const views = new Map<string, number>();
  const deps = {
    isCountable: vi.fn(async (newsId: string) => newsId === NEWS_ID),
    claimView: vi.fn(async (key: string) => {
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    }),
    addView: vi.fn(async (newsId: string, day: Date) => {
      const key = `${newsId}|${day.toISOString()}`;
      views.set(key, (views.get(key) ?? 0) + 1);
    }),
    now: () => NOW,
    ...overrides,
  } satisfies NewsViewDeps;
  return { deps, views, claimed };
}

describe("POST /api/public/news-views", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    vi.stubEnv("TRUST_CF_CONNECTING_IP", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("lần xem đầu -> 204 rỗng, +1 cho (bài, ngày VN 00:00)", async () => {
    const { deps, views } = fakeDeps();
    const response = await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(deps.addView).toHaveBeenCalledExactlyOnceWith(NEWS_ID, new Date("2026-10-21T17:00:00.000Z"));
    expect([...views.values()]).toEqual([1]);
  });

  it("cùng người (IP + UA) xem lại trong ngày -> 204, không cộng thêm", async () => {
    const { deps, views } = fakeDeps();
    await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    const again = await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    expect(again.status).toBe(204);
    expect(deps.addView).toHaveBeenCalledTimes(1);
    expect([...views.values()]).toEqual([1]);
  });

  it("người khác (IP khác hoặc UA khác) cùng ngày -> được cộng", async () => {
    const { deps, views } = fakeDeps();
    await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    await handleNewsView(post({ newsId: NEWS_ID }, { headers: { "CF-Connecting-IP": "203.0.113.78" } }), deps, allowed);
    await handleNewsView(post({ newsId: NEWS_ID }, { headers: { "User-Agent": `${CHROME} Edg/141.0.0.0` } }), deps, allowed);
    expect([...views.values()]).toEqual([3]);
  });

  it("khoá chống trùng TTL tới hết ngày VN và không chứa IP / UA / id bài thô", async () => {
    const { deps } = fakeDeps();
    await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    const [key, ttl] = vi.mocked(deps.claimView).mock.calls[0]!;
    expect(ttl).toBe(14 * 60 * 60); // 03:00 UTC = 10:00 VN -> còn 14 giờ
    expect(key).toMatch(/^nv:[0-9a-f]{64}$/);
    for (const raw of [IP, CHROME, NEWS_ID]) expect(key).not.toContain(raw);
  });

  it.each([
    ["UA rỗng", { "User-Agent": "" }],
    ["Googlebot", { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }],
    ["Chrome headless", { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/141.0.0.0 Safari/537.36" }],
    ["xem trước link", { "User-Agent": "facebookexternalhit/1.1" }],
    ["prefetch", { "Sec-Purpose": "prefetch" }],
  ])("%s -> 204, không kiểm bài, không đụng Redis, không cộng", async (_name, headers) => {
    const { deps } = fakeDeps();
    const response = await handleNewsView(post({ newsId: NEWS_ID }, { headers }), deps, allowed);
    expect(response.status).toBe(204);
    expect(deps.isCountable).not.toHaveBeenCalled();
    expect(deps.claimView).not.toHaveBeenCalled();
    expect(deps.addView).not.toHaveBeenCalled();
  });

  it("bài không tồn tại / chưa xuất bản / xoá mềm -> 204 như khi đếm, không ghi khoá, không cộng", async () => {
    const { deps } = fakeDeps({ isCountable: vi.fn(async () => false) });
    const response = await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(deps.claimView).not.toHaveBeenCalled();
    expect(deps.addView).not.toHaveBeenCalled();
  });

  it("Redis lỗi ở bước chống trùng -> 503, KHÔNG cộng, log không chứa IP / UA", async () => {
    const { deps } = fakeDeps({
      claimView: vi.fn(async () => {
        throw new ViewDedupeUnavailableError(new Error("ECONNREFUSED"));
      }),
    });
    const response = await handleNewsView(post({ newsId: NEWS_ID }), deps, allowed);
    expect(response.status).toBe(503);
    expect(deps.addView).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledOnce();
    const logged = JSON.stringify([...log.warn.mock.calls, ...log.error.mock.calls]);
    expect(logged).not.toContain(IP);
    expect(logged).not.toContain(CHROME);
  });

  it("Redis lỗi ở rate limit -> 503 (fail closed), không kiểm bài, không cộng", async () => {
    const { deps } = fakeDeps();
    const pipeline = {
      ...allowed,
      rateLimit: vi.fn(async () => {
        throw new RateLimitUnavailableError(new Error("down"));
      }),
    };
    const response = await handleNewsView(post({ newsId: NEWS_ID }), deps, pipeline);
    expect(response.status).toBe(503);
    expect(deps.isCountable).not.toHaveBeenCalled();
    expect(deps.addView).not.toHaveBeenCalled();
  });

  it("vượt giới hạn -> 429 kèm Retry-After, không cộng", async () => {
    const { deps } = fakeDeps();
    const pipeline = { ...allowed, rateLimit: vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 42 })) };
    const response = await handleNewsView(post({ newsId: NEWS_ID }), deps, pipeline);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(deps.addView).not.toHaveBeenCalled();
  });

  it("dùng rate limit endpoint news-views theo IP băm, không gọi Turnstile", async () => {
    const { deps } = fakeDeps();
    const rateLimit = vi.fn(async () => ({ allowed: true as const, remaining: 1 }));
    const verifyTurnstile = vi.fn(async () => ({ ok: true as const }));
    await handleNewsView(post({ newsId: NEWS_ID }), deps, { rateLimit, verifyTurnstile });
    expect(rateLimit).toHaveBeenCalledWith("news-views", expect.stringMatching(/^[0-9a-f]{64}$/));
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });

  it.each([
    ["thiếu newsId", {}],
    ["newsId không phải UUID", { newsId: "abc" }],
    ["newsId là số", { newsId: 42 }],
    ["newsId chèn SQL", { newsId: "5b1d7c1e-6d5f-4a43-9a5e-0c1b2a3d4e5f'; DROP TABLE news;--" }],
    ["body không phải object", "abc"],
  ])("%s -> 400, không cộng", async (_name, body) => {
    const { deps } = fakeDeps();
    const response = await handleNewsView(post(body), deps, allowed);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(deps.addView).not.toHaveBeenCalled();
  });

  it("body không phải JSON hoặc quá lớn -> 400", async () => {
    const { deps } = fakeDeps();
    expect((await handleNewsView(post("{khong-json", { raw: true }), deps, allowed)).status).toBe(400);
    expect((await handleNewsView(post({ newsId: NEWS_ID, pad: "x".repeat(600) }), deps, allowed)).status).toBe(400);
    expect(deps.addView).not.toHaveBeenCalled();
  });
});
