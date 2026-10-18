import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'remind-unassigned-leads';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'remind-unassigned-leads';
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "reminded_at" timestamp(3) with time zone;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Dựng lại enum cũ bằng cast sẽ lỗi nếu còn dòng mang giá trị 'remind-unassigned-leads': xoá lịch sử job của task này trước (log trước, rồi job).
  DELETE FROM "payload_jobs_log" WHERE "task_slug"::text = 'remind-unassigned-leads';
  DELETE FROM "payload_jobs" WHERE "task_slug"::text = 'remind-unassigned-leads';
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings', 'expire-offers');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings', 'expire-offers');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "reminded_at";`)
}
