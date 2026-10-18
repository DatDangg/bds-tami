import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const MIGRATION_NAME = "20261018_203017_rentals_reindex_job";

/** Chạy thật `up` -> `down` (còn job/log 'reindex-rentals-search') -> `down` lần hai (IF EXISTS) -> `up` (mẫu `translate-content-migration.test.ts`). */
describe.skipIf(!baseUrl)("integration: migration rentals_reindex_job up/down/up (DB tạm)", () => {
  const dbName = `tami_reindex_mig_${Date.now().toString(36)}`;
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

  it("down chạy được kể cả khi còn job/log của task, giữ job/log task khác và giá trị enum cũ (gồm translate-content); down lần hai êm; up chạy lại được", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === MIGRATION_NAME);
    expect(migration).toBeDefined();
    // Phải chạy SAU migration translate_content: `down` dựng lại enum với danh sách cũ gồm 'translate-content'.
    expect(migrations.findIndex((item) => item.name === MIGRATION_NAME)).toBeGreaterThan(migrations.findIndex((item) => item.name === "20261018_140000_translate_content"));
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;
    const enumCount = (type: string, label: string) =>
      sql`(SELECT count(*)::int FROM pg_enum e JOIN pg_type y ON y.oid = e.enumtypid WHERE y.typname = ${type} AND e.enumlabel = ${label})`;
    const state = () =>
      db
        .execute(
          sql`SELECT ${enumCount("enum_payload_jobs_task_slug", "reindex-rentals-search")} AS job_enum,
            ${enumCount("enum_payload_jobs_log_task_slug", "reindex-rentals-search")} AS log_enum,
            ${enumCount("enum_payload_jobs_task_slug", "translate-content")} AS old_job_enum,
            ${enumCount("enum_payload_jobs_log_task_slug", "translate-content")} AS old_log_enum`,
        )
        .then((result) => result.rows[0]);

    expect(await state()).toEqual({ job_enum: 1, log_enum: 1, old_job_enum: 1, old_log_enum: 1 });

    await db.execute(sql`INSERT INTO "payload_jobs" ("task_slug", "queue") VALUES ('reindex-rentals-search', 'default'), ('translate-content', 'default')`);
    // Log của task nằm dưới một job KHÁC (không bị FK cascade khi xoá job của task): chỉ câu DELETE log của `down` gỡ được.
    await db.execute(sql`INSERT INTO "payload_jobs" ("id", "task_slug", "queue") VALUES ('00000000-0000-4000-8000-000000000003', 'send-notification-email', 'default')`);
    await db.execute(sql`INSERT INTO "payload_jobs_log" ("_order", "_parent_id", "id", "executed_at", "completed_at", "task_slug", "task_i_d", "state") VALUES (1, '00000000-0000-4000-8000-000000000003', 'log-reindex', now(), now(), 'reindex-rentals-search', '1', 'succeeded'), (2, '00000000-0000-4000-8000-000000000003', 'log-keep', now(), now(), 'translate-content', '2', 'succeeded')`);

    await migration!.down(args);
    expect(await state()).toEqual({ job_enum: 0, log_enum: 0, old_job_enum: 1, old_log_enum: 1 });
    const remaining = await db.execute(sql`SELECT (SELECT count(*)::int FROM "payload_jobs" WHERE "task_slug"::text = 'reindex-rentals-search') AS jobs, (SELECT count(*)::int FROM "payload_jobs" WHERE "task_slug"::text = 'translate-content') AS other_jobs, (SELECT count(*)::int FROM "payload_jobs_log" WHERE "id" = 'log-reindex') AS logs, (SELECT count(*)::int FROM "payload_jobs_log" WHERE "id" = 'log-keep') AS other_logs`);
    expect(remaining.rows[0]).toEqual({ jobs: 0, other_jobs: 1, logs: 0, other_logs: 1 });

    await migration!.down(args);
    expect(await state()).toEqual({ job_enum: 0, log_enum: 0, old_job_enum: 1, old_log_enum: 1 });

    await migration!.up(args);
    expect(await state()).toEqual({ job_enum: 1, log_enum: 1, old_job_enum: 1, old_log_enum: 1 });
  }, 120_000);
});
