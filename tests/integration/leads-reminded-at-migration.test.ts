import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const MIGRATION_NAME = "20261018_113101_leads_reminded_at";

/** Chạy thật `up` -> `down` (còn job/log 'remind-unassigned-leads') -> `down` lần hai (IF EXISTS) -> `up` (mẫu `property-posts-migration.test.ts`). */
describe.skipIf(!baseUrl)("integration: migration leads_reminded_at up/down/up (DB tạm)", () => {
  const dbName = `tami_remind_mig_${Date.now().toString(36)}`;
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

  it("down chạy được kể cả khi còn job/log của task, down lần hai (IF EXISTS) êm, rồi up chạy lại được", async () => {
    const { migrations } = await import("../../migrations");
    const { createLocalReq } = await import("payload");
    const migration = migrations.find((item) => item.name === MIGRATION_NAME);
    expect(migration).toBeDefined();
    const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
    const req = await createLocalReq({}, payload);
    const args = { db: payload.db.drizzle, payload, req } as never;
    const state = () =>
      db
        .execute(
          sql`SELECT
            (SELECT count(*)::int FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'reminded_at') AS column_count,
            (SELECT count(*)::int FROM pg_enum e JOIN pg_type y ON y.oid = e.enumtypid WHERE y.typname = 'enum_payload_jobs_task_slug' AND e.enumlabel = 'remind-unassigned-leads') AS job_enum,
            (SELECT count(*)::int FROM pg_enum e JOIN pg_type y ON y.oid = e.enumtypid WHERE y.typname = 'enum_payload_jobs_log_task_slug' AND e.enumlabel = 'remind-unassigned-leads') AS log_enum`,
        )
        .then((result) => result.rows[0]);

    expect(await state()).toEqual({ column_count: 1, job_enum: 1, log_enum: 1 });

    await db.execute(sql`INSERT INTO "payload_jobs" ("task_slug", "queue") VALUES ('remind-unassigned-leads', 'default')`);
    // Log của task nằm dưới một job KHÁC (không bị FK cascade khi xoá job của task): chỉ câu DELETE log của `down` gỡ được.
    await db.execute(sql`INSERT INTO "payload_jobs" ("id", "task_slug", "queue") VALUES ('00000000-0000-4000-8000-000000000002', 'send-notification-email', 'default')`);
    await db.execute(sql`INSERT INTO "payload_jobs_log" ("_order", "_parent_id", "id", "executed_at", "completed_at", "task_slug", "task_i_d", "state") VALUES (1, '00000000-0000-4000-8000-000000000002', 'log-remind', now(), now(), 'remind-unassigned-leads', '1', 'succeeded')`);

    await migration!.down(args);
    expect(await state()).toEqual({ column_count: 0, job_enum: 0, log_enum: 0 });
    const remaining = await db.execute(sql`SELECT (SELECT count(*)::int FROM "payload_jobs" WHERE "task_slug"::text = 'remind-unassigned-leads') AS jobs, (SELECT count(*)::int FROM "payload_jobs_log" WHERE "id" = 'log-remind') AS logs`);
    expect(remaining.rows[0]).toEqual({ jobs: 0, logs: 0 });

    await migration!.down(args);
    expect(await state()).toEqual({ column_count: 0, job_enum: 0, log_enum: 0 });

    await migration!.up(args);
    expect(await state()).toEqual({ column_count: 1, job_enum: 1, log_enum: 1 });
  }, 120_000);
});
