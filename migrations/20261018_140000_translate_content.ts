import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Chỉ thêm giá trị enum (additive): task `translate-content` của Payload Jobs. Không đổi bảng nội dung, không backfill.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'translate-content';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'translate-content';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Dựng lại enum task slug bằng cast sẽ lỗi nếu còn dòng mang giá trị mới: xoá lịch sử job của task này trước (log trước, rồi job).
  -- Chạy lại up sau đó vẫn đúng nhờ ADD VALUE IF NOT EXISTS.
  DELETE FROM "payload_jobs_log" WHERE "task_slug"::text = 'translate-content';
  DELETE FROM "payload_jobs" WHERE "task_slug"::text = 'translate-content';
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings', 'expire-offers', 'remind-unassigned-leads', 'data-retention');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings', 'expire-offers', 'remind-unassigned-leads', 'data-retention');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";`)
}
