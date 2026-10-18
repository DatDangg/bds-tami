import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Chỉ thêm giá trị enum (additive): task `data-retention` của Payload Jobs và hành động audit `system.data_retention`.
// KHÔNG có backfill/xoá dữ liệu trong migration; việc ẩn danh/xoá do job chạy theo lô.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'data-retention';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'data-retention';
  ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE IF NOT EXISTS 'system.data_retention';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Dựng lại enum task slug bằng cast sẽ lỗi nếu còn dòng mang giá trị mới: xoá lịch sử job của task này trước (log trước, rồi job).
  -- KHÔNG đụng audit_logs: các dòng system.data_retention là vết của những lần xoá/ẩn danh dữ liệu không hoàn tác được nên phải còn sau rollback;
  -- enum audit_logs.action giữ nguyên giá trị đã thêm (Postgres không bỏ được giá trị enum, và giữ lại vô hại: code cũ chỉ hiển thị chuỗi).
  -- Chạy lại up sau đó vẫn đúng nhờ ADD VALUE IF NOT EXISTS.
  DELETE FROM "payload_jobs_log" WHERE "task_slug"::text = 'data-retention';
  DELETE FROM "payload_jobs" WHERE "task_slug"::text = 'data-retention';
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings', 'expire-offers', 'remind-unassigned-leads');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings', 'expire-offers', 'remind-unassigned-leads');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";`)
}
