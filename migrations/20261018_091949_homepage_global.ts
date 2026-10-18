import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_block_order_block" AS ENUM('about', 'featuredProjects', 'services', 'featuredOffers', 'partners', 'ctaBanner');
  CREATE TYPE "public"."enum_homepage_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_homepage_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TABLE "homepage_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" uuid NOT NULL,
  	"video_id" uuid,
  	"cta_link" varchar
  );
  
  CREATE TABLE "homepage_hero_slides_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_about_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_about_stats_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_block_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block" "enum_homepage_block_order_block" NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"about_enabled" boolean DEFAULT true,
  	"about_image_id" uuid,
  	"featured_projects_enabled" boolean DEFAULT true,
  	"services_enabled" boolean DEFAULT true,
  	"featured_offers_enabled" boolean DEFAULT true,
  	"partners_enabled" boolean DEFAULT true,
  	"cta_banner_enabled" boolean DEFAULT false,
  	"cta_banner_cta_link" varchar,
  	"cta_banner_background_image_id" uuid,
  	"translation_status" "enum_homepage_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_homepage_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"about_title" varchar,
  	"about_content" jsonb,
  	"featured_projects_title" varchar,
  	"services_title" varchar,
  	"featured_offers_title" varchar,
  	"partners_title" varchar,
  	"cta_banner_title" varchar,
  	"cta_banner_description" varchar,
  	"cta_banner_cta_label" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" uuid,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_canonical" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" uuid,
  	"services_id" uuid,
  	"property_posts_id" uuid
  );
  
  ALTER TABLE "homepage_hero_slides" ADD CONSTRAINT "homepage_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_hero_slides" ADD CONSTRAINT "homepage_hero_slides_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_hero_slides" ADD CONSTRAINT "homepage_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_slides_locales" ADD CONSTRAINT "homepage_hero_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_hero_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_about_stats" ADD CONSTRAINT "homepage_about_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_about_stats_locales" ADD CONSTRAINT "homepage_about_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_about_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_block_order" ADD CONSTRAINT "homepage_block_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_about_image_id_media_id_fk" FOREIGN KEY ("about_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_cta_banner_background_image_id_media_id_fk" FOREIGN KEY ("cta_banner_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_property_posts_fk" FOREIGN KEY ("property_posts_id") REFERENCES "public"."property_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_hero_slides_order_idx" ON "homepage_hero_slides" USING btree ("_order");
  CREATE INDEX "homepage_hero_slides_parent_id_idx" ON "homepage_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_slides_image_idx" ON "homepage_hero_slides" USING btree ("image_id");
  CREATE INDEX "homepage_hero_slides_video_idx" ON "homepage_hero_slides" USING btree ("video_id");
  CREATE UNIQUE INDEX "homepage_hero_slides_locales_locale_parent_id_unique" ON "homepage_hero_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_hero_slides_locales_parent_id_idx" ON "homepage_hero_slides_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_about_stats_order_idx" ON "homepage_about_stats" USING btree ("_order");
  CREATE INDEX "homepage_about_stats_parent_id_idx" ON "homepage_about_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_about_stats_locales_locale_parent_id_unique" ON "homepage_about_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_about_stats_locales_parent_id_idx" ON "homepage_about_stats_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_block_order_order_idx" ON "homepage_block_order" USING btree ("_order");
  CREATE INDEX "homepage_block_order_parent_id_idx" ON "homepage_block_order" USING btree ("_parent_id");
  CREATE INDEX "homepage_about_about_image_idx" ON "homepage" USING btree ("about_image_id");
  CREATE INDEX "homepage_cta_banner_cta_banner_background_image_idx" ON "homepage" USING btree ("cta_banner_background_image_id");
  CREATE INDEX "homepage_translation_translation_status_idx" ON "homepage" USING btree ("translation_status");
  CREATE INDEX "homepage_translation_translation_vi_changed_after_manual_idx" ON "homepage" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "homepage_seo_seo_og_image_idx" ON "homepage_locales" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_locales_parent_id_idx" ON "homepage_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_projects_id_idx" ON "homepage_rels" USING btree ("projects_id");
  CREATE INDEX "homepage_rels_services_id_idx" ON "homepage_rels" USING btree ("services_id");
  CREATE INDEX "homepage_rels_property_posts_id_idx" ON "homepage_rels" USING btree ("property_posts_id");`)
}

// Chỉ bảng/enum của global homepage (toàn bảng mới, additive); IF EXISTS để chạy lại an toàn.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "homepage_hero_slides" CASCADE;
  DROP TABLE IF EXISTS "homepage_hero_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "homepage_about_stats" CASCADE;
  DROP TABLE IF EXISTS "homepage_about_stats_locales" CASCADE;
  DROP TABLE IF EXISTS "homepage_block_order" CASCADE;
  DROP TABLE IF EXISTS "homepage" CASCADE;
  DROP TABLE IF EXISTS "homepage_locales" CASCADE;
  DROP TABLE IF EXISTS "homepage_rels" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_homepage_block_order_block";
  DROP TYPE IF EXISTS "public"."enum_homepage_translation_status";
  DROP TYPE IF EXISTS "public"."enum_homepage_translation_en_source";`)
}
