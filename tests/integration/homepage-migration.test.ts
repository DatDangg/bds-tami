import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const MIGRATION_NAME = "20261018_091949_homepage_global";
/** Migration additive BL-044 (T01) thêm bảng/enum cho khối Điểm mạnh + icon số liệu: phải down trước rồi mới down migration gốc. */
const REDESIGN_MIGRATION_NAME = "20261020_103248_homepage_redesign";
const HOMEPAGE_TABLES = [
  "homepage",
  "homepage_locales",
  "homepage_rels",
  "homepage_hero_slides",
  "homepage_hero_slides_locales",
  "homepage_about_stats",
  "homepage_about_stats_locales",
  "homepage_block_order",
  "homepage_strengths_items",
  "homepage_strengths_items_locales",
];
/** enum_homepage_*: block_order + about_stats_icon + strengths_items_icon (+ 3 enum của migration gốc không có tiền tố này ngoài block_order). */
const HOMEPAGE_ENUM_COUNT = 5;

/** Chạy thật toàn bộ migration trên DB tạm, rồi `down` -> `down` (IF EXISTS) -> `up` (mẫu `property-posts-migration.test.ts`). */
describe.skipIf(!baseUrl)("integration: migration homepage_global up/down/up (DB tạm)", () => {
  const dbName = `tami_hp_mig_${Date.now().toString(36)}`;
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

  it("up tạo đủ bảng; down chạy được (kể cả chạy lặp); up chạy lại được", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === MIGRATION_NAME);
    const redesign = migrations.find((item) => item.name === REDESIGN_MIGRATION_NAME);
    expect(migration).toBeDefined();
    expect(redesign).toBeDefined();
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;
    const existing = async () => {
      const result = await db.execute(
        sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'homepage%' ORDER BY table_name`,
      );
      return result.rows.map((row) => row.table_name);
    };
    const enumCount = async () => {
      const result = await db.execute(sql`SELECT count(*)::int AS n FROM pg_type WHERE typname LIKE 'enum_homepage_%'`);
      return result.rows[0]?.n;
    };

    expect(await existing()).toEqual([...HOMEPAGE_TABLES].sort());
    expect(await enumCount()).toBe(HOMEPAGE_ENUM_COUNT);

    // M1 round 1: `strengths` là phần tử đầu defaultValue của blockOrder nên DB thật gần như chắc chắn có hàng này; down phải xoá nó trước khi ép kiểu enum về bản cũ.
    const parentId = "00000000-0000-4000-8000-000000000001";
    await db.execute(sql`INSERT INTO "homepage" ("id") VALUES (${parentId})`);
    await db.execute(sql`INSERT INTO "homepage_block_order" ("_order", "_parent_id", "id", "block") VALUES (1, ${parentId}, 'row-strengths', 'strengths'), (2, ${parentId}, 'row-about', 'about')`);

    await redesign!.down(args);
    const remaining = await db.execute(sql`SELECT "block" FROM "homepage_block_order" ORDER BY "_order"`);
    expect(remaining.rows.map((row) => row.block)).toEqual(["about"]);
    await migration!.down(args);
    expect(await existing()).toEqual([]);
    expect(await enumCount()).toBe(0);
    await migration!.down(args);

    await migration!.up(args);
    await redesign!.up(args);
    expect(await existing()).toEqual([...HOMEPAGE_TABLES].sort());
    expect(await enumCount()).toBe(HOMEPAGE_ENUM_COUNT);
  }, 180_000);
});
