import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const hasRedis = Boolean(process.env.REDIS_URL);

/** DB tạm riêng (chạy migration thật) + Redis dev thật. Thiếu DATABASE_URL_TEST/REDIS_URL thì bỏ qua có chủ đích. */
describe.skipIf(!baseUrl || !hasRedis)("integration: click-events + aggregate-click-stats (DB tạm, Redis thật)", () => {
  const dbName = `tami_click_${Date.now().toString(36)}`;
  const usedIps = new Set<string>();
  let payload: Payload;
  let aggregateClickStats: typeof import("../../src/jobs/aggregate-click-stats").aggregateClickStats;

  /** Mỗi test một IP riêng (TRUST_CF_CONNECTING_IP) để bucket rate limit không dính nhau. */
  function newIp(): string {
    let ip: string;
    do {
      ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
    } while (usedIps.has(ip));
    usedIps.add(ip);
    return ip;
  }

  function postClick(body: unknown, ip: string) {
    return handleEndpoints({
      config: payload.config,
      request: new Request("http://localhost/api/public/click-events", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
        body: JSON.stringify(body),
      }),
    });
  }

  async function stats() {
    const result = await payload.find({ collection: "click-stats-daily", overrideAccess: true, limit: 100, depth: 0 });
    return result.docs;
  }

  async function clearAll() {
    await payload.delete({ collection: "click-events", where: { id: { exists: true } }, overrideAccess: true });
    await payload.delete({ collection: "click-stats-daily", where: { id: { exists: true } }, overrideAccess: true });
  }

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const testUrl = new URL(baseUrl!);
    testUrl.pathname = `/${dbName}`;
    process.env.DATABASE_URL = testUrl.toString();
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    ({ aggregateClickStats } = await import("../../src/jobs/aggregate-click-stats"));
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
  }, 120_000);

  afterAll(async () => {
    const { getRedis, closeRedis } = await import("../../src/lib/redis");
    const { ipHash } = await import("../../src/lib/security/ip-hash");
    const keys = [...usedIps].map((ip) => `rl:click-events:${ipHash(ip)}`);
    if (keys.length > 0) await getRedis().del(...keys);
    await closeRedis();
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  it("type lạ -> 400; hợp lệ -> 204 và lưu bản ghi", async () => {
    const ip = newIp();
    expect((await postClick({ type: "email", pagePath: "/" }, ip)).status).toBe(400);
    const ok = await postClick({ type: "hotline", pagePath: "/cho-thue", refCollection: "rentals", refId: "r-1" }, ip);
    expect(ok.status).toBe(204);
    const saved = await payload.find({ collection: "click-events", overrideAccess: true, where: { pagePath: { equals: "/cho-thue" } } });
    expect(saved.docs[0]).toMatchObject({ type: "hotline", refCollection: "rentals", refId: "r-1" });
    expect(saved.docs[0]!.aggregatedAt).toBeFalsy();
  });

  it("3 sự kiện -> job gộp ra count 3; chạy lần 2 không cộng trùng; sự kiện mới chỉ cộng phần mới", async () => {
    await clearAll();
    const ip = newIp();
    for (let i = 0; i < 3; i++) expect((await postClick({ type: "zalo", pagePath: "/gioi-thieu" }, ip)).status).toBe(204);

    const first = await aggregateClickStats({ payload });
    expect(first.aggregated).toBe(3);
    const afterFirst = (await stats()).filter((row) => row.type === "zalo");
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0]).toMatchObject({ count: 3, refCollection: "", refId: "" });

    const second = await aggregateClickStats({ payload });
    expect(second).toEqual({ aggregated: 0, deleted: 0 });
    expect((await stats()).filter((row) => row.type === "zalo")[0]!.count).toBe(3);

    expect((await postClick({ type: "zalo", pagePath: "/gioi-thieu" }, ip)).status).toBe(204);
    await aggregateClickStats({ payload });
    const rows = (await stats()).filter((row) => row.type === "zalo");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.count).toBe(4);
  });

  it("xoá lượt bấm > 90 ngày chỉ khi đã gộp: gộp trước rồi mới xoá, không mất số liệu", async () => {
    await clearAll();
    const now = new Date("2026-10-16T10:00:00.000Z");
    await payload.create({
      collection: "click-events",
      overrideAccess: true,
      data: { type: "fanpage", pagePath: "/cu", createdAt: "2026-06-01T03:00:00.000Z" },
    });
    const recent = await payload.create({
      collection: "click-events",
      overrideAccess: true,
      data: { type: "fanpage", pagePath: "/moi", createdAt: "2026-10-15T03:00:00.000Z" },
    });

    expect(await aggregateClickStats({ payload, now })).toEqual({ aggregated: 2, deleted: 1 });
    const remaining = await payload.find({ collection: "click-events", overrideAccess: true });
    expect(remaining.docs.map((doc) => doc.id)).toEqual([recent.id]);
    const byDate = Object.fromEntries((await stats()).map((row) => [row.date.slice(0, 10), row.count]));
    expect(byDate).toEqual({ "2026-06-01": 1, "2026-10-15": 1 });
  });

  it("vượt 30 lần/phút/IP -> 429 kèm Retry-After; IP khác không bị ảnh hưởng", async () => {
    const ip = newIp();
    for (let i = 0; i < 30; i++) expect((await postClick({ type: "fanpage", pagePath: "/x" }, ip)).status).toBe(204);
    const blocked = await postClick({ type: "fanpage", pagePath: "/x" }, ip);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await postClick({ type: "fanpage", pagePath: "/x" }, newIp())).status).toBe(204);
  });

  it("khách không đọc/tạo được click-events và click-stats-daily qua REST (403)", async () => {
    const guest = (path: string, method: string, body?: unknown) =>
      handleEndpoints({
        config: payload.config,
        request: new Request(`http://localhost/api${path}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      });
    for (const slug of ["click-events", "click-stats-daily"]) {
      expect((await guest(`/${slug}`, "GET")).status).toBe(403);
      expect((await guest(`/${slug}`, "POST", { type: "zalo", pagePath: "/", date: new Date().toISOString(), count: 1 })).status).toBe(403);
    }
  });
});
