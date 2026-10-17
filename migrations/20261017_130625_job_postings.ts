import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_job_postings_employment_type" AS ENUM('full_time', 'part_time', 'internship', 'contract');
  CREATE TYPE "public"."enum_job_postings_status" AS ENUM('draft', 'published', 'hidden');
  CREATE TYPE "public"."enum_job_postings_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_job_postings_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum__job_postings_v_version_employment_type" AS ENUM('full_time', 'part_time', 'internship', 'contract');
  CREATE TYPE "public"."enum__job_postings_v_version_status" AS ENUM('draft', 'published', 'hidden');
  CREATE TYPE "public"."enum__job_postings_v_version_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum__job_postings_v_version_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum_job_applications_locale" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_job_applications_status" AS ENUM('new', 'reviewing', 'interview', 'hired', 'rejected');
  CREATE TABLE "job_postings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category_id" uuid,
  	"province_id" uuid,
  	"workplace" varchar,
  	"employment_type" "enum_job_postings_employment_type" NOT NULL,
  	"salary_min_vnd" numeric,
  	"salary_max_vnd" numeric,
  	"quantity" numeric,
  	"deadline" timestamp(3) with time zone NOT NULL,
  	"status" "enum_job_postings_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid NOT NULL,
  	"has_english" boolean DEFAULT false,
  	"translation_status" "enum_job_postings_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_job_postings_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "job_postings_locales" (
  	"title" varchar,
  	"salary_text" varchar,
  	"description" jsonb,
  	"requirements" jsonb,
  	"benefits" jsonb,
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
  
  CREATE TABLE "_job_postings_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_category_id" uuid,
  	"version_province_id" uuid,
  	"version_workplace" varchar,
  	"version_employment_type" "enum__job_postings_v_version_employment_type" NOT NULL,
  	"version_salary_min_vnd" numeric,
  	"version_salary_max_vnd" numeric,
  	"version_quantity" numeric,
  	"version_deadline" timestamp(3) with time zone NOT NULL,
  	"version_status" "enum__job_postings_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid NOT NULL,
  	"version_has_english" boolean DEFAULT false,
  	"version_translation_status" "enum__job_postings_v_version_translation_status" DEFAULT 'none',
  	"version_translation_en_source" "enum__job_postings_v_version_translation_en_source",
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
  
  CREATE TABLE "_job_postings_v_locales" (
  	"version_title" varchar,
  	"version_salary_text" varchar,
  	"version_description" jsonb,
  	"version_requirements" jsonb,
  	"version_benefits" jsonb,
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
  
  CREATE TABLE "job_applications" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"job_posting_id" uuid NOT NULL,
  	"full_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"message" varchar,
  	"cv_id" uuid NOT NULL,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"consent_version" varchar NOT NULL,
  	"locale" "enum_job_applications_locale" NOT NULL,
  	"status" "enum_job_applications_status" DEFAULT 'new' NOT NULL,
  	"note" varchar,
  	"ip_hash" varchar,
  	"anonymized_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "job_postings_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "job_applications_id" uuid;
  ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_postings_locales" ADD CONSTRAINT "job_postings_locales_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_postings_locales" ADD CONSTRAINT "job_postings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_job_postings_v" ADD CONSTRAINT "_job_postings_v_parent_id_job_postings_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."job_postings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_job_postings_v" ADD CONSTRAINT "_job_postings_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_job_postings_v" ADD CONSTRAINT "_job_postings_v_version_province_id_provinces_id_fk" FOREIGN KEY ("version_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_job_postings_v" ADD CONSTRAINT "_job_postings_v_version_author_id_staff_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_job_postings_v_locales" ADD CONSTRAINT "_job_postings_v_locales_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_job_postings_v_locales" ADD CONSTRAINT "_job_postings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_job_postings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_cv_id_private_files_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."private_files"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "job_postings_category_idx" ON "job_postings" USING btree ("category_id");
  CREATE INDEX "job_postings_province_idx" ON "job_postings" USING btree ("province_id");
  CREATE INDEX "job_postings_deadline_idx" ON "job_postings" USING btree ("deadline");
  CREATE INDEX "job_postings_status_idx" ON "job_postings" USING btree ("status");
  CREATE INDEX "job_postings_published_at_idx" ON "job_postings" USING btree ("published_at");
  CREATE INDEX "job_postings_author_idx" ON "job_postings" USING btree ("author_id");
  CREATE INDEX "job_postings_has_english_idx" ON "job_postings" USING btree ("has_english");
  CREATE INDEX "job_postings_translation_translation_status_idx" ON "job_postings" USING btree ("translation_status");
  CREATE INDEX "job_postings_translation_translation_vi_changed_after_ma_idx" ON "job_postings" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "job_postings_updated_at_idx" ON "job_postings" USING btree ("updated_at");
  CREATE INDEX "job_postings_created_at_idx" ON "job_postings" USING btree ("created_at");
  CREATE INDEX "job_postings_deleted_at_idx" ON "job_postings" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "job_postings_slug_idx" ON "job_postings_locales" USING btree ("slug","_locale");
  CREATE INDEX "job_postings_seo_seo_og_image_idx" ON "job_postings_locales" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "job_postings_locales_locale_parent_id_unique" ON "job_postings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "job_postings_locales_parent_id_idx" ON "job_postings_locales" USING btree ("_parent_id");
  CREATE INDEX "_job_postings_v_parent_idx" ON "_job_postings_v" USING btree ("parent_id");
  CREATE INDEX "_job_postings_v_version_version_category_idx" ON "_job_postings_v" USING btree ("version_category_id");
  CREATE INDEX "_job_postings_v_version_version_province_idx" ON "_job_postings_v" USING btree ("version_province_id");
  CREATE INDEX "_job_postings_v_version_version_deadline_idx" ON "_job_postings_v" USING btree ("version_deadline");
  CREATE INDEX "_job_postings_v_version_version_status_idx" ON "_job_postings_v" USING btree ("version_status");
  CREATE INDEX "_job_postings_v_version_version_published_at_idx" ON "_job_postings_v" USING btree ("version_published_at");
  CREATE INDEX "_job_postings_v_version_version_author_idx" ON "_job_postings_v" USING btree ("version_author_id");
  CREATE INDEX "_job_postings_v_version_version_has_english_idx" ON "_job_postings_v" USING btree ("version_has_english");
  CREATE INDEX "_job_postings_v_version_translation_version_translation__idx" ON "_job_postings_v" USING btree ("version_translation_status");
  CREATE INDEX "_job_postings_v_version_translation_version_translatio_1_idx" ON "_job_postings_v" USING btree ("version_translation_vi_changed_after_manual");
  CREATE INDEX "_job_postings_v_version_version_updated_at_idx" ON "_job_postings_v" USING btree ("version_updated_at");
  CREATE INDEX "_job_postings_v_version_version_created_at_idx" ON "_job_postings_v" USING btree ("version_created_at");
  CREATE INDEX "_job_postings_v_version_version_deleted_at_idx" ON "_job_postings_v" USING btree ("version_deleted_at");
  CREATE INDEX "_job_postings_v_created_at_idx" ON "_job_postings_v" USING btree ("created_at");
  CREATE INDEX "_job_postings_v_updated_at_idx" ON "_job_postings_v" USING btree ("updated_at");
  CREATE INDEX "_job_postings_v_version_version_slug_idx" ON "_job_postings_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_job_postings_v_version_seo_version_seo_og_image_idx" ON "_job_postings_v_locales" USING btree ("version_seo_og_image_id");
  CREATE UNIQUE INDEX "_job_postings_v_locales_locale_parent_id_unique" ON "_job_postings_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_job_postings_v_locales_parent_id_idx" ON "_job_postings_v_locales" USING btree ("_parent_id");
  CREATE INDEX "job_applications_job_posting_idx" ON "job_applications" USING btree ("job_posting_id");
  CREATE INDEX "job_applications_cv_idx" ON "job_applications" USING btree ("cv_id");
  CREATE INDEX "job_applications_status_idx" ON "job_applications" USING btree ("status");
  CREATE INDEX "job_applications_updated_at_idx" ON "job_applications" USING btree ("updated_at");
  CREATE INDEX "job_applications_created_at_idx" ON "job_applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_postings_fk" FOREIGN KEY ("job_postings_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_applications_fk" FOREIGN KEY ("job_applications_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_job_postings_id_idx" ON "payload_locked_documents_rels" USING btree ("job_postings_id");
  CREATE INDEX "payload_locked_documents_rels_job_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("job_applications_id");

  -- SQL tuỳ biến (ERD §5): index danh sách tuyển dụng công khai (đã xuất bản, theo ngôn ngữ, còn hạn). Payload không đặt được thứ tự index tổng hợp, và không nằm trong snapshot .json nên không gây drift. Additive; bị DROP cùng bảng ở down.
  CREATE INDEX "job_postings_list_idx" ON "job_postings" USING btree ("status", "has_english", "deadline");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "job_postings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "job_postings_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_job_postings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_job_postings_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "job_applications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "job_postings" CASCADE;
  DROP TABLE "job_postings_locales" CASCADE;
  DROP TABLE "_job_postings_v" CASCADE;
  DROP TABLE "_job_postings_v_locales" CASCADE;
  DROP TABLE "job_applications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_job_postings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_job_applications_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_job_postings_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_job_applications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "job_postings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "job_applications_id";
  DROP TYPE "public"."enum_job_postings_employment_type";
  DROP TYPE "public"."enum_job_postings_status";
  DROP TYPE "public"."enum_job_postings_translation_status";
  DROP TYPE "public"."enum_job_postings_translation_en_source";
  DROP TYPE "public"."enum__job_postings_v_version_employment_type";
  DROP TYPE "public"."enum__job_postings_v_version_status";
  DROP TYPE "public"."enum__job_postings_v_version_translation_status";
  DROP TYPE "public"."enum__job_postings_v_version_translation_en_source";
  DROP TYPE "public"."enum_job_applications_locale";
  DROP TYPE "public"."enum_job_applications_status";`)
}
