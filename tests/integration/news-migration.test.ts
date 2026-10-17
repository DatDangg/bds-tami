import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;

/**
 * Index danh sách tin tức do MIGRATION tạo (review L5-T03 MINOR-2): các test news khác dựng schema bằng `push: true` nên không
 * chứng minh được migration thật có index. File này chạy migration thật trên DB tạm rồi đọc `pg_indexes` (mẫu `audit-staff.test.ts`).
 */
describe.skipIf(!baseUrl)("integration: migration news (DB tạm)", () => {
  const dbName = `tami_news_mig_${Date.now().toString(36)}`;
  let payload: Payload;
  let testUrl: string;

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
    testUrl = url.toString();
    process.env.DATABASE_URL = testUrl;
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

  it("news_list_idx tồn tại sau migration: (status, has_english, category_id, published_at DESC)", async () => {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      const rows = await client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'news' AND indexname = 'news_list_idx'`);
      expect(rows.rows).toHaveLength(1);
      const definition = String(rows.rows[0].indexdef);
      expect(definition).toContain("(status, has_english, category_id, published_at DESC)");
    } finally {
      await client.end();
    }
  });
});
