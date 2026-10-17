import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_wards_type" AS ENUM('phuong', 'xa', 'dac_khu');
  CREATE TABLE "provinces" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"short_name" varchar,
  	"slug" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "wards_legacy_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "wards" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"province_id" uuid NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_wards_type" NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "provinces_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "wards_id" uuid;
  ALTER TABLE "wards_legacy_names" ADD CONSTRAINT "wards_legacy_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wards" ADD CONSTRAINT "wards_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "provinces_code_idx" ON "provinces" USING btree ("code");
  CREATE UNIQUE INDEX "provinces_slug_idx" ON "provinces" USING btree ("slug");
  CREATE INDEX "provinces_sort_order_idx" ON "provinces" USING btree ("sort_order");
  CREATE INDEX "provinces_updated_at_idx" ON "provinces" USING btree ("updated_at");
  CREATE INDEX "provinces_created_at_idx" ON "provinces" USING btree ("created_at");
  CREATE INDEX "wards_legacy_names_order_idx" ON "wards_legacy_names" USING btree ("_order");
  CREATE INDEX "wards_legacy_names_parent_id_idx" ON "wards_legacy_names" USING btree ("_parent_id");
  CREATE INDEX "wards_province_idx" ON "wards" USING btree ("province_id");
  CREATE UNIQUE INDEX "wards_code_idx" ON "wards" USING btree ("code");
  CREATE INDEX "wards_updated_at_idx" ON "wards" USING btree ("updated_at");
  CREATE INDEX "wards_created_at_idx" ON "wards" USING btree ("created_at");
  CREATE UNIQUE INDEX "province_slug_idx" ON "wards" USING btree ("province_id","slug");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provinces_fk" FOREIGN KEY ("provinces_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wards_fk" FOREIGN KEY ("wards_id") REFERENCES "public"."wards"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_provinces_id_idx" ON "payload_locked_documents_rels" USING btree ("provinces_id");
  CREATE INDEX "payload_locked_documents_rels_wards_id_idx" ON "payload_locked_documents_rels" USING btree ("wards_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "provinces" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "wards_legacy_names" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "wards" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "provinces" CASCADE;
  DROP TABLE "wards_legacy_names" CASCADE;
  DROP TABLE "wards" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_provinces_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_wards_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_provinces_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_wards_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "provinces_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "wards_id";
  DROP TYPE "public"."enum_wards_type";`)
}
