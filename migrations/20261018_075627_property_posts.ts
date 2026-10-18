import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_property_posts_status" AS ENUM('draft', 'published', 'hidden');
  CREATE TYPE "public"."enum_property_posts_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_property_posts_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum__property_posts_v_version_status" AS ENUM('draft', 'published', 'hidden');
  CREATE TYPE "public"."enum__property_posts_v_version_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum__property_posts_v_version_translation_en_source" AS ENUM('ai', 'manual');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'expire-offers';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'expire-offers';
  CREATE TABLE "property_posts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category_id" uuid,
  	"cover_id" uuid,
  	"price_vnd" numeric,
  	"province_id" uuid,
  	"ward_id" uuid,
  	"related_project_id" uuid,
  	"related_rental_id" uuid,
  	"offer_start_at" timestamp(3) with time zone,
  	"offer_end_at" timestamp(3) with time zone,
  	"offer_voucher_code" varchar,
  	"status" "enum_property_posts_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid NOT NULL,
  	"is_featured" boolean DEFAULT false,
  	"has_english" boolean DEFAULT false,
  	"translation_status" "enum_property_posts_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_property_posts_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "property_posts_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"price_note" varchar,
  	"offer_terms" varchar,
  	"slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" uuid,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_canonical" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "property_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE "_property_posts_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_category_id" uuid,
  	"version_cover_id" uuid,
  	"version_price_vnd" numeric,
  	"version_province_id" uuid,
  	"version_ward_id" uuid,
  	"version_related_project_id" uuid,
  	"version_related_rental_id" uuid,
  	"version_offer_start_at" timestamp(3) with time zone,
  	"version_offer_end_at" timestamp(3) with time zone,
  	"version_offer_voucher_code" varchar,
  	"version_status" "enum__property_posts_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid NOT NULL,
  	"version_is_featured" boolean DEFAULT false,
  	"version_has_english" boolean DEFAULT false,
  	"version_translation_status" "enum__property_posts_v_version_translation_status" DEFAULT 'none',
  	"version_translation_en_source" "enum__property_posts_v_version_translation_en_source",
  	"version_translation_vi_changed_after_manual" boolean DEFAULT false,
  	"version_translation_source_hash" jsonb,
  	"version_translation_translated_at" timestamp(3) with time zone,
  	"version_translation_model" varchar,
  	"version_translation_last_error" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_property_posts_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_price_note" varchar,
  	"version_offer_terms" varchar,
  	"version_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" uuid,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_canonical" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_property_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "property_posts_id" uuid;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_related_rental_id_rentals_id_fk" FOREIGN KEY ("related_rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts" ADD CONSTRAINT "property_posts_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts_locales" ADD CONSTRAINT "property_posts_locales_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_posts_locales" ADD CONSTRAINT "property_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."property_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "property_posts_rels" ADD CONSTRAINT "property_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."property_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "property_posts_rels" ADD CONSTRAINT "property_posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_parent_id_property_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."property_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_province_id_provinces_id_fk" FOREIGN KEY ("version_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_ward_id_wards_id_fk" FOREIGN KEY ("version_ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_related_project_id_projects_id_fk" FOREIGN KEY ("version_related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_related_rental_id_rentals_id_fk" FOREIGN KEY ("version_related_rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v" ADD CONSTRAINT "_property_posts_v_version_author_id_staff_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v_locales" ADD CONSTRAINT "_property_posts_v_locales_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_property_posts_v_locales" ADD CONSTRAINT "_property_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_property_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_property_posts_v_rels" ADD CONSTRAINT "_property_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_property_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_property_posts_v_rels" ADD CONSTRAINT "_property_posts_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "property_posts_category_idx" ON "property_posts" USING btree ("category_id");
  CREATE INDEX "property_posts_cover_idx" ON "property_posts" USING btree ("cover_id");
  CREATE INDEX "property_posts_province_idx" ON "property_posts" USING btree ("province_id");
  CREATE INDEX "property_posts_ward_idx" ON "property_posts" USING btree ("ward_id");
  CREATE INDEX "property_posts_related_project_idx" ON "property_posts" USING btree ("related_project_id");
  CREATE INDEX "property_posts_related_rental_idx" ON "property_posts" USING btree ("related_rental_id");
  CREATE INDEX "property_posts_offer_offer_end_at_idx" ON "property_posts" USING btree ("offer_end_at");
  CREATE INDEX "property_posts_status_idx" ON "property_posts" USING btree ("status");
  CREATE INDEX "property_posts_published_at_idx" ON "property_posts" USING btree ("published_at");
  CREATE INDEX "property_posts_author_idx" ON "property_posts" USING btree ("author_id");
  CREATE INDEX "property_posts_is_featured_idx" ON "property_posts" USING btree ("is_featured");
  CREATE INDEX "property_posts_has_english_idx" ON "property_posts" USING btree ("has_english");
  CREATE INDEX "property_posts_translation_translation_status_idx" ON "property_posts" USING btree ("translation_status");
  CREATE INDEX "property_posts_translation_translation_vi_changed_after__idx" ON "property_posts" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "property_posts_updated_at_idx" ON "property_posts" USING btree ("updated_at");
  CREATE INDEX "property_posts_created_at_idx" ON "property_posts" USING btree ("created_at");
  CREATE INDEX "property_posts_deleted_at_idx" ON "property_posts" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "property_posts_slug_idx" ON "property_posts_locales" USING btree ("slug","_locale");
  CREATE INDEX "property_posts_seo_seo_og_image_idx" ON "property_posts_locales" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "property_posts_locales_locale_parent_id_unique" ON "property_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "property_posts_locales_parent_id_idx" ON "property_posts_locales" USING btree ("_parent_id");
  CREATE INDEX "property_posts_rels_order_idx" ON "property_posts_rels" USING btree ("order");
  CREATE INDEX "property_posts_rels_parent_idx" ON "property_posts_rels" USING btree ("parent_id");
  CREATE INDEX "property_posts_rels_path_idx" ON "property_posts_rels" USING btree ("path");
  CREATE INDEX "property_posts_rels_media_id_idx" ON "property_posts_rels" USING btree ("media_id");
  CREATE INDEX "_property_posts_v_parent_idx" ON "_property_posts_v" USING btree ("parent_id");
  CREATE INDEX "_property_posts_v_version_version_category_idx" ON "_property_posts_v" USING btree ("version_category_id");
  CREATE INDEX "_property_posts_v_version_version_cover_idx" ON "_property_posts_v" USING btree ("version_cover_id");
  CREATE INDEX "_property_posts_v_version_version_province_idx" ON "_property_posts_v" USING btree ("version_province_id");
  CREATE INDEX "_property_posts_v_version_version_ward_idx" ON "_property_posts_v" USING btree ("version_ward_id");
  CREATE INDEX "_property_posts_v_version_version_related_project_idx" ON "_property_posts_v" USING btree ("version_related_project_id");
  CREATE INDEX "_property_posts_v_version_version_related_rental_idx" ON "_property_posts_v" USING btree ("version_related_rental_id");
  CREATE INDEX "_property_posts_v_version_offer_version_offer_end_at_idx" ON "_property_posts_v" USING btree ("version_offer_end_at");
  CREATE INDEX "_property_posts_v_version_version_status_idx" ON "_property_posts_v" USING btree ("version_status");
  CREATE INDEX "_property_posts_v_version_version_published_at_idx" ON "_property_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_property_posts_v_version_version_author_idx" ON "_property_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_property_posts_v_version_version_is_featured_idx" ON "_property_posts_v" USING btree ("version_is_featured");
  CREATE INDEX "_property_posts_v_version_version_has_english_idx" ON "_property_posts_v" USING btree ("version_has_english");
  CREATE INDEX "_property_posts_v_version_translation_version_translatio_idx" ON "_property_posts_v" USING btree ("version_translation_status");
  CREATE INDEX "_property_posts_v_version_translation_version_translat_1_idx" ON "_property_posts_v" USING btree ("version_translation_vi_changed_after_manual");
  CREATE INDEX "_property_posts_v_version_version_updated_at_idx" ON "_property_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_property_posts_v_version_version_created_at_idx" ON "_property_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_property_posts_v_version_version_deleted_at_idx" ON "_property_posts_v" USING btree ("version_deleted_at");
  CREATE INDEX "_property_posts_v_created_at_idx" ON "_property_posts_v" USING btree ("created_at");
  CREATE INDEX "_property_posts_v_updated_at_idx" ON "_property_posts_v" USING btree ("updated_at");
  CREATE INDEX "_property_posts_v_version_version_slug_idx" ON "_property_posts_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_property_posts_v_version_seo_version_seo_og_image_idx" ON "_property_posts_v_locales" USING btree ("version_seo_og_image_id");
  CREATE UNIQUE INDEX "_property_posts_v_locales_locale_parent_id_unique" ON "_property_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_property_posts_v_locales_parent_id_idx" ON "_property_posts_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_property_posts_v_rels_order_idx" ON "_property_posts_v_rels" USING btree ("order");
  CREATE INDEX "_property_posts_v_rels_parent_idx" ON "_property_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_property_posts_v_rels_path_idx" ON "_property_posts_v_rels" USING btree ("path");
  CREATE INDEX "_property_posts_v_rels_media_id_idx" ON "_property_posts_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_property_posts_fk" FOREIGN KEY ("property_posts_id") REFERENCES "public"."property_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_property_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("property_posts_id");

  -- SQL tuỳ biến (ERD §5): index tổng hợp phục vụ danh sách công khai và khối "Ưu đãi nổi bật". Tên có tiền tố bảng; additive, không nằm trong snapshot .json nên không gây drift.
  CREATE INDEX "property_posts_list_idx" ON "property_posts" USING btree ("status", "has_english", "category_id", "published_at" DESC);
  CREATE INDEX "property_posts_featured_offer_idx" ON "property_posts" USING btree ("status", "is_featured", "offer_end_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "property_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "property_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "property_posts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_property_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_property_posts_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_property_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "property_posts" CASCADE;
  DROP TABLE "property_posts_locales" CASCADE;
  DROP TABLE "property_posts_rels" CASCADE;
  DROP TABLE "_property_posts_v" CASCADE;
  DROP TABLE "_property_posts_v_locales" CASCADE;
  DROP TABLE "_property_posts_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_property_posts_fk";

  -- Dựng lại enum cũ bằng cast sẽ lỗi nếu còn dòng mang giá trị 'expire-offers': xoá lịch sử job của task này trước (log trước, rồi job).
  DELETE FROM "payload_jobs_log" WHERE "task_slug"::text = 'expire-offers';
  DELETE FROM "payload_jobs" WHERE "task_slug"::text = 'expire-offers';
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'send-notification-email', 'aggregate-click-stats', 'close-job-postings');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_property_posts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "property_posts_id";
  DROP TYPE "public"."enum_property_posts_status";
  DROP TYPE "public"."enum_property_posts_translation_status";
  DROP TYPE "public"."enum_property_posts_translation_en_source";
  DROP TYPE "public"."enum__property_posts_v_version_status";
  DROP TYPE "public"."enum__property_posts_v_version_translation_status";
  DROP TYPE "public"."enum__property_posts_v_version_translation_en_source";`)
}
