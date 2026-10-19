import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_homepage_block_order_block" ADD VALUE 'rentals';
  ALTER TYPE "public"."enum_homepage_block_order_block" ADD VALUE 'news';
  ALTER TABLE "homepage" ADD COLUMN "announcement_bar_enabled" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "announcement_bar_link" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_search_enabled" boolean DEFAULT true;
  ALTER TABLE "homepage" ADD COLUMN "rentals_enabled" boolean DEFAULT true;
  ALTER TABLE "homepage" ADD COLUMN "news_enabled" boolean DEFAULT true;
  ALTER TABLE "homepage" ADD COLUMN "cta_banner_image_id" uuid;
  ALTER TABLE "homepage" ADD COLUMN "cta_banner_secondary_link" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "announcement_bar_text" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "hero_search_placeholder" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "rentals_title" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_title" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "news_intro" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "cta_banner_secondary_label" varchar;
  ALTER TABLE "homepage_rels" ADD COLUMN "categories_id" uuid;
  ALTER TABLE "homepage_rels" ADD COLUMN "news_id" uuid;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_cta_banner_image_id_media_id_fk" FOREIGN KEY ("cta_banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_cta_banner_cta_banner_image_idx" ON "homepage" USING btree ("cta_banner_image_id");
  CREATE INDEX "homepage_rels_categories_id_idx" ON "homepage_rels" USING btree ("categories_id");
  CREATE INDEX "homepage_rels_news_id_idx" ON "homepage_rels" USING btree ("news_id");`)
}

// Hand-edited down: Postgres không DROP VALUE khỏi enum nên phải tạo lại enum cũ. Trước đó xoá các hàng dùng giá trị mới ('rentals', 'news')
// của blockOrder và các hàng quan hệ của nhóm mới (cột *_id bị DROP kéo theo mất đích), nếu không việc ép kiểu về enum cũ sẽ lỗi.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "homepage_block_order" WHERE "block" IN ('rentals', 'news');
  DELETE FROM "homepage_rels" WHERE "path" IN ('rentals.categories', 'news.posts', 'heroSearch.chipProjects');
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_cta_banner_image_id_media_id_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_categories_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_news_fk";
  
  ALTER TABLE "homepage_block_order" ALTER COLUMN "block" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_block_order_block";
  CREATE TYPE "public"."enum_homepage_block_order_block" AS ENUM('about', 'featuredProjects', 'services', 'featuredOffers', 'partners', 'ctaBanner');
  ALTER TABLE "homepage_block_order" ALTER COLUMN "block" SET DATA TYPE "public"."enum_homepage_block_order_block" USING "block"::"public"."enum_homepage_block_order_block";
  DROP INDEX "homepage_cta_banner_cta_banner_image_idx";
  DROP INDEX "homepage_rels_categories_id_idx";
  DROP INDEX "homepage_rels_news_id_idx";
  ALTER TABLE "homepage" DROP COLUMN "announcement_bar_enabled";
  ALTER TABLE "homepage" DROP COLUMN "announcement_bar_link";
  ALTER TABLE "homepage" DROP COLUMN "hero_search_enabled";
  ALTER TABLE "homepage" DROP COLUMN "rentals_enabled";
  ALTER TABLE "homepage" DROP COLUMN "news_enabled";
  ALTER TABLE "homepage" DROP COLUMN "cta_banner_image_id";
  ALTER TABLE "homepage" DROP COLUMN "cta_banner_secondary_link";
  ALTER TABLE "homepage_locales" DROP COLUMN "announcement_bar_text";
  ALTER TABLE "homepage_locales" DROP COLUMN "hero_search_placeholder";
  ALTER TABLE "homepage_locales" DROP COLUMN "rentals_title";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_title";
  ALTER TABLE "homepage_locales" DROP COLUMN "news_intro";
  ALTER TABLE "homepage_locales" DROP COLUMN "cta_banner_secondary_label";
  ALTER TABLE "homepage_rels" DROP COLUMN "categories_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "news_id";`)
}
