import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_newsletter_subscribers_locale" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_newsletter_subscribers_status" AS ENUM('active', 'unsubscribed');
  CREATE TYPE "public"."enum_site_settings_careers_process_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star', 'medal', 'users-three');
  CREATE TABLE "newsletter_subscribers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"email" varchar NOT NULL,
  	"locale" "enum_newsletter_subscribers_locale" DEFAULT 'vi' NOT NULL,
  	"status" "enum_newsletter_subscribers_status" DEFAULT 'active' NOT NULL,
  	"consent_at" timestamp(3) with time zone,
  	"privacy_policy_version" varchar,
  	"source_path" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "news_views_daily" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"news_id" uuid NOT NULL,
  	"day" timestamp(3) with time zone NOT NULL,
  	"views" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_careers_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_site_settings_careers_process_icon" NOT NULL
  );
  
  CREATE TABLE "site_settings_careers_process_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_offices" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" uuid,
  	"location" geometry(Point),
  	"phone" varchar,
  	"email" varchar
  );
  
  CREATE TABLE "site_settings_offices_locales" (
  	"name" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "job_postings" ADD COLUMN "is_urgent" boolean DEFAULT false;
  ALTER TABLE "_job_postings_v" ADD COLUMN "version_is_urgent" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_subscribers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "news_views_daily_id" uuid;
  ALTER TABLE "site_settings_locales" ADD COLUMN "working_hours_hours" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "working_hours_days" varchar;
  -- SQL tuỳ biến (BL-054): Payload luôn sinh ON DELETE set null cho relationship, nhưng news_id NOT NULL nên xoá hẳn một tin có lượt xem sẽ lỗi. Lượt xem của tin đã xoá hẳn không còn ý nghĩa -> CASCADE. Snapshot .json giữ set null (mã Payload sinh) nên không gây drift; test integration news-views-newsletter khoá hành vi này.
  ALTER TABLE "news_views_daily" ADD CONSTRAINT "news_views_daily_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_careers_process" ADD CONSTRAINT "site_settings_careers_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_careers_process_locales" ADD CONSTRAINT "site_settings_careers_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_careers_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_offices" ADD CONSTRAINT "site_settings_offices_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_offices" ADD CONSTRAINT "site_settings_offices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_offices_locales" ADD CONSTRAINT "site_settings_offices_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_offices"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
  CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");
  CREATE INDEX "newsletter_subscribers_updated_at_idx" ON "newsletter_subscribers" USING btree ("updated_at");
  CREATE INDEX "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");
  CREATE INDEX "news_views_daily_news_idx" ON "news_views_daily" USING btree ("news_id");
  CREATE INDEX "news_views_daily_day_idx" ON "news_views_daily" USING btree ("day");
  CREATE INDEX "news_views_daily_updated_at_idx" ON "news_views_daily" USING btree ("updated_at");
  CREATE INDEX "news_views_daily_created_at_idx" ON "news_views_daily" USING btree ("created_at");
  CREATE UNIQUE INDEX "news_day_idx" ON "news_views_daily" USING btree ("news_id","day");
  CREATE INDEX "site_settings_careers_process_order_idx" ON "site_settings_careers_process" USING btree ("_order");
  CREATE INDEX "site_settings_careers_process_parent_id_idx" ON "site_settings_careers_process" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_careers_process_locales_locale_parent_id_uniqu" ON "site_settings_careers_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_careers_process_locales_parent_id_idx" ON "site_settings_careers_process_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_offices_order_idx" ON "site_settings_offices" USING btree ("_order");
  CREATE INDEX "site_settings_offices_parent_id_idx" ON "site_settings_offices" USING btree ("_parent_id");
  CREATE INDEX "site_settings_offices_image_idx" ON "site_settings_offices" USING btree ("image_id");
  CREATE UNIQUE INDEX "site_settings_offices_locales_locale_parent_id_unique" ON "site_settings_offices_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_offices_locales_parent_id_idx" ON "site_settings_offices_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk" FOREIGN KEY ("newsletter_subscribers_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_views_daily_fk" FOREIGN KEY ("news_views_daily_id") REFERENCES "public"."news_views_daily"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_newsletter_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_news_views_daily_id_idx" ON "payload_locked_documents_rels" USING btree ("news_views_daily_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // IF EXISTS để chạy lặp được: DROP TABLE ... CASCADE đã kéo theo các FK của bảng khác trỏ vào nó (payload_locked_documents_rels).
  // Chỉ gỡ đúng phần migration này thêm; dữ liệu cũ (job_postings, site_settings) giữ nguyên ngoài 3 cột mới.
  await db.execute(sql`
  DROP TABLE IF EXISTS "newsletter_subscribers" CASCADE;
  DROP TABLE IF EXISTS "news_views_daily" CASCADE;
  DROP TABLE IF EXISTS "site_settings_careers_process_locales" CASCADE;
  DROP TABLE IF EXISTS "site_settings_careers_process" CASCADE;
  DROP TABLE IF EXISTS "site_settings_offices_locales" CASCADE;
  DROP TABLE IF EXISTS "site_settings_offices" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_newsletter_subscribers_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_news_views_daily_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_newsletter_subscribers_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_news_views_daily_id_idx";
  ALTER TABLE "job_postings" DROP COLUMN IF EXISTS "is_urgent";
  ALTER TABLE "_job_postings_v" DROP COLUMN IF EXISTS "version_is_urgent";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "newsletter_subscribers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "news_views_daily_id";
  ALTER TABLE "site_settings_locales" DROP COLUMN IF EXISTS "working_hours_hours";
  ALTER TABLE "site_settings_locales" DROP COLUMN IF EXISTS "working_hours_days";
  DROP TYPE IF EXISTS "public"."enum_newsletter_subscribers_locale";
  DROP TYPE IF EXISTS "public"."enum_newsletter_subscribers_status";
  DROP TYPE IF EXISTS "public"."enum_site_settings_careers_process_icon";`)
}
