import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeRedis, getRedis } from "@/lib/redis";
import {
  checkEndpointRateLimit,
  checkRateLimit,
  RATE_LIMITS,
  RateLimitUnavailableError,
} from "@/lib/security/rate-limit";

// Dùng Redis dev thật (REDIS_URL trong .env.local / CI). Khoá có scope ngẫu nhiên nên không đụng dữ liệu khác.
const scope = `test-${randomUUID()}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterAll(async () => {
  const redis = getRedis();
  const keys = await redis.keys(`rl:${scope}*`);
  if (keys.length > 0) await redis.del(...keys);
  await closeRedis();
});

describe("checkRateLimit (Redis thật)", () => {
  it("cho qua đủ `limit` lần, lần kế tiếp bị chặn kèm Retry-After trong cửa sổ", async () => {
    const rule = { limit: 3, windowSeconds: 60 };
    for (let i = 1; i <= 3; i++) {
      const result = await checkRateLimit(scope, "ip-a", rule);
      expect(result).toEqual({ allowed: true, remaining: 3 - i });
    }
    const blocked = await checkRateLimit(scope, "ip-a", rule);
    expect(blocked.allowed).toBe(false);
    if (blocked.allowed) return;
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("subject khác không ảnh hưởng nhau", async () => {
    const rule = { limit: 1, windowSeconds: 60 };
    expect((await checkRateLimit(scope, "ip-b", rule)).allowed).toBe(true);
    expect((await checkRateLimit(scope, "ip-b", rule)).allowed).toBe(false);
    expect((await checkRateLimit(scope, "ip-c", rule)).allowed).toBe(true);
  });

  it("hết cửa sổ -> cho qua lại", async () => {
    const rule = { limit: 1, windowSeconds: 1 };
    expect((await checkRateLimit(scope, "ip-d", rule)).allowed).toBe(true);
    expect((await checkRateLimit(scope, "ip-d", rule)).allowed).toBe(false);
    await sleep(1_200);
    expect((await checkRateLimit(scope, "ip-d", rule)).allowed).toBe(true);
  });

  it("atomic: 20 request song song với limit 5 -> đúng 5 được qua", async () => {
    const rule = { limit: 5, windowSeconds: 60 };
    const results = await Promise.all(Array.from({ length: 20 }, () => checkRateLimit(scope, "ip-e", rule)));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("khoá mất TTL (ví dụ bị PERSIST) được đặt lại, không chặn vĩnh viễn", async () => {
    const rule = { limit: 1, windowSeconds: 60 };
    await checkRateLimit(scope, "ip-f", rule);
    await getRedis().persist(`rl:${scope}:ip-f`);
    const blocked = await checkRateLimit(scope, "ip-f", rule);
    expect(blocked.allowed).toBe(false);
    expect(await getRedis().pttl(`rl:${scope}:ip-f`)).toBeGreaterThan(0);
  });

  it("cấu hình endpoint khớp API_SPEC §3", () => {
    expect(RATE_LIMITS.leads).toEqual({ limit: 5, windowSeconds: 600 });
    expect(RATE_LIMITS["job-applications"]).toEqual({ limit: 3, windowSeconds: 3600 });
    expect(RATE_LIMITS.rentals).toEqual({ limit: 60, windowSeconds: 60 });
    expect(RATE_LIMITS["click-events"]).toEqual({ limit: 30, windowSeconds: 60 });
    expect(RATE_LIMITS["admin-export-excel"]).toEqual({ limit: 10, windowSeconds: 3600 });
  });

  it("checkEndpointRateLimit đếm theo khoá `rl:<endpoint>:<subject>` rồi chặn ở lần thứ 6 của leads", async () => {
    const subject = `ip-${randomUUID()}`;
    for (let i = 0; i < 5; i++) expect((await checkEndpointRateLimit("leads", subject)).allowed).toBe(true);
    expect((await checkEndpointRateLimit("leads", subject)).allowed).toBe(false);
    await getRedis().del(`rl:leads:${subject}`);
  });
});

describe("Redis mất kết nối", () => {
  it("ném RateLimitUnavailableError (để endpoint trả 503, fail closed)", async () => {
    await closeRedis();
    const original = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://127.0.0.1:1"; // cổng không có dịch vụ
    try {
      await expect(checkRateLimit(scope, "ip-g", { limit: 5, windowSeconds: 60 })).rejects.toBeInstanceOf(
        RateLimitUnavailableError,
      );
    } finally {
      await closeRedis();
      process.env.REDIS_URL = original;
    }
  });
});
