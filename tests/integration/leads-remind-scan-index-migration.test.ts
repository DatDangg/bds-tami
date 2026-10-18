import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const MIGRATION_NAME = "20261018_212611_leads_remind_scan_index";
const INDEX_NAME = "status_assignedTo_remindedAt_createdAt_idx";

/**
 * Index tổng hợp cho truy vấn quét của job `remind-unassigned-leads` (BL-009). Chạy thật `up` -> `down` -> `down` lần hai (IF EXISTS)
 * -> `up` -> `up` lần hai (IF NOT EXISTS) trên DB tạm (mẫu `leads-reminded-at-migration.test.ts`), rồi EXPLAIN câu quét với seqscan tắt.
 */
describe.skipIf(!baseUrl)("integration: migration leads_remind_scan_index up/down/up (DB tạm)", () => {
  const dbName = `tami_remind_idx_mig_${Date.now().toString(36)}`;
  let payload: Payload;

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const url = new URL(baseUrl!);
    url.pathname = `/${dbName}`;
    process.env.DATABASE_URL = url.toString();
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
  }, 180_000);

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

  it("up tạo index btree đúng cột/thứ tự; down xoá; down lần hai và up lần hai êm; truy vấn quét dùng được index", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === MIGRATION_NAME);
    expect(migration).toBeDefined();
    // Cột `reminded_at` do migration leads_reminded_at tạo: migration này phải đứng sau.
    expect(migrations.findIndex((item) => item.name === MIGRATION_NAME)).toBeGreaterThan(migrations.findIndex((item) => item.name === "20261018_113101_leads_reminded_at"));
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;
    const indexDef = async () => (await db.execute(sql`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'leads' AND indexname = ${INDEX_NAME}`)).rows[0]?.indexdef;
    const expectedDef = `CREATE INDEX "${INDEX_NAME}" ON public.leads USING btree (status, assigned_to_id, reminded_at, created_at)`;

    expect(await indexDef()).toBe(expectedDef);

    await migration!.down(args);
    expect(await indexDef()).toBeUndefined();
    await migration!.down(args);
    expect(await indexDef()).toBeUndefined();

    await migration!.up(args);
    expect(await indexDef()).toBe(expectedDef);
    await migration!.up(args);
    expect(await indexDef()).toBe(expectedDef);

    // Dữ liệu thử (DB tạm, xoá cùng DB): 20.000 lead, nửa `new`; phần lớn lead `new` đã nhắc, chỉ ~1% chưa nhắc — đúng hình dạng dữ liệu thật
    // sau thời gian dài chạy (lead `new` chưa giao nhưng đã nhắc tích tụ), nơi index cũ `(status, assigned_to_id, created_at)` phải lọc nhiều.
    await db.execute(sql`INSERT INTO leads (code, source, full_name, phone, phone_normalized, locale, status, reminded_at, consent_at, consent_version, created_at)
      SELECT 'LD-' || lpad(n::text, 6, '0'), 'contact', 'Khách ' || n, '0900000000', '+84900000000', 'vi',
        CASE WHEN n % 2 = 0 THEN 'new' ELSE 'contacted' END::enum_leads_status,
        CASE WHEN n % 200 = 0 THEN NULL ELSE now() - (n || ' minutes')::interval END,
        now(), 'v1', now() - (n || ' minutes')::interval
      FROM generate_series(1, 20000) AS n`);
    await db.execute(sql`ANALYZE leads`);
    // Câu quét tương đương Payload sinh cho `findDueLeads` (gồm `deleted_at IS NULL` do trash); tắt seqscan để planner lộ index dùng được (bảng còn nhỏ).
    await db.execute(sql`SET enable_seqscan = off`);
    const plan = await db.execute(
      sql`EXPLAIN SELECT id, code, created_at FROM leads
        WHERE status = 'new' AND assigned_to_id IS NULL AND reminded_at IS NULL AND anonymized_at IS NULL AND deleted_at IS NULL AND created_at <= now()
        ORDER BY created_at ASC LIMIT 200`,
    );
    const planText = plan.rows.map((row) => String(row["QUERY PLAN"])).join("\n");
    expect(planText).toContain(INDEX_NAME);
  }, 180_000);
});
