import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "page_banners_default_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_projects_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_rentals_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_property_posts_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_news_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_careers_id" uuid;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_default_id_media_id_fk" FOREIGN KEY ("page_banners_default_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_projects_id_media_id_fk" FOREIGN KEY ("page_banners_projects_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_rentals_id_media_id_fk" FOREIGN KEY ("page_banners_rentals_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_property_posts_id_media_id_fk" FOREIGN KEY ("page_banners_property_posts_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_news_id_media_id_fk" FOREIGN KEY ("page_banners_news_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_careers_id_media_id_fk" FOREIGN KEY ("page_banners_careers_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_page_banners_page_banners_default_idx" ON "site_settings" USING btree ("page_banners_default_id");
  CREATE INDEX "site_settings_page_banners_page_banners_projects_idx" ON "site_settings" USING btree ("page_banners_projects_id");
  CREATE INDEX "site_settings_page_banners_page_banners_rentals_idx" ON "site_settings" USING btree ("page_banners_rentals_id");
  CREATE INDEX "site_settings_page_banners_page_banners_property_posts_idx" ON "site_settings" USING btree ("page_banners_property_posts_id");
  CREATE INDEX "site_settings_page_banners_page_banners_news_idx" ON "site_settings" USING btree ("page_banners_news_id");
  CREATE INDEX "site_settings_page_banners_page_banners_careers_idx" ON "site_settings" USING btree ("page_banners_careers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_default_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_projects_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_rentals_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_property_posts_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_news_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_careers_id_media_id_fk";
  
  DROP INDEX "site_settings_page_banners_page_banners_default_idx";
  DROP INDEX "site_settings_page_banners_page_banners_projects_idx";
  DROP INDEX "site_settings_page_banners_page_banners_rentals_idx";
  DROP INDEX "site_settings_page_banners_page_banners_property_posts_idx";
  DROP INDEX "site_settings_page_banners_page_banners_news_idx";
  DROP INDEX "site_settings_page_banners_page_banners_careers_idx";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_default_id";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_projects_id";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_rentals_id";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_property_posts_id";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_news_id";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_careers_id";`)
}
