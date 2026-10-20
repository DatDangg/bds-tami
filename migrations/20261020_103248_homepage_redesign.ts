import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_strengths_items_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star');
  CREATE TYPE "public"."enum_homepage_about_stats_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star');
  ALTER TYPE "public"."enum_homepage_block_order_block" ADD VALUE 'strengths' BEFORE 'about';
  CREATE TABLE "homepage_strengths_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_homepage_strengths_items_icon" NOT NULL
  );
  
  CREATE TABLE "homepage_strengths_items_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "homepage_hero_slides_locales" ADD COLUMN "title_accent" varchar;
  ALTER TABLE "homepage_about_stats" ADD COLUMN "icon" "enum_homepage_about_stats_icon";
  ALTER TABLE "homepage" ADD COLUMN "strengths_enabled" boolean DEFAULT true;
  ALTER TABLE "homepage" ADD COLUMN "about_secondary_image_id" uuid;
  ALTER TABLE "homepage" ADD COLUMN "about_video_url" varchar;
  ALTER TABLE "homepage" ADD COLUMN "about_cta_link" varchar;
  ALTER TABLE "homepage" ADD COLUMN "about_decor_image_id" uuid;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_eyebrow" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_caption" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "about_eyebrow" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "about_title_accent" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "about_image_caption" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "about_video_label" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "about_cta_label" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "featured_projects_eyebrow" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "featured_projects_description" varchar;
  ALTER TABLE "homepage_strengths_items" ADD CONSTRAINT "homepage_strengths_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_strengths_items_locales" ADD CONSTRAINT "homepage_strengths_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_strengths_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_strengths_items_order_idx" ON "homepage_strengths_items" USING btree ("_order");
  CREATE INDEX "homepage_strengths_items_parent_id_idx" ON "homepage_strengths_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_strengths_items_locales_locale_parent_id_unique" ON "homepage_strengths_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_strengths_items_locales_parent_id_idx" ON "homepage_strengths_items_locales" USING btree ("_parent_id");
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_about_secondary_image_id_media_id_fk" FOREIGN KEY ("about_secondary_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_about_decor_image_id_media_id_fk" FOREIGN KEY ("about_decor_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "homepage_about_about_secondary_image_idx" ON "homepage" USING btree ("about_secondary_image_id");
  CREATE INDEX "homepage_about_about_decor_image_idx" ON "homepage" USING btree ("about_decor_image_id");`)
}

// Hand-edited down: Postgres không DROP VALUE khỏi enum nên tạo lại enum cũ; xoá trước các hàng blockOrder đang dùng 'strengths'
// (là phần tử đầu của defaultValue nên gần như chắc chắn tồn tại), nếu không việc ép kiểu về enum cũ sẽ lỗi.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "homepage_block_order" WHERE "block" = 'strengths';
  ALTER TABLE "homepage_strengths_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_strengths_items_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "homepage_strengths_items" CASCADE;
  DROP TABLE "homepage_strengths_items_locales" CASCADE;
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_about_secondary_image_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_about_decor_image_id_media_id_fk";
  
  ALTER TABLE "homepage_block_order" ALTER COLUMN "block" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_block_order_block";
  CREATE TYPE "public"."enum_homepage_block_order_block" AS ENUM('about', 'featuredProjects', 'services', 'featuredOffers', 'partners', 'ctaBanner', 'rentals', 'news');
  ALTER TABLE "homepage_block_order" ALTER COLUMN "block" SET DATA TYPE "public"."enum_homepage_block_order_block" USING "block"::"public"."enum_homepage_block_order_block";
  DROP INDEX "homepage_about_about_secondary_image_idx";
  DROP INDEX "homepage_about_about_decor_image_idx";
  ALTER TABLE "homepage_hero_slides_locales" DROP COLUMN "title_accent";
  ALTER TABLE "homepage_about_stats" DROP COLUMN "icon";
  ALTER TABLE "homepage" DROP COLUMN "strengths_enabled";
  ALTER TABLE "homepage" DROP COLUMN "about_secondary_image_id";
  ALTER TABLE "homepage" DROP COLUMN "about_video_url";
  ALTER TABLE "homepage" DROP COLUMN "about_cta_link";
  ALTER TABLE "homepage" DROP COLUMN "about_decor_image_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_eyebrow";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_caption";
  ALTER TABLE "homepage_locales" DROP COLUMN "about_eyebrow";
  ALTER TABLE "homepage_locales" DROP COLUMN "about_title_accent";
  ALTER TABLE "homepage_locales" DROP COLUMN "about_image_caption";
  ALTER TABLE "homepage_locales" DROP COLUMN "about_video_label";
  ALTER TABLE "homepage_locales" DROP COLUMN "about_cta_label";
  ALTER TABLE "homepage_locales" DROP COLUMN "featured_projects_eyebrow";
  ALTER TABLE "homepage_locales" DROP COLUMN "featured_projects_description";
  DROP TYPE "public"."enum_homepage_strengths_items_icon";
  DROP TYPE "public"."enum_homepage_about_stats_icon";`)
}
