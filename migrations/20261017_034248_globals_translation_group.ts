import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_site_settings_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum_header_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_header_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum_footer_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_footer_translation_en_source" AS ENUM('ai', 'manual');
  ALTER TABLE "site_settings" ADD COLUMN "translation_status" "enum_site_settings_translation_status" DEFAULT 'none';
  ALTER TABLE "site_settings" ADD COLUMN "translation_en_source" "enum_site_settings_translation_en_source";
  ALTER TABLE "site_settings" ADD COLUMN "translation_vi_changed_after_manual" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "translation_source_hash" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "translation_translated_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "translation_model" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "translation_last_error" varchar;
  ALTER TABLE "header" ADD COLUMN "translation_status" "enum_header_translation_status" DEFAULT 'none';
  ALTER TABLE "header" ADD COLUMN "translation_en_source" "enum_header_translation_en_source";
  ALTER TABLE "header" ADD COLUMN "translation_vi_changed_after_manual" boolean DEFAULT false;
  ALTER TABLE "header" ADD COLUMN "translation_source_hash" jsonb;
  ALTER TABLE "header" ADD COLUMN "translation_translated_at" timestamp(3) with time zone;
  ALTER TABLE "header" ADD COLUMN "translation_model" varchar;
  ALTER TABLE "header" ADD COLUMN "translation_last_error" varchar;
  ALTER TABLE "footer" ADD COLUMN "translation_status" "enum_footer_translation_status" DEFAULT 'none';
  ALTER TABLE "footer" ADD COLUMN "translation_en_source" "enum_footer_translation_en_source";
  ALTER TABLE "footer" ADD COLUMN "translation_vi_changed_after_manual" boolean DEFAULT false;
  ALTER TABLE "footer" ADD COLUMN "translation_source_hash" jsonb;
  ALTER TABLE "footer" ADD COLUMN "translation_translated_at" timestamp(3) with time zone;
  ALTER TABLE "footer" ADD COLUMN "translation_model" varchar;
  ALTER TABLE "footer" ADD COLUMN "translation_last_error" varchar;
  CREATE INDEX "site_settings_translation_translation_status_idx" ON "site_settings" USING btree ("translation_status");
  CREATE INDEX "site_settings_translation_translation_vi_changed_after_m_idx" ON "site_settings" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "header_translation_translation_status_idx" ON "header" USING btree ("translation_status");
  CREATE INDEX "header_translation_translation_vi_changed_after_manual_idx" ON "header" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "footer_translation_translation_status_idx" ON "footer" USING btree ("translation_status");
  CREATE INDEX "footer_translation_translation_vi_changed_after_manual_idx" ON "footer" USING btree ("translation_vi_changed_after_manual");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "site_settings_translation_translation_status_idx";
  DROP INDEX "site_settings_translation_translation_vi_changed_after_m_idx";
  DROP INDEX "header_translation_translation_status_idx";
  DROP INDEX "header_translation_translation_vi_changed_after_manual_idx";
  DROP INDEX "footer_translation_translation_status_idx";
  DROP INDEX "footer_translation_translation_vi_changed_after_manual_idx";
  ALTER TABLE "site_settings" DROP COLUMN "translation_status";
  ALTER TABLE "site_settings" DROP COLUMN "translation_en_source";
  ALTER TABLE "site_settings" DROP COLUMN "translation_vi_changed_after_manual";
  ALTER TABLE "site_settings" DROP COLUMN "translation_source_hash";
  ALTER TABLE "site_settings" DROP COLUMN "translation_translated_at";
  ALTER TABLE "site_settings" DROP COLUMN "translation_model";
  ALTER TABLE "site_settings" DROP COLUMN "translation_last_error";
  ALTER TABLE "header" DROP COLUMN "translation_status";
  ALTER TABLE "header" DROP COLUMN "translation_en_source";
  ALTER TABLE "header" DROP COLUMN "translation_vi_changed_after_manual";
  ALTER TABLE "header" DROP COLUMN "translation_source_hash";
  ALTER TABLE "header" DROP COLUMN "translation_translated_at";
  ALTER TABLE "header" DROP COLUMN "translation_model";
  ALTER TABLE "header" DROP COLUMN "translation_last_error";
  ALTER TABLE "footer" DROP COLUMN "translation_status";
  ALTER TABLE "footer" DROP COLUMN "translation_en_source";
  ALTER TABLE "footer" DROP COLUMN "translation_vi_changed_after_manual";
  ALTER TABLE "footer" DROP COLUMN "translation_source_hash";
  ALTER TABLE "footer" DROP COLUMN "translation_translated_at";
  ALTER TABLE "footer" DROP COLUMN "translation_model";
  ALTER TABLE "footer" DROP COLUMN "translation_last_error";
  DROP TYPE "public"."enum_site_settings_translation_status";
  DROP TYPE "public"."enum_site_settings_translation_en_source";
  DROP TYPE "public"."enum_header_translation_status";
  DROP TYPE "public"."enum_header_translation_en_source";
  DROP TYPE "public"."enum_footer_translation_status";
  DROP TYPE "public"."enum_footer_translation_en_source";`)
}
