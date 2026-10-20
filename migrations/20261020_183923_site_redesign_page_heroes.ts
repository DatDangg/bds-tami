import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_careers_perks_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star');
  CREATE TABLE "site_settings_careers_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_site_settings_careers_perks_icon" NOT NULL
  );
  
  CREATE TABLE "site_settings_careers_perks_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_contact_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "page_banners_legal_id" uuid;
  ALTER TABLE "site_settings" ADD COLUMN "show_project_strengths" boolean DEFAULT true;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_projects_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_projects_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_projects_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_projects_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_rentals_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_rentals_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_rentals_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_rentals_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_news_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_news_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_news_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_news_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_property_posts_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_property_posts_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_property_posts_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_property_posts_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_careers_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_careers_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_careers_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_careers_description" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_contact_eyebrow" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_contact_title" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_contact_title_accent" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "page_heroes_contact_description" varchar;
  ALTER TABLE "site_settings_careers_perks" ADD CONSTRAINT "site_settings_careers_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_careers_perks_locales" ADD CONSTRAINT "site_settings_careers_perks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_careers_perks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_careers_perks_order_idx" ON "site_settings_careers_perks" USING btree ("_order");
  CREATE INDEX "site_settings_careers_perks_parent_id_idx" ON "site_settings_careers_perks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_careers_perks_locales_locale_parent_id_unique" ON "site_settings_careers_perks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_careers_perks_locales_parent_id_idx" ON "site_settings_careers_perks_locales" USING btree ("_parent_id");
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_contact_id_media_id_fk" FOREIGN KEY ("page_banners_contact_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_legal_id_media_id_fk" FOREIGN KEY ("page_banners_legal_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_page_banners_page_banners_contact_idx" ON "site_settings" USING btree ("page_banners_contact_id");
  CREATE INDEX "site_settings_page_banners_page_banners_legal_idx" ON "site_settings" USING btree ("page_banners_legal_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_careers_perks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_careers_perks_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "site_settings_careers_perks" CASCADE;
  DROP TABLE "site_settings_careers_perks_locales" CASCADE;
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_contact_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_page_banners_legal_id_media_id_fk";
  
  DROP INDEX "site_settings_page_banners_page_banners_contact_idx";
  DROP INDEX "site_settings_page_banners_page_banners_legal_idx";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_contact_id";
  ALTER TABLE "site_settings" DROP COLUMN "page_banners_legal_id";
  ALTER TABLE "site_settings" DROP COLUMN "show_project_strengths";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_projects_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_projects_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_projects_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_projects_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_rentals_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_rentals_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_rentals_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_rentals_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_news_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_news_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_news_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_news_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_property_posts_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_property_posts_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_property_posts_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_property_posts_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_careers_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_careers_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_careers_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_careers_description";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_contact_eyebrow";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_contact_title";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_contact_title_accent";
  ALTER TABLE "site_settings_locales" DROP COLUMN "page_heroes_contact_description";
  DROP TYPE "public"."enum_site_settings_careers_perks_icon";`)
}
