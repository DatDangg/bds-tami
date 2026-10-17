import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_click_events_type" AS ENUM('hotline', 'zalo', 'fanpage');
  CREATE TYPE "public"."enum_click_stats_daily_type" AS ENUM('hotline', 'zalo', 'fanpage');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'aggregate-click-stats';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'aggregate-click-stats';
  CREATE TABLE "click_events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"type" "enum_click_events_type" NOT NULL,
  	"page_path" varchar NOT NULL,
  	"ref_collection" varchar,
  	"ref_id" varchar,
  	"aggregated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "click_stats_daily" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"type" "enum_click_stats_daily_type" NOT NULL,
  	"ref_collection" varchar DEFAULT '',
  	"ref_id" varchar DEFAULT '',
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "click_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "click_stats_daily_id" uuid;
  CREATE INDEX "click_events_type_idx" ON "click_events" USING btree ("type");
  CREATE INDEX "click_events_aggregated_at_idx" ON "click_events" USING btree ("aggregated_at");
  CREATE INDEX "click_events_updated_at_idx" ON "click_events" USING btree ("updated_at");
  CREATE INDEX "click_events_created_at_idx" ON "click_events" USING btree ("created_at");
  CREATE INDEX "click_stats_daily_date_idx" ON "click_stats_daily" USING btree ("date");
  CREATE INDEX "click_stats_daily_updated_at_idx" ON "click_stats_daily" USING btree ("updated_at");
  CREATE INDEX "click_stats_daily_created_at_idx" ON "click_stats_daily" USING btree ("created_at");
  CREATE UNIQUE INDEX "date_type_refCollection_refId_idx" ON "click_stats_daily" USING btree ("date","type","ref_collection","ref_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_click_events_fk" FOREIGN KEY ("click_events_id") REFERENCES "public"."click_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_click_stats_daily_fk" FOREIGN KEY ("click_stats_daily_id") REFERENCES "public"."click_stats_daily"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_click_events_id_idx" ON "payload_locked_documents_rels" USING btree ("click_events_id");
  CREATE INDEX "payload_locked_documents_rels_click_stats_daily_id_idx" ON "payload_locked_documents_rels" USING btree ("click_stats_daily_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "click_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "click_stats_daily" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "click_events" CASCADE;
  DROP TABLE "click_stats_daily" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_click_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_click_stats_daily_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'send-notification-email');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'send-notification-email');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_click_events_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_click_stats_daily_id_idx";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "click_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "click_stats_daily_id";
  DROP TYPE "public"."enum_click_events_type";
  DROP TYPE "public"."enum_click_stats_daily_type";`)
}
