import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;

/**
 * Review L7-T01 MAJOR-1/MINOR-1: `down` của migration property_posts phải chạy được (DROP CONSTRAINT sau DROP TABLE CASCADE, dựng lại enum jobs
 * khi còn dòng 'expire-offers'). Chạy thật `up` -> `down` -> `up` trên DB tạm (mẫu `news-migration.test.ts`).
 */
describe.skipIf(!baseUrl)("integration: migration property_posts up/down/up (DB tạm)", () => {
  const dbName = `tami_pp_mig_${Date.now().toString(36)}`;
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

  it("down chạy được kể cả khi còn job expire-offers, rồi up chạy lại được", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === "20261018_075627_property_posts");
    expect(migration).toBeDefined();
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;

    await db.execute(sql`INSERT INTO "payload_jobs" ("task_slug", "queue") VALUES ('expire-offers', 'default')`);
    await migration!.down(args);

    const afterDown = await db.execute(sql`SELECT to_regclass('public.property_posts')::text AS t, (SELECT count(*)::int FROM pg_enum e JOIN pg_type y ON y.oid = e.enumtypid WHERE y.typname = 'enum_payload_jobs_task_slug' AND e.enumlabel = 'expire-offers') AS n`);
    expect(afterDown.rows[0]).toEqual({ t: null, n: 0 });

    await migration!.up(args);
    const afterUp = await db.execute(sql`SELECT to_regclass('public.property_posts')::text AS t`);
    expect(afterUp.rows[0]).toEqual({ t: "property_posts" });
  }, 120_000);
});
