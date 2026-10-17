import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Cột location là geometry(Point): cần PostGIS (migration projects đã bật; IF NOT EXISTS để migration tự đủ trên DB khác).
  CREATE EXTENSION IF NOT EXISTS postgis;
  -- Mã tin CT-000001 (ERD §1, §4.6): hook assignRentalCode lấy nextval trong transaction lưu tin; nextval an toàn khi tạo song song.
  CREATE SEQUENCE IF NOT EXISTS "rentals_code_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE;
   CREATE TYPE "public"."enum_rentals_rental_terms_included_services" AS ENUM('electricity', 'water', 'internet', 'cleaning', 'laundry', 'parking', 'management_fee', 'security');
  CREATE TYPE "public"."enum_rentals_house_direction" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
  CREATE TYPE "public"."enum_rentals_balcony_direction" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
  CREATE TYPE "public"."enum_rentals_furnishing" AS ENUM('none', 'basic', 'full');
  CREATE TYPE "public"."enum_rentals_rental_terms_payment_cycle" AS ENUM('monthly', 'quarterly', 'semiannual', 'annual');
  CREATE TYPE "public"."enum_rentals_status" AS ENUM('draft', 'published', 'hidden', 'rented');
  CREATE TYPE "public"."enum_rentals_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_rentals_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum__rentals_v_version_rental_terms_included_services" AS ENUM('electricity', 'water', 'internet', 'cleaning', 'laundry', 'parking', 'management_fee', 'security');
  CREATE TYPE "public"."enum__rentals_v_version_house_direction" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
  CREATE TYPE "public"."enum__rentals_v_version_balcony_direction" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
  CREATE TYPE "public"."enum__rentals_v_version_furnishing" AS ENUM('none', 'basic', 'full');
  CREATE TYPE "public"."enum__rentals_v_version_rental_terms_payment_cycle" AS ENUM('monthly', 'quarterly', 'semiannual', 'annual');
  CREATE TYPE "public"."enum__rentals_v_version_status" AS ENUM('draft', 'published', 'hidden', 'rented');
  CREATE TYPE "public"."enum__rentals_v_version_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum__rentals_v_version_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TABLE "rentals_rental_terms_included_services" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_rentals_rental_terms_included_services",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "rentals" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"category_id" uuid,
  	"project_id" uuid,
  	"province_id" uuid NOT NULL,
  	"ward_id" uuid NOT NULL,
  	"address" varchar NOT NULL,
  	"show_exact_address" boolean DEFAULT false,
  	"location" geometry(Point),
  	"price_monthly_vnd" numeric,
  	"price_negotiable" boolean DEFAULT false,
  	"area_m2" numeric NOT NULL,
  	"bedrooms" numeric,
  	"bathrooms" numeric,
  	"floor" varchar,
  	"house_direction" "enum_rentals_house_direction",
  	"balcony_direction" "enum_rentals_balcony_direction",
  	"furnishing" "enum_rentals_furnishing",
  	"rental_terms_min_lease_months" numeric,
  	"rental_terms_deposit_months" numeric,
  	"rental_terms_payment_cycle" "enum_rentals_rental_terms_payment_cycle",
  	"rental_terms_available_from" timestamp(3) with time zone,
  	"video_url" varchar,
  	"rented_at" timestamp(3) with time zone,
  	"status" "enum_rentals_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid NOT NULL,
  	"is_featured" boolean DEFAULT false,
  	"has_english" boolean DEFAULT false,
  	"translation_status" "enum_rentals_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_rentals_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "rentals_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"legal_note" varchar,
  	"search_text" varchar,
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
  
  CREATE TABLE "rentals_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE "_rentals_v_version_rental_terms_included_services" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__rentals_v_version_rental_terms_included_services",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_rentals_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_code" varchar NOT NULL,
  	"version_category_id" uuid,
  	"version_project_id" uuid,
  	"version_province_id" uuid NOT NULL,
  	"version_ward_id" uuid NOT NULL,
  	"version_address" varchar NOT NULL,
  	"version_show_exact_address" boolean DEFAULT false,
  	"version_location" geometry(Point),
  	"version_price_monthly_vnd" numeric,
  	"version_price_negotiable" boolean DEFAULT false,
  	"version_area_m2" numeric NOT NULL,
  	"version_bedrooms" numeric,
  	"version_bathrooms" numeric,
  	"version_floor" varchar,
  	"version_house_direction" "enum__rentals_v_version_house_direction",
  	"version_balcony_direction" "enum__rentals_v_version_balcony_direction",
  	"version_furnishing" "enum__rentals_v_version_furnishing",
  	"version_rental_terms_min_lease_months" numeric,
  	"version_rental_terms_deposit_months" numeric,
  	"version_rental_terms_payment_cycle" "enum__rentals_v_version_rental_terms_payment_cycle",
  	"version_rental_terms_available_from" timestamp(3) with time zone,
  	"version_video_url" varchar,
  	"version_rented_at" timestamp(3) with time zone,
  	"version_status" "enum__rentals_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid NOT NULL,
  	"version_is_featured" boolean DEFAULT false,
  	"version_has_english" boolean DEFAULT false,
  	"version_translation_status" "enum__rentals_v_version_translation_status" DEFAULT 'none',
  	"version_translation_en_source" "enum__rentals_v_version_translation_en_source",
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
  
  CREATE TABLE "_rentals_v_locales" (
  	"version_title" varchar,
  	"version_description" jsonb,
  	"version_legal_note" varchar,
  	"version_search_text" varchar,
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
  
  CREATE TABLE "_rentals_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rentals_id" uuid;
  ALTER TABLE "rentals_rental_terms_included_services" ADD CONSTRAINT "rentals_rental_terms_included_services_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rentals" ADD CONSTRAINT "rentals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rentals" ADD CONSTRAINT "rentals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rentals" ADD CONSTRAINT "rentals_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rentals" ADD CONSTRAINT "rentals_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rentals" ADD CONSTRAINT "rentals_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rentals_locales" ADD CONSTRAINT "rentals_locales_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rentals_locales" ADD CONSTRAINT "rentals_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rentals_rels" ADD CONSTRAINT "rentals_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rentals_rels" ADD CONSTRAINT "rentals_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rentals_v_version_rental_terms_included_services" ADD CONSTRAINT "_rentals_v_version_rental_terms_included_services_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_rentals_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rentals_v" ADD CONSTRAINT "_rentals_v_parent_id_rentals_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v" ADD CONSTRAINT "_rentals_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v" ADD CONSTRAINT "_rentals_v_version_project_id_projects_id_fk" FOREIGN KEY ("version_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v" ADD CONSTRAINT "_rentals_v_version_province_id_provinces_id_fk" FOREIGN KEY ("version_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v" ADD CONSTRAINT "_rentals_v_version_ward_id_wards_id_fk" FOREIGN KEY ("version_ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v" ADD CONSTRAINT "_rentals_v_version_author_id_staff_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v_locales" ADD CONSTRAINT "_rentals_v_locales_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rentals_v_locales" ADD CONSTRAINT "_rentals_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rentals_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rentals_v_rels" ADD CONSTRAINT "_rentals_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_rentals_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rentals_v_rels" ADD CONSTRAINT "_rentals_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rentals_rental_terms_included_services_order_idx" ON "rentals_rental_terms_included_services" USING btree ("order");
  CREATE INDEX "rentals_rental_terms_included_services_parent_idx" ON "rentals_rental_terms_included_services" USING btree ("parent_id");
  CREATE UNIQUE INDEX "rentals_code_idx" ON "rentals" USING btree ("code");
  CREATE INDEX "rentals_category_idx" ON "rentals" USING btree ("category_id");
  CREATE INDEX "rentals_project_idx" ON "rentals" USING btree ("project_id");
  CREATE INDEX "rentals_province_idx" ON "rentals" USING btree ("province_id");
  CREATE INDEX "rentals_ward_idx" ON "rentals" USING btree ("ward_id");
  CREATE INDEX "rentals_furnishing_idx" ON "rentals" USING btree ("furnishing");
  CREATE INDEX "rentals_status_idx" ON "rentals" USING btree ("status");
  CREATE INDEX "rentals_published_at_idx" ON "rentals" USING btree ("published_at");
  CREATE INDEX "rentals_author_idx" ON "rentals" USING btree ("author_id");
  CREATE INDEX "rentals_is_featured_idx" ON "rentals" USING btree ("is_featured");
  CREATE INDEX "rentals_has_english_idx" ON "rentals" USING btree ("has_english");
  CREATE INDEX "rentals_translation_translation_status_idx" ON "rentals" USING btree ("translation_status");
  CREATE INDEX "rentals_translation_translation_vi_changed_after_manual_idx" ON "rentals" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "rentals_updated_at_idx" ON "rentals" USING btree ("updated_at");
  CREATE INDEX "rentals_created_at_idx" ON "rentals" USING btree ("created_at");
  CREATE INDEX "rentals_deleted_at_idx" ON "rentals" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "rentals_slug_idx" ON "rentals_locales" USING btree ("slug","_locale");
  CREATE INDEX "rentals_seo_seo_og_image_idx" ON "rentals_locales" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "rentals_locales_locale_parent_id_unique" ON "rentals_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "rentals_locales_parent_id_idx" ON "rentals_locales" USING btree ("_parent_id");
  CREATE INDEX "rentals_rels_order_idx" ON "rentals_rels" USING btree ("order");
  CREATE INDEX "rentals_rels_parent_idx" ON "rentals_rels" USING btree ("parent_id");
  CREATE INDEX "rentals_rels_path_idx" ON "rentals_rels" USING btree ("path");
  CREATE INDEX "rentals_rels_media_id_idx" ON "rentals_rels" USING btree ("media_id");
  CREATE INDEX "_rentals_v_version_rental_terms_included_services_order_idx" ON "_rentals_v_version_rental_terms_included_services" USING btree ("order");
  CREATE INDEX "_rentals_v_version_rental_terms_included_services_parent_idx" ON "_rentals_v_version_rental_terms_included_services" USING btree ("parent_id");
  CREATE INDEX "_rentals_v_parent_idx" ON "_rentals_v" USING btree ("parent_id");
  CREATE INDEX "_rentals_v_version_version_code_idx" ON "_rentals_v" USING btree ("version_code");
  CREATE INDEX "_rentals_v_version_version_category_idx" ON "_rentals_v" USING btree ("version_category_id");
  CREATE INDEX "_rentals_v_version_version_project_idx" ON "_rentals_v" USING btree ("version_project_id");
  CREATE INDEX "_rentals_v_version_version_province_idx" ON "_rentals_v" USING btree ("version_province_id");
  CREATE INDEX "_rentals_v_version_version_ward_idx" ON "_rentals_v" USING btree ("version_ward_id");
  CREATE INDEX "_rentals_v_version_version_furnishing_idx" ON "_rentals_v" USING btree ("version_furnishing");
  CREATE INDEX "_rentals_v_version_version_status_idx" ON "_rentals_v" USING btree ("version_status");
  CREATE INDEX "_rentals_v_version_version_published_at_idx" ON "_rentals_v" USING btree ("version_published_at");
  CREATE INDEX "_rentals_v_version_version_author_idx" ON "_rentals_v" USING btree ("version_author_id");
  CREATE INDEX "_rentals_v_version_version_is_featured_idx" ON "_rentals_v" USING btree ("version_is_featured");
  CREATE INDEX "_rentals_v_version_version_has_english_idx" ON "_rentals_v" USING btree ("version_has_english");
  CREATE INDEX "_rentals_v_version_translation_version_translation_statu_idx" ON "_rentals_v" USING btree ("version_translation_status");
  CREATE INDEX "_rentals_v_version_translation_version_translation_vi_ch_idx" ON "_rentals_v" USING btree ("version_translation_vi_changed_after_manual");
  CREATE INDEX "_rentals_v_version_version_updated_at_idx" ON "_rentals_v" USING btree ("version_updated_at");
  CREATE INDEX "_rentals_v_version_version_created_at_idx" ON "_rentals_v" USING btree ("version_created_at");
  CREATE INDEX "_rentals_v_version_version_deleted_at_idx" ON "_rentals_v" USING btree ("version_deleted_at");
  CREATE INDEX "_rentals_v_created_at_idx" ON "_rentals_v" USING btree ("created_at");
  CREATE INDEX "_rentals_v_updated_at_idx" ON "_rentals_v" USING btree ("updated_at");
  CREATE INDEX "_rentals_v_version_version_slug_idx" ON "_rentals_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_rentals_v_version_seo_version_seo_og_image_idx" ON "_rentals_v_locales" USING btree ("version_seo_og_image_id");
  CREATE UNIQUE INDEX "_rentals_v_locales_locale_parent_id_unique" ON "_rentals_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rentals_v_locales_parent_id_idx" ON "_rentals_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_rentals_v_rels_order_idx" ON "_rentals_v_rels" USING btree ("order");
  CREATE INDEX "_rentals_v_rels_parent_idx" ON "_rentals_v_rels" USING btree ("parent_id");
  CREATE INDEX "_rentals_v_rels_path_idx" ON "_rentals_v_rels" USING btree ("path");
  CREATE INDEX "_rentals_v_rels_media_id_idx" ON "_rentals_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rentals_fk" FOREIGN KEY ("rentals_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_rentals_id_idx" ON "payload_locked_documents_rels" USING btree ("rentals_id");

  -- SQL tuỳ biến (ERD §5): index tổng hợp phục vụ lọc/sắp xếp danh sách công khai và GIST cho toạ độ. Tên có tiền tố bảng; additive, không nằm trong snapshot .json nên không gây drift.
  -- Index trigram search_text (GIN gin_trgm_ops trên rentals_locales) làm ở task SearchService cùng truy vấn (cần extension pg_trgm).
  CREATE INDEX "rentals_list_idx" ON "rentals" USING btree ("status", "has_english", "category_id", "province_id", "price_monthly_vnd");
  CREATE INDEX "rentals_status_ward_idx" ON "rentals" USING btree ("status", "ward_id");
  CREATE INDEX "rentals_status_published_at_idx" ON "rentals" USING btree ("status", "published_at" DESC);
  CREATE INDEX "rentals_status_area_m2_idx" ON "rentals" USING btree ("status", "area_m2");
  CREATE INDEX "rentals_status_bedrooms_idx" ON "rentals" USING btree ("status", "bedrooms");
  CREATE INDEX "rentals_location_gist_idx" ON "rentals" USING gist ("location");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rentals_rental_terms_included_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rentals" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rentals_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rentals_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rentals_v_version_rental_terms_included_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rentals_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rentals_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rentals_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rentals_rental_terms_included_services" CASCADE;
  DROP TABLE "rentals" CASCADE;
  DROP TABLE "rentals_locales" CASCADE;
  DROP TABLE "rentals_rels" CASCADE;
  DROP TABLE "_rentals_v_version_rental_terms_included_services" CASCADE;
  DROP TABLE "_rentals_v" CASCADE;
  DROP TABLE "_rentals_v_locales" CASCADE;
  DROP TABLE "_rentals_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rentals_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_rentals_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rentals_id";
  DROP TYPE "public"."enum_rentals_rental_terms_included_services";
  DROP TYPE "public"."enum_rentals_house_direction";
  DROP TYPE "public"."enum_rentals_balcony_direction";
  DROP TYPE "public"."enum_rentals_furnishing";
  DROP TYPE "public"."enum_rentals_rental_terms_payment_cycle";
  DROP TYPE "public"."enum_rentals_status";
  DROP TYPE "public"."enum_rentals_translation_status";
  DROP TYPE "public"."enum_rentals_translation_en_source";
  DROP TYPE "public"."enum__rentals_v_version_rental_terms_included_services";
  DROP TYPE "public"."enum__rentals_v_version_house_direction";
  DROP TYPE "public"."enum__rentals_v_version_balcony_direction";
  DROP TYPE "public"."enum__rentals_v_version_furnishing";
  DROP TYPE "public"."enum__rentals_v_version_rental_terms_payment_cycle";
  DROP TYPE "public"."enum__rentals_v_version_status";
  DROP TYPE "public"."enum__rentals_v_version_translation_status";
  DROP TYPE "public"."enum__rentals_v_version_translation_en_source";
  DROP SEQUENCE IF EXISTS "rentals_code_seq";`)
}
