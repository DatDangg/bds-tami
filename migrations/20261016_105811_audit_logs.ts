import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('lead.assign', 'lead.export', 'content.delete', 'content.restore', 'content.purge', 'staff.create', 'staff.reset_password', 'staff.update_role', 'staff.deactivate', 'staff.activate', 'staff.delete', 'auth.login_failed', 'application.view_cv', 'content.retranslate', 'content.approve_translation');
  CREATE TABLE "audit_logs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"actor_id" uuid,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"collection" varchar,
  	"doc_id" varchar,
  	"summary" varchar NOT NULL,
  	"meta" jsonb,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" uuid;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_staff_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "collection_docId_idx" ON "audit_logs" USING btree ("collection","doc_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "audit_logs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "audit_logs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_audit_logs_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "audit_logs_id";
  DROP TYPE IF EXISTS "public"."enum_audit_logs_action";`)
}
