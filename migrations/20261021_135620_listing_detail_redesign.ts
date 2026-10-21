import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_product_types" AS ENUM('apartment', 'townhouse', 'villa', 'shophouse', 'land', 'resort', 'condotel', 'office');
  CREATE TYPE "public"."enum_projects_featured_amenities" AS ENUM('near_school', 'near_hospital', 'near_mall', 'near_metro', 'water_view', 'pool_gym_spa', 'green_park');
  CREATE TYPE "public"."enum__projects_v_version_product_types" AS ENUM('apartment', 'townhouse', 'villa', 'shophouse', 'land', 'resort', 'condotel', 'office');
  CREATE TYPE "public"."enum__projects_v_version_featured_amenities" AS ENUM('near_school', 'near_hospital', 'near_mall', 'near_metro', 'water_view', 'pool_gym_spa', 'green_park');
  CREATE TABLE "projects_product_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_projects_product_types",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "projects_featured_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_projects_featured_amenities",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "projects_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"count" numeric,
  	"area_from" numeric,
  	"area_to" numeric
  );
  
  CREATE TABLE "projects_products_locales" (
  	"type" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_product_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__projects_v_version_product_types",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_featured_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__projects_v_version_featured_amenities",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"count" numeric,
  	"area_from" numeric,
  	"area_to" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_products_locales" (
  	"type" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "site_settings_lp_projects_quick_search" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_lp_projects_quick_search_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_listing_pages_projects_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_listing_pages_projects_faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_lp_rentals_quick_search" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_lp_rentals_quick_search_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_listing_pages_rentals_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_listing_pages_rentals_faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_lp_property_posts_quick_search" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_lp_property_posts_quick_search_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_listing_pages_property_posts_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_listing_pages_property_posts_faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "projects_amenities_locales" ADD COLUMN "description" varchar;
  ALTER TABLE "projects" ADD COLUMN "amenities_image_id" uuid;
  ALTER TABLE "projects" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_projects_v_version_amenities_locales" ADD COLUMN "description" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_amenities_image_id" uuid;
  ALTER TABLE "_projects_v" ADD COLUMN "version_video_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_projects_learn_more_image_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_projects_learn_more_video_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_projects_learn_more_cta_href" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_rentals_learn_more_image_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_rentals_learn_more_video_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_rentals_learn_more_cta_href" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_rentals_show_strengths" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_property_posts_learn_more_image_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_property_posts_learn_more_video_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_property_posts_learn_more_cta_href" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "listing_pages_property_posts_show_strengths" boolean DEFAULT true;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_projects_learn_more_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_projects_learn_more_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_projects_learn_more_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_projects_learn_more_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_projects_learn_more_cta_label" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_rentals_learn_more_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_rentals_learn_more_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_rentals_learn_more_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_rentals_learn_more_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_rentals_learn_more_cta_label" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_property_posts_learn_more_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_property_posts_learn_more_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_property_posts_learn_more_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_property_posts_learn_more_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "listing_pages_property_posts_learn_more_cta_label" varchar;
  ALTER TABLE "projects_product_types" ADD CONSTRAINT "projects_product_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_featured_amenities" ADD CONSTRAINT "projects_featured_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_products" ADD CONSTRAINT "projects_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_products_locales" ADD CONSTRAINT "projects_products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_product_types" ADD CONSTRAINT "_projects_v_version_product_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_featured_amenities" ADD CONSTRAINT "_projects_v_version_featured_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_products" ADD CONSTRAINT "_projects_v_version_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_products_locales" ADD CONSTRAINT "_projects_v_version_products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lp_projects_quick_search" ADD CONSTRAINT "site_settings_lp_projects_quick_search_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lp_projects_quick_search_locales" ADD CONSTRAINT "site_settings_lp_projects_quick_search_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_lp_projects_quick_search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_listing_pages_projects_faqs" ADD CONSTRAINT "site_settings_listing_pages_projects_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_listing_pages_projects_faqs_locales" ADD CONSTRAINT "site_settings_listing_pages_projects_faqs_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_listing_pages_projects_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lp_rentals_quick_search" ADD CONSTRAINT "site_settings_lp_rentals_quick_search_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lp_rentals_quick_search_locales" ADD CONSTRAINT "site_settings_lp_rentals_quick_search_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_lp_rentals_quick_search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_listing_pages_rentals_faqs" ADD CONSTRAINT "site_settings_listing_pages_rentals_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_listing_pages_rentals_faqs_locales" ADD CONSTRAINT "site_settings_listing_pages_rentals_faqs_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_listing_pages_rentals_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lp_property_posts_quick_search" ADD CONSTRAINT "site_settings_lp_property_posts_quick_search_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lp_property_posts_quick_search_locales" ADD CONSTRAINT "site_settings_lp_property_posts_quick_search_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_lp_property_posts_quick_search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_listing_pages_property_posts_faqs" ADD CONSTRAINT "site_settings_listing_pages_property_posts_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_listing_pages_property_posts_faqs_locales" ADD CONSTRAINT "site_settings_listing_pages_property_posts_faqs_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_listing_pages_property_posts_faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_product_types_order_idx" ON "projects_product_types" USING btree ("order");
  CREATE INDEX "projects_product_types_parent_idx" ON "projects_product_types" USING btree ("parent_id");
  CREATE INDEX "projects_product_types_value_idx" ON "projects_product_types" USING btree ("value");
  CREATE INDEX "projects_featured_amenities_order_idx" ON "projects_featured_amenities" USING btree ("order");
  CREATE INDEX "projects_featured_amenities_parent_idx" ON "projects_featured_amenities" USING btree ("parent_id");
  CREATE INDEX "projects_featured_amenities_value_idx" ON "projects_featured_amenities" USING btree ("value");
  CREATE INDEX "projects_products_order_idx" ON "projects_products" USING btree ("_order");
  CREATE INDEX "projects_products_parent_id_idx" ON "projects_products" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_products_locales_locale_parent_id_unique" ON "projects_products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_products_locales_parent_id_idx" ON "projects_products_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_product_types_order_idx" ON "_projects_v_version_product_types" USING btree ("order");
  CREATE INDEX "_projects_v_version_product_types_parent_idx" ON "_projects_v_version_product_types" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_product_types_value_idx" ON "_projects_v_version_product_types" USING btree ("value");
  CREATE INDEX "_projects_v_version_featured_amenities_order_idx" ON "_projects_v_version_featured_amenities" USING btree ("order");
  CREATE INDEX "_projects_v_version_featured_amenities_parent_idx" ON "_projects_v_version_featured_amenities" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_featured_amenities_value_idx" ON "_projects_v_version_featured_amenities" USING btree ("value");
  CREATE INDEX "_projects_v_version_products_order_idx" ON "_projects_v_version_products" USING btree ("_order");
  CREATE INDEX "_projects_v_version_products_parent_id_idx" ON "_projects_v_version_products" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_products_locales_locale_parent_id_unique" ON "_projects_v_version_products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_products_locales_parent_id_idx" ON "_projects_v_version_products_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_lp_projects_quick_search_order_idx" ON "site_settings_lp_projects_quick_search" USING btree ("_order");
  CREATE INDEX "site_settings_lp_projects_quick_search_parent_id_idx" ON "site_settings_lp_projects_quick_search" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_lp_projects_quick_search_locales_locale_parent" ON "site_settings_lp_projects_quick_search_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_lp_projects_quick_search_locales_parent_id_idx" ON "site_settings_lp_projects_quick_search_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_listing_pages_projects_faqs_order_idx" ON "site_settings_listing_pages_projects_faqs" USING btree ("_order");
  CREATE INDEX "site_settings_listing_pages_projects_faqs_parent_id_idx" ON "site_settings_listing_pages_projects_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_listing_pages_projects_faqs_locales_locale_par" ON "site_settings_listing_pages_projects_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_listing_pages_projects_faqs_locales_parent_idx" ON "site_settings_listing_pages_projects_faqs_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_lp_rentals_quick_search_order_idx" ON "site_settings_lp_rentals_quick_search" USING btree ("_order");
  CREATE INDEX "site_settings_lp_rentals_quick_search_parent_id_idx" ON "site_settings_lp_rentals_quick_search" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_lp_rentals_quick_search_locales_locale_parent_" ON "site_settings_lp_rentals_quick_search_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_lp_rentals_quick_search_locales_parent_id_idx" ON "site_settings_lp_rentals_quick_search_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_listing_pages_rentals_faqs_order_idx" ON "site_settings_listing_pages_rentals_faqs" USING btree ("_order");
  CREATE INDEX "site_settings_listing_pages_rentals_faqs_parent_id_idx" ON "site_settings_listing_pages_rentals_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_listing_pages_rentals_faqs_locales_locale_pare" ON "site_settings_listing_pages_rentals_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_listing_pages_rentals_faqs_locales_parent__idx" ON "site_settings_listing_pages_rentals_faqs_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_lp_property_posts_quick_search_order_idx" ON "site_settings_lp_property_posts_quick_search" USING btree ("_order");
  CREATE INDEX "site_settings_lp_property_posts_quick_search_parent_id_idx" ON "site_settings_lp_property_posts_quick_search" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_lp_property_posts_quick_search_locales_locale_" ON "site_settings_lp_property_posts_quick_search_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_lp_property_posts_quick_search_locales_par_idx" ON "site_settings_lp_property_posts_quick_search_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_listing_pages_property_posts_faqs_order_idx" ON "site_settings_listing_pages_property_posts_faqs" USING btree ("_order");
  CREATE INDEX "site_settings_listing_pages_property_posts_faqs_parent_id_idx" ON "site_settings_listing_pages_property_posts_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_listing_pages_property_posts_faqs_locales_loca" ON "site_settings_listing_pages_property_posts_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_listing_pages_property_posts_faqs_locales__idx" ON "site_settings_listing_pages_property_posts_faqs_locales" USING btree ("_parent_id");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_amenities_image_id_media_id_fk" FOREIGN KEY ("amenities_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_amenities_image_id_media_id_fk" FOREIGN KEY ("version_amenities_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_listing_pages_projects_learn_more_image_id_media_id_fk" FOREIGN KEY ("listing_pages_projects_learn_more_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_listing_pages_rentals_learn_more_image_id_media_id_fk" FOREIGN KEY ("listing_pages_rentals_learn_more_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_listing_pages_property_posts_learn_more_image_id_media_id_fk" FOREIGN KEY ("listing_pages_property_posts_learn_more_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_amenities_image_idx" ON "projects" USING btree ("amenities_image_id");
  CREATE INDEX "_projects_v_version_version_amenities_image_idx" ON "_projects_v" USING btree ("version_amenities_image_id");
  CREATE INDEX "site_settings_listing_pages_projects_learn_more_listing__idx" ON "site_settings" USING btree ("listing_pages_projects_learn_more_image_id");
  CREATE INDEX "site_settings_listing_pages_rentals_learn_more_listing_p_idx" ON "site_settings" USING btree ("listing_pages_rentals_learn_more_image_id");
  CREATE INDEX "site_settings_listing_pages_property_posts_learn_more_li_idx" ON "site_settings" USING btree ("listing_pages_property_posts_learn_more_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_product_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_featured_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_products_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_product_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_featured_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_products_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_lp_projects_quick_search" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_lp_projects_quick_search_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_listing_pages_projects_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_listing_pages_projects_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_lp_rentals_quick_search" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_lp_rentals_quick_search_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_listing_pages_rentals_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_listing_pages_rentals_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_lp_property_posts_quick_search" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_lp_property_posts_quick_search_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_listing_pages_property_posts_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_listing_pages_property_posts_faqs_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_product_types" CASCADE;
  DROP TABLE "projects_featured_amenities" CASCADE;
  DROP TABLE "projects_products" CASCADE;
  DROP TABLE "projects_products_locales" CASCADE;
  DROP TABLE "_projects_v_version_product_types" CASCADE;
  DROP TABLE "_projects_v_version_featured_amenities" CASCADE;
  DROP TABLE "_projects_v_version_products" CASCADE;
  DROP TABLE "_projects_v_version_products_locales" CASCADE;
  DROP TABLE "site_settings_lp_projects_quick_search" CASCADE;
  DROP TABLE "site_settings_lp_projects_quick_search_locales" CASCADE;
  DROP TABLE "site_settings_listing_pages_projects_faqs" CASCADE;
  DROP TABLE "site_settings_listing_pages_projects_faqs_locales" CASCADE;
  DROP TABLE "site_settings_lp_rentals_quick_search" CASCADE;
  DROP TABLE "site_settings_lp_rentals_quick_search_locales" CASCADE;
  DROP TABLE "site_settings_listing_pages_rentals_faqs" CASCADE;
  DROP TABLE "site_settings_listing_pages_rentals_faqs_locales" CASCADE;
  DROP TABLE "site_settings_lp_property_posts_quick_search" CASCADE;
  DROP TABLE "site_settings_lp_property_posts_quick_search_locales" CASCADE;
  DROP TABLE "site_settings_listing_pages_property_posts_faqs" CASCADE;
  DROP TABLE "site_settings_listing_pages_property_posts_faqs_locales" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT "projects_amenities_image_id_media_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_amenities_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_listing_pages_projects_learn_more_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_listing_pages_rentals_learn_more_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_listing_pages_property_posts_learn_more_image_id_media_id_fk";
  
  DROP INDEX "projects_amenities_image_idx";
  DROP INDEX "_projects_v_version_version_amenities_image_idx";
  DROP INDEX "site_settings_listing_pages_projects_learn_more_listing__idx";
  DROP INDEX "site_settings_listing_pages_rentals_learn_more_listing_p_idx";
  DROP INDEX "site_settings_listing_pages_property_posts_learn_more_li_idx";
  ALTER TABLE "projects_amenities_locales" DROP COLUMN "description";
  ALTER TABLE "projects" DROP COLUMN "amenities_image_id";
  ALTER TABLE "projects" DROP COLUMN "video_url";
  ALTER TABLE "_projects_v_version_amenities_locales" DROP COLUMN "description";
  ALTER TABLE "_projects_v" DROP COLUMN "version_amenities_image_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_video_url";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_projects_learn_more_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_projects_learn_more_video_url";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_projects_learn_more_cta_href";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_rentals_learn_more_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_rentals_learn_more_video_url";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_rentals_learn_more_cta_href";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_rentals_show_strengths";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_property_posts_learn_more_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_property_posts_learn_more_video_url";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_property_posts_learn_more_cta_href";
  ALTER TABLE "site_settings" DROP COLUMN "listing_pages_property_posts_show_strengths";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_projects_learn_more_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_projects_learn_more_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_projects_learn_more_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_projects_learn_more_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_projects_learn_more_cta_label";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_rentals_learn_more_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_rentals_learn_more_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_rentals_learn_more_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_rentals_learn_more_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_rentals_learn_more_cta_label";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_property_posts_learn_more_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_property_posts_learn_more_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_property_posts_learn_more_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_property_posts_learn_more_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "listing_pages_property_posts_learn_more_cta_label";
  DROP TYPE "public"."enum_projects_product_types";
  DROP TYPE "public"."enum_projects_featured_amenities";
  DROP TYPE "public"."enum__projects_v_version_product_types";
  DROP TYPE "public"."enum__projects_v_version_featured_amenities";`)
}
