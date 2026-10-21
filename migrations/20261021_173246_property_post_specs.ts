import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_property_posts_property_type" AS ENUM('apartment', 'townhouse', 'villa', 'shophouse', 'land', 'resort', 'condotel', 'office');
  CREATE TYPE "public"."enum_property_posts_house_direction" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
  CREATE TYPE "public"."enum_property_posts_handover_condition" AS ENUM('raw', 'basic', 'full');
  CREATE TYPE "public"."enum__property_posts_v_version_property_type" AS ENUM('apartment', 'townhouse', 'villa', 'shophouse', 'land', 'resort', 'condotel', 'office');
  CREATE TYPE "public"."enum__property_posts_v_version_house_direction" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
  CREATE TYPE "public"."enum__property_posts_v_version_handover_condition" AS ENUM('raw', 'basic', 'full');
  ALTER TABLE "property_posts" ADD COLUMN "property_type" "enum_property_posts_property_type";
  ALTER TABLE "property_posts" ADD COLUMN "area_m2" numeric;
  ALTER TABLE "property_posts" ADD COLUMN "bedrooms" numeric;
  ALTER TABLE "property_posts" ADD COLUMN "bathrooms" numeric;
  ALTER TABLE "property_posts" ADD COLUMN "house_direction" "enum_property_posts_house_direction";
  ALTER TABLE "property_posts" ADD COLUMN "handover_condition" "enum_property_posts_handover_condition";
  ALTER TABLE "property_posts" ADD COLUMN "frontage_m" numeric;
  ALTER TABLE "property_posts" ADD COLUMN "floors" numeric;
  ALTER TABLE "property_posts" ADD COLUMN "address" varchar;
  ALTER TABLE "property_posts" ADD COLUMN "location" geometry(Point);
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_property_type" "enum__property_posts_v_version_property_type";
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_area_m2" numeric;
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_bedrooms" numeric;
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_bathrooms" numeric;
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_house_direction" "enum__property_posts_v_version_house_direction";
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_handover_condition" "enum__property_posts_v_version_handover_condition";
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_frontage_m" numeric;
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_floors" numeric;
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_address" varchar;
  ALTER TABLE "_property_posts_v" ADD COLUMN "version_location" geometry(Point);
  CREATE INDEX "property_posts_property_type_idx" ON "property_posts" USING btree ("property_type");
  CREATE INDEX "property_posts_area_m2_idx" ON "property_posts" USING btree ("area_m2");
  CREATE INDEX "_property_posts_v_version_version_property_type_idx" ON "_property_posts_v" USING btree ("version_property_type");
  CREATE INDEX "_property_posts_v_version_version_area_m2_idx" ON "_property_posts_v" USING btree ("version_area_m2");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "property_posts_property_type_idx";
  DROP INDEX "property_posts_area_m2_idx";
  DROP INDEX "_property_posts_v_version_version_property_type_idx";
  DROP INDEX "_property_posts_v_version_version_area_m2_idx";
  ALTER TABLE "property_posts" DROP COLUMN "property_type";
  ALTER TABLE "property_posts" DROP COLUMN "area_m2";
  ALTER TABLE "property_posts" DROP COLUMN "bedrooms";
  ALTER TABLE "property_posts" DROP COLUMN "bathrooms";
  ALTER TABLE "property_posts" DROP COLUMN "house_direction";
  ALTER TABLE "property_posts" DROP COLUMN "handover_condition";
  ALTER TABLE "property_posts" DROP COLUMN "frontage_m";
  ALTER TABLE "property_posts" DROP COLUMN "floors";
  ALTER TABLE "property_posts" DROP COLUMN "address";
  ALTER TABLE "property_posts" DROP COLUMN "location";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_property_type";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_area_m2";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_bedrooms";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_bathrooms";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_house_direction";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_handover_condition";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_frontage_m";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_floors";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_address";
  ALTER TABLE "_property_posts_v" DROP COLUMN "version_location";
  DROP TYPE "public"."enum_property_posts_property_type";
  DROP TYPE "public"."enum_property_posts_house_direction";
  DROP TYPE "public"."enum_property_posts_handover_condition";
  DROP TYPE "public"."enum__property_posts_v_version_property_type";
  DROP TYPE "public"."enum__property_posts_v_version_house_direction";
  DROP TYPE "public"."enum__property_posts_v_version_handover_condition";`)
}
