import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "translation_usage" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"month" varchar NOT NULL,
  	"input_tokens" numeric DEFAULT 0 NOT NULL,
  	"output_tokens" numeric DEFAULT 0 NOT NULL,
  	"requests" numeric DEFAULT 0 NOT NULL,
  	"estimated_cost_usd" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "translation_usage_id" uuid;
  CREATE UNIQUE INDEX "translation_usage_month_idx" ON "translation_usage" USING btree ("month");
  CREATE INDEX "translation_usage_updated_at_idx" ON "translation_usage" USING btree ("updated_at");
  CREATE INDEX "translation_usage_created_at_idx" ON "translation_usage" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_translation_usage_fk" FOREIGN KEY ("translation_usage_id") REFERENCES "public"."translation_usage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_translation_usage_id_idx" ON "payload_locked_documents_rels" USING btree ("translation_usage_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "translation_usage" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "translation_usage" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_translation_usage_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_translation_usage_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "translation_usage_id";`)
}
