import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_nearby_amenities_category" AS ENUM('education', 'healthcare', 'shopping', 'park', 'transport', 'other');
  CREATE TYPE "public"."enum_projects_price_table_availability" AS ENUM('available', 'few_left', 'sold_out');
  CREATE TYPE "public"."enum__projects_v_version_nearby_amenities_category" AS ENUM('education', 'healthcare', 'shopping', 'park', 'transport', 'other');
  CREATE TYPE "public"."enum__projects_v_version_price_table_availability" AS ENUM('available', 'few_left', 'sold_out');
  CREATE TABLE "projects_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "projects_highlights_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_nearby_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_projects_nearby_amenities_category" DEFAULT 'other' NOT NULL,
  	"distance" varchar,
  	"location" geometry(Point)
  );
  
  CREATE TABLE "projects_nearby_amenities_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_price_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"area_from" numeric,
  	"area_to" numeric,
  	"price_from" numeric,
  	"price_to" numeric,
  	"availability" "enum_projects_price_table_availability"
  );
  
  CREATE TABLE "projects_price_table_locales" (
  	"unit_type" varchar NOT NULL,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"icon" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_highlights_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_nearby_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"category" "enum__projects_v_version_nearby_amenities_category" DEFAULT 'other' NOT NULL,
  	"distance" varchar,
  	"location" geometry(Point),
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_nearby_amenities_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_price_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"area_from" numeric,
  	"area_to" numeric,
  	"price_from" numeric,
  	"price_to" numeric,
  	"availability" "enum__projects_v_version_price_table_availability",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_price_table_locales" (
  	"unit_type" varchar NOT NULL,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "projects" ADD COLUMN "price_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_price_updated_at" timestamp(3) with time zone;
  ALTER TABLE "projects_highlights" ADD CONSTRAINT "projects_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_highlights_locales" ADD CONSTRAINT "projects_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_nearby_amenities" ADD CONSTRAINT "projects_nearby_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_nearby_amenities_locales" ADD CONSTRAINT "projects_nearby_amenities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_nearby_amenities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_price_table" ADD CONSTRAINT "projects_price_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_price_table_locales" ADD CONSTRAINT "projects_price_table_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_price_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_faqs" ADD CONSTRAINT "projects_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_faqs_locales" ADD CONSTRAINT "projects_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_highlights" ADD CONSTRAINT "_projects_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_highlights_locales" ADD CONSTRAINT "_projects_v_version_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_nearby_amenities" ADD CONSTRAINT "_projects_v_version_nearby_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_nearby_amenities_locales" ADD CONSTRAINT "_projects_v_version_nearby_amenities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_nearby_amenities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_price_table" ADD CONSTRAINT "_projects_v_version_price_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_price_table_locales" ADD CONSTRAINT "_projects_v_version_price_table_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_price_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_faqs" ADD CONSTRAINT "_projects_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_faqs_locales" ADD CONSTRAINT "_projects_v_version_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_highlights_order_idx" ON "projects_highlights" USING btree ("_order");
  CREATE INDEX "projects_highlights_parent_id_idx" ON "projects_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_highlights_locales_locale_parent_id_unique" ON "projects_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_highlights_locales_parent_id_idx" ON "projects_highlights_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_nearby_amenities_order_idx" ON "projects_nearby_amenities" USING btree ("_order");
  CREATE INDEX "projects_nearby_amenities_parent_id_idx" ON "projects_nearby_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_nearby_amenities_locales_locale_parent_id_unique" ON "projects_nearby_amenities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_nearby_amenities_locales_parent_id_idx" ON "projects_nearby_amenities_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_price_table_order_idx" ON "projects_price_table" USING btree ("_order");
  CREATE INDEX "projects_price_table_parent_id_idx" ON "projects_price_table" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_price_table_locales_locale_parent_id_unique" ON "projects_price_table_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_price_table_locales_parent_id_idx" ON "projects_price_table_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_faqs_order_idx" ON "projects_faqs" USING btree ("_order");
  CREATE INDEX "projects_faqs_parent_id_idx" ON "projects_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_faqs_locales_locale_parent_id_unique" ON "projects_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_faqs_locales_parent_id_idx" ON "projects_faqs_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_highlights_order_idx" ON "_projects_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_projects_v_version_highlights_parent_id_idx" ON "_projects_v_version_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_highlights_locales_locale_parent_id_uniq" ON "_projects_v_version_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_highlights_locales_parent_id_idx" ON "_projects_v_version_highlights_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_nearby_amenities_order_idx" ON "_projects_v_version_nearby_amenities" USING btree ("_order");
  CREATE INDEX "_projects_v_version_nearby_amenities_parent_id_idx" ON "_projects_v_version_nearby_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_nearby_amenities_locales_locale_parent_i" ON "_projects_v_version_nearby_amenities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_nearby_amenities_locales_parent_id_idx" ON "_projects_v_version_nearby_amenities_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_price_table_order_idx" ON "_projects_v_version_price_table" USING btree ("_order");
  CREATE INDEX "_projects_v_version_price_table_parent_id_idx" ON "_projects_v_version_price_table" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_price_table_locales_locale_parent_id_uni" ON "_projects_v_version_price_table_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_price_table_locales_parent_id_idx" ON "_projects_v_version_price_table_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_faqs_order_idx" ON "_projects_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_projects_v_version_faqs_parent_id_idx" ON "_projects_v_version_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_faqs_locales_locale_parent_id_unique" ON "_projects_v_version_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_faqs_locales_parent_id_idx" ON "_projects_v_version_faqs_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "projects_highlights" CASCADE;
  DROP TABLE "projects_highlights_locales" CASCADE;
  DROP TABLE "projects_nearby_amenities" CASCADE;
  DROP TABLE "projects_nearby_amenities_locales" CASCADE;
  DROP TABLE "projects_price_table" CASCADE;
  DROP TABLE "projects_price_table_locales" CASCADE;
  DROP TABLE "projects_faqs" CASCADE;
  DROP TABLE "projects_faqs_locales" CASCADE;
  DROP TABLE "_projects_v_version_highlights" CASCADE;
  DROP TABLE "_projects_v_version_highlights_locales" CASCADE;
  DROP TABLE "_projects_v_version_nearby_amenities" CASCADE;
  DROP TABLE "_projects_v_version_nearby_amenities_locales" CASCADE;
  DROP TABLE "_projects_v_version_price_table" CASCADE;
  DROP TABLE "_projects_v_version_price_table_locales" CASCADE;
  DROP TABLE "_projects_v_version_faqs" CASCADE;
  DROP TABLE "_projects_v_version_faqs_locales" CASCADE;
  ALTER TABLE "projects" DROP COLUMN "price_updated_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_price_updated_at";
  DROP TYPE "public"."enum_projects_nearby_amenities_category";
  DROP TYPE "public"."enum_projects_price_table_availability";
  DROP TYPE "public"."enum__projects_v_version_nearby_amenities_category";
  DROP TYPE "public"."enum__projects_v_version_price_table_availability";`)
}
