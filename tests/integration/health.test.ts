import { afterAll, describe, expect, it, vi } from "vitest";
import { closeRedis } from "@/lib/redis";

// Cờ để giả lập Redis tắt mà không cần dừng dịch vụ thật.
const redisState = vi.hoisted(() => ({ down: false }));

vi.mock("@/lib/redis", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/redis")>();
  return {
    ...original,
    getRedis: () => {
      if (!redisState.down) return original.getRedis();
      return { ping: () => Promise.reject(new Error("ECONNREFUSED redis://secret@host")) };
    },
  };
});

afterAll(async () => {
  await closeRedis();
});

// Cần Postgres + Redis + SeaweedFS dev thật (như các integration test khác).
describe("GET /api/health", () => {
  it("DB, Redis, S3 đều ổn → 200, no-store, chỉ có trạng thái", async () => {
    redisState.down = false;
    const { GET } = await import("@/app/(payload)/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      status: "ok",
      checks: { db: "up", redis: "up", storage: "up" },
    });
  });

  it("Redis tắt → 503 với redis: down, không lộ thông điệp lỗi", async () => {
    redisState.down = true;
    const { GET } = await import("@/app/(payload)/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.status).toBe("down");
    expect(body.checks.redis).toBe("down");
    expect(JSON.stringify(body)).not.toMatch(/ECONNREFUSED|secret/);
  });
});
