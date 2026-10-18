import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;

/** Chạy thật `up` -> `down` -> `down` -> `up` của migration index trigram trên DB tạm (mẫu `property-posts-migration.test.ts`). */
describe.skipIf(!baseUrl)("integration: migration rentals_search_trgm up/down/up (DB tạm)", () => {
  const dbName = `tami_trgm_mig_${Date.now().toString(36)}`;
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

  it("down gỡ index (chạy lại không lỗi nhờ IF EXISTS), up tạo lại; không đụng bảng/dữ liệu", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === "20261018_082231_rentals_search_trgm");
    expect(migration).toBeDefined();
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;
    const indexCount = async () =>
      Number((await db.execute(sql`SELECT count(*)::int AS n FROM pg_indexes WHERE indexname = 'rentals_locales_search_text_trgm_idx'`)).rows[0]!.n);

    expect(await indexCount()).toBe(1);
    await migration!.down(args);
    expect(await indexCount()).toBe(0);
    await migration!.down(args);
    await migration!.up(args);
    expect(await indexCount()).toBe(1);
    await migration!.up(args);
    expect(await indexCount()).toBe(1);
    const table = await db.execute(sql`SELECT to_regclass('public.rentals_locales')::text AS t`);
    expect(table.rows[0]).toEqual({ t: "rentals_locales" });
  }, 120_000);
});
