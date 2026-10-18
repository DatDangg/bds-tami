import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const MIGRATION_NAME = "20261018_094454_leads";
const LEAD_TABLES = ["lead_activities", "leads"];
const LEAD_INDEXES = ["leads_locale_idx", "leads_phone_source_created_idx", "leads_status_assignee_created_idx"];

/** Chạy thật toàn bộ migration trên DB tạm, rồi `down` -> `down` (IF EXISTS) -> `up` (mẫu `homepage-migration.test.ts`). */
describe.skipIf(!baseUrl)("integration: migration leads up/down/up (DB tạm)", () => {
  const dbName = `tami_leads_mig_${Date.now().toString(36)}`;
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

  it("up tạo bảng + sequence + index DESC; down chạy được (kể cả chạy lặp); up chạy lại được", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === MIGRATION_NAME);
    expect(migration).toBeDefined();
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;
    const names = async (query: ReturnType<typeof sql>) => (await db.execute(query)).rows.map((row) => row.name);
    const tables = () =>
      names(sql`SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('leads', 'lead_activities') ORDER BY table_name`);
    const sequences = () => names(sql`SELECT sequencename AS name FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'leads_code_seq'`);
    const indexes = () => names(sql`SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND indexname IN ('leads_locale_idx', 'leads_phone_source_created_idx', 'leads_status_assignee_created_idx') ORDER BY indexname`);
    const enums = async () => (await db.execute(sql`SELECT count(*)::int AS n FROM pg_type WHERE typname IN ('enum_leads_source', 'enum_leads_locale', 'enum_leads_status') OR typname LIKE 'enum_lead_activities_%'`)).rows[0]?.n;

    expect(await tables()).toEqual(LEAD_TABLES);
    expect(await sequences()).toEqual(["leads_code_seq"]);
    expect(await indexes()).toEqual(LEAD_INDEXES);
    const desc = await db.execute(sql`SELECT indexdef FROM pg_indexes WHERE indexname = 'leads_phone_source_created_idx'`);
    expect(String(desc.rows[0]?.indexdef)).toContain("created_at DESC");

    await migration!.down(args);
    expect(await tables()).toEqual([]);
    expect(await sequences()).toEqual([]);
    expect(await enums()).toBe(0);
    await migration!.down(args);

    await migration!.up(args);
    expect(await tables()).toEqual(LEAD_TABLES);
    expect(await sequences()).toEqual(["leads_code_seq"]);
    expect(await indexes()).toEqual(LEAD_INDEXES);
    expect(await enums()).toBe(6);
  }, 180_000);
});
