import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_scope" AS ENUM('rental', 'property_post', 'news', 'project', 'job');
  CREATE TYPE "public"."enum_categories_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_categories_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TYPE "public"."enum_developers_translation_status" AS ENUM('none', 'queued', 'done', 'failed', 'pending_review');
  CREATE TYPE "public"."enum_developers_translation_en_source" AS ENUM('ai', 'manual');
  CREATE TABLE "categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"scope" "enum_categories_scope" NOT NULL,
  	"parent_id" uuid,
  	"sort_order" numeric DEFAULT 0,
  	"has_english" boolean DEFAULT false,
  	"translation_status" "enum_categories_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_categories_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar,
  	"description" varchar,
  	"slug" varchar,
  	"scope_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" uuid,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_canonical" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "developers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"logo_id" uuid,
  	"website" varchar,
  	"show_as_partner" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"has_english" boolean DEFAULT false,
  	"translation_status" "enum_developers_translation_status" DEFAULT 'none',
  	"translation_en_source" "enum_developers_translation_en_source",
  	"translation_vi_changed_after_manual" boolean DEFAULT false,
  	"translation_source_hash" jsonb,
  	"translation_translated_at" timestamp(3) with time zone,
  	"translation_model" varchar,
  	"translation_last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "developers_locales" (
  	"name" varchar,
  	"description" jsonb,
  	"slug" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "developers_id" uuid;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "developers" ADD CONSTRAINT "developers_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "developers_locales" ADD CONSTRAINT "developers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_scope_idx" ON "categories" USING btree ("scope");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_sort_order_idx" ON "categories" USING btree ("sort_order");
  CREATE INDEX "categories_has_english_idx" ON "categories" USING btree ("has_english");
  CREATE INDEX "categories_translation_translation_status_idx" ON "categories" USING btree ("translation_status");
  CREATE INDEX "categories_translation_translation_vi_changed_after_manu_idx" ON "categories" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "categories_deleted_at_idx" ON "categories" USING btree ("deleted_at");
  CREATE INDEX "categories_slug_idx" ON "categories_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "categories_scope_slug_idx" ON "categories_locales" USING btree ("scope_slug","_locale");
  CREATE INDEX "categories_seo_seo_og_image_idx" ON "categories_locales" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX "developers_logo_idx" ON "developers" USING btree ("logo_id");
  CREATE INDEX "developers_show_as_partner_idx" ON "developers" USING btree ("show_as_partner");
  CREATE INDEX "developers_sort_order_idx" ON "developers" USING btree ("sort_order");
  CREATE INDEX "developers_has_english_idx" ON "developers" USING btree ("has_english");
  CREATE INDEX "developers_translation_translation_status_idx" ON "developers" USING btree ("translation_status");
  CREATE INDEX "developers_translation_translation_vi_changed_after_manu_idx" ON "developers" USING btree ("translation_vi_changed_after_manual");
  CREATE INDEX "developers_updated_at_idx" ON "developers" USING btree ("updated_at");
  CREATE INDEX "developers_created_at_idx" ON "developers" USING btree ("created_at");
  CREATE INDEX "developers_deleted_at_idx" ON "developers" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "developers_slug_idx" ON "developers_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "developers_locales_locale_parent_id_unique" ON "developers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "developers_locales_parent_id_idx" ON "developers_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_developers_fk" FOREIGN KEY ("developers_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_developers_id_idx" ON "payload_locked_documents_rels" USING btree ("developers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "developers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "developers_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "developers" CASCADE;
  DROP TABLE "developers_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_developers_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_developers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "developers_id";
  DROP TYPE "public"."enum_categories_scope";
  DROP TYPE "public"."enum_categories_translation_status";
  DROP TYPE "public"."enum_categories_translation_en_source";
  DROP TYPE "public"."enum_developers_translation_status";
  DROP TYPE "public"."enum_developers_translation_en_source";`)
}
