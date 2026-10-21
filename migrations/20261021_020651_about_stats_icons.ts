import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_site_settings_careers_perks_icon" ADD VALUE 'medal';
  ALTER TYPE "public"."enum_site_settings_careers_perks_icon" ADD VALUE 'users-three';
  ALTER TYPE "public"."enum_homepage_strengths_items_icon" ADD VALUE 'medal';
  ALTER TYPE "public"."enum_homepage_strengths_items_icon" ADD VALUE 'users-three';
  ALTER TYPE "public"."enum_homepage_about_stats_icon" ADD VALUE 'medal';
  ALTER TYPE "public"."enum_homepage_about_stats_icon" ADD VALUE 'users-three';`)
}

// down: đổi giá trị mới về icon gần nhất (medal → star, users-three → users) trước khi dựng lại enum cũ, để không lỗi cast.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_careers_perks" ALTER COLUMN "icon" SET DATA TYPE text;
  UPDATE "site_settings_careers_perks" SET "icon" = CASE "icon" WHEN 'medal' THEN 'star' ELSE 'users' END WHERE "icon" IN ('medal', 'users-three');
  DROP TYPE "public"."enum_site_settings_careers_perks_icon";
  CREATE TYPE "public"."enum_site_settings_careers_perks_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star');
  ALTER TABLE "site_settings_careers_perks" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_site_settings_careers_perks_icon" USING "icon"::"public"."enum_site_settings_careers_perks_icon";
  ALTER TABLE "homepage_strengths_items" ALTER COLUMN "icon" SET DATA TYPE text;
  UPDATE "homepage_strengths_items" SET "icon" = CASE "icon" WHEN 'medal' THEN 'star' ELSE 'users' END WHERE "icon" IN ('medal', 'users-three');
  DROP TYPE "public"."enum_homepage_strengths_items_icon";
  CREATE TYPE "public"."enum_homepage_strengths_items_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star');
  ALTER TABLE "homepage_strengths_items" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_homepage_strengths_items_icon" USING "icon"::"public"."enum_homepage_strengths_items_icon";
  ALTER TABLE "homepage_about_stats" ALTER COLUMN "icon" SET DATA TYPE text;
  UPDATE "homepage_about_stats" SET "icon" = CASE "icon" WHEN 'medal' THEN 'star' ELSE 'users' END WHERE "icon" IN ('medal', 'users-three');
  DROP TYPE "public"."enum_homepage_about_stats_icon";
  CREATE TYPE "public"."enum_homepage_about_stats_icon" AS ENUM('map-pin', 'buildings', 'headset', 'file-check', 'shield-check', 'clock', 'users', 'star');
  ALTER TABLE "homepage_about_stats" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_homepage_about_stats_icon" USING "icon"::"public"."enum_homepage_about_stats_icon";`)
}
