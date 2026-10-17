import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Cột location là geometry(Point): cần PostGIS (docker/postgres/init.sql đã bật ở DB dev; IF NOT EXISTS để DB khác tự đủ).
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE TYPE "public"."enum_projects_sales_status" AS ENUM('upcoming', 'selling', 'handed_over');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published', 'hidden');
  CREATE TYPE "public"."enum_projects_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_projects_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum__projects_v_version_sales_status" AS ENUM('upcoming', 'selling', 'handed_over');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published', 'hidden');
  CREATE TYPE "public"."enum__projects_v_version_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum__projects_v_version_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TABLE "projects_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "projects_amenities_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_floor_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" uuid NOT NULL
  );
  
  CREATE TABLE "projects_floor_plans_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category_id" uuid,
  	"developer_id" uuid,
  	"sales_status" "enum_projects_sales_status" NOT NULL,
  	"province_id" uuid NOT NULL,
  	"ward_id" uuid,
  	"address" varchar,
  	"location" geometry(Point),
  	"price_from_vnd" numeric,
  	"price_to_vnd" numeric,
  	"area_from_m2" numeric,
  	"area_to_m2" numeric,
  	"scale_total_units" numeric,
  	"scale_blocks" numeric,
  	"scale_floors" numeric,
  	"scale_land_area_m2" numeric,
  	"status" "enum_projects_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid NOT NULL,
  	"is_featured" boolean DEFAULT false,
  	"has_english" boolean DEFAULT false,
  	"translation_status" "enum_projects_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_projects_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar,
  	"scale_handover_time" varchar,
  	"summary" varchar,
  	"overview" jsonb,
  	"legal_info" jsonb,
  	"sales_policy" jsonb,
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
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE "_projects_v_version_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"icon" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_amenities_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_floor_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"image_id" uuid NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_floor_plans_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_projects_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_category_id" uuid,
  	"version_developer_id" uuid,
  	"version_sales_status" "enum__projects_v_version_sales_status" NOT NULL,
  	"version_province_id" uuid NOT NULL,
  	"version_ward_id" uuid,
  	"version_address" varchar,
  	"version_location" geometry(Point),
  	"version_price_from_vnd" numeric,
  	"version_price_to_vnd" numeric,
  	"version_area_from_m2" numeric,
  	"version_area_to_m2" numeric,
  	"version_scale_total_units" numeric,
  	"version_scale_blocks" numeric,
  	"version_scale_floors" numeric,
  	"version_scale_land_area_m2" numeric,
  	"version_status" "enum__projects_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid NOT NULL,
  	"version_is_featured" boolean DEFAULT false,
  	"version_has_english" boolean DEFAULT false,
  	"version_translation_status" "enum__projects_v_version_translation_status" DEFAULT 'none',
  	"version_translation_en_source" "enum__projects_v_version_translation_en_source",
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
  
  CREATE TABLE "_projects_v_locales" (
  	"version_title" varchar,
  	"version_scale_handover_time" varchar,
  	"version_summary" varchar,
  	"version_overview" jsonb,
  	"version_legal_info" jsonb,
  	"version_sales_policy" jsonb,
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
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" uuid;
  ALTER TABLE "projects_amenities" ADD CONSTRAINT "projects_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_amenities_locales" ADD CONSTRAINT "projects_amenities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_amenities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_floor_plans" ADD CONSTRAINT "projects_floor_plans_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_floor_plans" ADD CONSTRAINT "projects_floor_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_floor_plans_locales" ADD CONSTRAINT "projects_floor_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_floor_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_amenities" ADD CONSTRAINT "_projects_v_version_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_amenities_locales" ADD CONSTRAINT "_projects_v_version_amenities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_amenities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_floor_plans" ADD CONSTRAINT "_projects_v_version_floor_plans_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_floor_plans" ADD CONSTRAINT "_projects_v_version_floor_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_floor_plans_locales" ADD CONSTRAINT "_projects_v_version_floor_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_floor_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_developer_id_developers_id_fk" FOREIGN KEY ("version_developer_id") REFERENCES "public"."developers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_province_id_provinces_id_fk" FOREIGN KEY ("version_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_ward_id_wards_id_fk" FOREIGN KEY ("version_ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_author_id_staff_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_amenities_order_idx" ON "projects_amenities" USING btree ("_order");
  CREATE INDEX "projects_amenities_parent_id_idx" ON "projects_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_amenities_locales_locale_parent_id_unique" ON "projects_amenities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_amenities_locales_parent_id_idx" ON "projects_amenities_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_floor_plans_order_idx" ON "projects_floor_plans" USING btree ("_order");
  CREATE INDEX "projects_floor_plans_parent_id_idx" ON "projects_floor_plans" USING btree ("_parent_id");
  CREATE INDEX "projects_floor_plans_image_idx" ON "projects_floor_plans" USING btree ("image_id");
  CREATE UNIQUE INDEX "projects_floor_plans_locales_locale_parent_id_unique" ON "projects_floor_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_floor_plans_locales_parent_id_idx" ON "projects_floor_plans_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");
  CREATE INDEX "projects_developer_idx" ON "projects" USING btree ("developer_id");
  CREATE INDEX "projects_sales_status_idx" ON "projects" USING btree ("sales_status");
  CREATE INDEX "projects_province_idx" ON "projects" USING btree ("province_id");
  CREATE INDEX "projects_ward_idx" ON "projects" USING btree ("ward_id");
  CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");
  CREATE INDEX "projects_published_at_idx" ON "projects" USING btree ("published_at");
  CREATE INDEX "projects_author_idx" ON "projects" USING btree ("author_id");
  CREATE INDEX "projects_is_featured_idx" ON "projects" USING btree ("is_featured");
  CREATE INDEX "projects_has_english_idx" ON "projects" USING btree ("has_english");
  CREATE INDEX "projects_translation_translation_status_idx" ON "projects" USING btree ("translation_status");
  CREATE INDEX "projects_translation_translation_vi_changed_after_manual_idx" ON "projects" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects_deleted_at_idx" ON "projects" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects_locales" USING btree ("slug","_locale");
  CREATE INDEX "projects_seo_seo_og_image_idx" ON "projects_locales" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_locales_parent_id_idx" ON "projects_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_media_id_idx" ON "projects_rels" USING btree ("media_id");
  CREATE INDEX "_projects_v_version_amenities_order_idx" ON "_projects_v_version_amenities" USING btree ("_order");
  CREATE INDEX "_projects_v_version_amenities_parent_id_idx" ON "_projects_v_version_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_amenities_locales_locale_parent_id_uniqu" ON "_projects_v_version_amenities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_amenities_locales_parent_id_idx" ON "_projects_v_version_amenities_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_floor_plans_order_idx" ON "_projects_v_version_floor_plans" USING btree ("_order");
  CREATE INDEX "_projects_v_version_floor_plans_parent_id_idx" ON "_projects_v_version_floor_plans" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_floor_plans_image_idx" ON "_projects_v_version_floor_plans" USING btree ("image_id");
  CREATE UNIQUE INDEX "_projects_v_version_floor_plans_locales_locale_parent_id_uni" ON "_projects_v_version_floor_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_floor_plans_locales_parent_id_idx" ON "_projects_v_version_floor_plans_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_category_idx" ON "_projects_v" USING btree ("version_category_id");
  CREATE INDEX "_projects_v_version_version_developer_idx" ON "_projects_v" USING btree ("version_developer_id");
  CREATE INDEX "_projects_v_version_version_sales_status_idx" ON "_projects_v" USING btree ("version_sales_status");
  CREATE INDEX "_projects_v_version_version_province_idx" ON "_projects_v" USING btree ("version_province_id");
  CREATE INDEX "_projects_v_version_version_ward_idx" ON "_projects_v" USING btree ("version_ward_id");
  CREATE INDEX "_projects_v_version_version_status_idx" ON "_projects_v" USING btree ("version_status");
  CREATE INDEX "_projects_v_version_version_published_at_idx" ON "_projects_v" USING btree ("version_published_at");
  CREATE INDEX "_projects_v_version_version_author_idx" ON "_projects_v" USING btree ("version_author_id");
  CREATE INDEX "_projects_v_version_version_is_featured_idx" ON "_projects_v" USING btree ("version_is_featured");
  CREATE INDEX "_projects_v_version_version_has_english_idx" ON "_projects_v" USING btree ("version_has_english");
  CREATE INDEX "_projects_v_version_translation_version_translation_stat_idx" ON "_projects_v" USING btree ("version_translation_status");
  CREATE INDEX "_projects_v_version_translation_version_translation_vi_c_idx" ON "_projects_v" USING btree ("version_translation_vi_changed_after_manual");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version_deleted_at_idx" ON "_projects_v" USING btree ("version_deleted_at");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_projects_v_version_seo_version_seo_og_image_idx" ON "_projects_v_locales" USING btree ("version_seo_og_image_id");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_locales_parent_id_idx" ON "_projects_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_media_id_idx" ON "_projects_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");

  -- SQL tuỳ biến (ERD §5): Payload chỉ sinh btree cho point và không đặt được tên/thứ tự index tổng hợp như ý. Additive, không nằm trong snapshot .json nên không gây drift.
  CREATE INDEX "projects_location_gist_idx" ON "projects" USING gist ("location");
  CREATE INDEX "projects_list_idx" ON "projects" USING btree ("status", "has_english", "sales_status", "province_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_amenities_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_floor_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_floor_plans_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_amenities_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_floor_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_floor_plans_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_amenities" CASCADE;
  DROP TABLE "projects_amenities_locales" CASCADE;
  DROP TABLE "projects_floor_plans" CASCADE;
  DROP TABLE "projects_floor_plans_locales" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_amenities" CASCADE;
  DROP TABLE "_projects_v_version_amenities_locales" CASCADE;
  DROP TABLE "_projects_v_version_floor_plans" CASCADE;
  DROP TABLE "_projects_v_version_floor_plans_locales" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_locales" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
  
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_projects_sales_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_projects_translation_status";
  DROP TYPE "public"."enum_projects_translation_en_source";
  DROP TYPE "public"."enum__projects_v_version_sales_status";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum__projects_v_version_translation_status";
  DROP TYPE "public"."enum__projects_v_version_translation_en_source";`)
}
