import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { assertWithinBudget, recordUsage } from "../../src/lib/translation/budget";
import { createTranslationService } from "../../src/lib/translation/translation-service";
import { echoResponse, fakeClient } from "../../src/lib/translation/test-helpers";

const baseUrl = process.env.DATABASE_URL_TEST;

async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

const NEW_ROW = { inputTokens: 0, outputTokens: 0, requests: 0, estimatedCostUsd: 0 };
const USAGE = { inputTokens: 100, outputTokens: 50, cacheCreationTokens: 0, cacheReadTokens: 0 };

/** DB tạm riêng (chạy migration thật). SDK luôn là bản giả: không gọi API thật, không cần khoá. */
describe.skipIf(!baseUrl)("integration: translation-usage + hạn mức (DB tạm, SDK giả)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_translation_${runId}`;
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: `Test ${label}`, role, active: true },
    });
  }

  const usageRows = (month: string) =>
    payload.find({ collection: "translation-usage", where: { month: { equals: month } }, overrideAccess: true, depth: 0, limit: 10 });

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
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
  }, 120_000);

  afterAll(async () => {
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

  it("25 lần ghi nhận song song cùng tháng: đúng 1 dòng, cộng đủ, không mất lần nào", async () => {
    await Promise.all(Array.from({ length: 25 }, () => recordUsage(payload, "2026-01", USAGE, 0.01)));
    const { docs } = await usageRows("2026-01");
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ month: "2026-01", requests: 25, inputTokens: 2500, outputTokens: 1250 });
    expect(docs[0]!.estimatedCostUsd).toBeCloseTo(0.25, 6);
  });

  it("tháng khác là dòng khác; unique(month) do DB giữ", async () => {
    await recordUsage(payload, "2026-02", USAGE, 0.5);
    expect((await usageRows("2026-02")).docs[0]).toMatchObject({ requests: 1, inputTokens: 100 });
    expect((await usageRows("2026-01")).docs[0]).toMatchObject({ requests: 25 });
    const duplicate = await statusOf(payload.create({ collection: "translation-usage", overrideAccess: true, data: { month: "2026-02", ...NEW_ROW } }));
    expect(duplicate).toBeDefined();
    expect(await statusOf(payload.create({ collection: "translation-usage", overrideAccess: true, data: { month: "2026-13", ...NEW_ROW } }))).toBe(400);
  });

  it("hạn mức đọc từ DB thật: chạm hạn mức thì dừng, còn dư thì cho qua", async () => {
    await expect(assertWithinBudget(payload, "2026-01", 0.25)).rejects.toMatchObject({ code: "budget_exceeded" });
    await expect(assertWithinBudget(payload, "2026-01", 0.26)).resolves.toBeUndefined();
    await expect(assertWithinBudget(payload, "2099-12", 0.01)).resolves.toBeUndefined();
  });

  it("service đầu-cuối (SDK giả): ghi usage thật, lần sau vượt hạn mức thì không gọi SDK nữa; glossary đọc từ site-settings", async () => {
    const llm = fakeClient((request) => echoResponse(request, { usage: { inputTokens: 1_000_000, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 } }));
    const service = createTranslationService({
      payload,
      client: llm.client,
      config: { model: "claude-sonnet-5", monthlyBudgetUsd: 3 },
      now: () => new Date("2026-03-15T00:00:00Z"),
    });
    const request = { target: { kind: "collection", slug: "news" }, items: [{ key: "title", kind: "text", value: "Xin chào" }] } as const;
    await service.translate(request);
    expect((await usageRows("2026-03")).docs[0]).toMatchObject({ requests: 1, inputTokens: 1_000_000 });
    expect((await usageRows("2026-03")).docs[0]!.estimatedCostUsd).toBeCloseTo(2, 6);
    await service.translate(request);
    await expect(service.translate(request)).rejects.toMatchObject({ code: "budget_exceeded" });
    expect(llm.calls).toHaveLength(2);
    expect(llm.calls[0]!.system).toContain("Glossary");
  });

  it("RBAC: chỉ admin đọc; không ai (kể cả admin) tạo/sửa/xoá qua API; khách bị chặn REST", async () => {
    const { docs } = await usageRows("2026-01");
    const id = docs[0]!.id;
    const read = (user?: ReturnType<typeof asUser>) =>
      payload.find({ collection: "translation-usage", user, overrideAccess: false, depth: 0 });
    expect((await read(asUser(admin))).totalDocs).toBeGreaterThan(0);
    expect(await statusOf(read(asUser(sale)))).toBe(403);
    expect(await statusOf(read(undefined))).toBe(403);
    for (const actor of [admin, sale]) {
      const user = asUser(actor);
      expect(await statusOf(payload.create({ collection: "translation-usage", user, overrideAccess: false, data: { month: "2030-01", ...NEW_ROW } }))).toBe(403);
      expect(await statusOf(payload.update({ collection: "translation-usage", id, user, overrideAccess: false, data: { requests: 0 } }))).toBe(403);
      expect(await statusOf(payload.delete({ collection: "translation-usage", id, user, overrideAccess: false }))).toBe(403);
    }
    const rest = await handleEndpoints({ config: payload.config, request: new Request("http://localhost/api/translation-usage") });
    expect(rest.status).toBe(403);
    expect((await usageRows("2026-01")).docs[0]).toMatchObject({ requests: 25 });
  });
});
