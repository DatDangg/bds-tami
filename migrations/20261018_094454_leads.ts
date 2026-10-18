import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Mã lead LD-000001 (hook assignLeadCode): sequence không bị cấp lại kể cả khi transaction rollback.
  CREATE SEQUENCE IF NOT EXISTS "leads_code_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE;
  CREATE TYPE "public"."enum_leads_source" AS ENUM('rental', 'property_post', 'project', 'contact');
  CREATE TYPE "public"."enum_leads_locale" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'contacted', 'consulting', 'won', 'lost', 'spam');
  CREATE TYPE "public"."enum_lead_activities_type" AS ENUM('note', 'call', 'status_change', 'assignment', 'merged', 'email_sent');
  CREATE TYPE "public"."enum_lead_activities_from_status" AS ENUM('new', 'contacted', 'consulting', 'won', 'lost', 'spam');
  CREATE TYPE "public"."enum_lead_activities_to_status" AS ENUM('new', 'contacted', 'consulting', 'won', 'lost', 'spam');
  CREATE TABLE "leads" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"source" "enum_leads_source" NOT NULL,
  	"rental_id" uuid,
  	"property_post_id" uuid,
  	"project_id" uuid,
  	"full_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"phone_normalized" varchar NOT NULL,
  	"email" varchar,
  	"message" varchar,
  	"locale" "enum_leads_locale" NOT NULL,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"lost_reason" varchar,
  	"assigned_to_id" uuid,
  	"assigned_at" timestamp(3) with time zone,
  	"first_contacted_at" timestamp(3) with time zone,
  	"last_activity_at" timestamp(3) with time zone,
  	"merged_count" numeric DEFAULT 0,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"consent_version" varchar NOT NULL,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_term" varchar,
  	"utm_content" varchar,
  	"page_url" varchar,
  	"referrer" varchar,
  	"ip_hash" varchar,
  	"user_agent" varchar,
  	"anonymized_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "lead_activities" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"lead_id" uuid NOT NULL,
  	"type" "enum_lead_activities_type" DEFAULT 'note' NOT NULL,
  	"content" varchar,
  	"from_status" "enum_lead_activities_from_status",
  	"to_status" "enum_lead_activities_to_status",
  	"from_assignee_id" uuid,
  	"to_assignee_id" uuid,
  	"actor_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lead_activities_id" uuid;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_property_post_id_property_posts_id_fk" FOREIGN KEY ("property_post_id") REFERENCES "public"."property_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_staff_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_from_assignee_id_staff_id_fk" FOREIGN KEY ("from_assignee_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_to_assignee_id_staff_id_fk" FOREIGN KEY ("to_assignee_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_id_staff_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "leads_code_idx" ON "leads" USING btree ("code");
  CREATE INDEX "leads_source_idx" ON "leads" USING btree ("source");
  CREATE INDEX "leads_rental_idx" ON "leads" USING btree ("rental_id");
  CREATE INDEX "leads_property_post_idx" ON "leads" USING btree ("property_post_id");
  CREATE INDEX "leads_project_idx" ON "leads" USING btree ("project_id");
  CREATE INDEX "leads_phone_normalized_idx" ON "leads" USING btree ("phone_normalized");
  CREATE INDEX "leads_locale_idx" ON "leads" USING btree ("locale");
  CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");
  CREATE INDEX "leads_assigned_to_idx" ON "leads" USING btree ("assigned_to_id");
  CREATE INDEX "leads_last_activity_at_idx" ON "leads" USING btree ("last_activity_at");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "leads_deleted_at_idx" ON "leads" USING btree ("deleted_at");
  CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("lead_id");
  CREATE INDEX "lead_activities_from_assignee_idx" ON "lead_activities" USING btree ("from_assignee_id");
  CREATE INDEX "lead_activities_to_assignee_idx" ON "lead_activities" USING btree ("to_assignee_id");
  CREATE INDEX "lead_activities_actor_idx" ON "lead_activities" USING btree ("actor_id");
  CREATE INDEX "lead_activities_updated_at_idx" ON "lead_activities" USING btree ("updated_at");
  CREATE INDEX "lead_activities_created_at_idx" ON "lead_activities" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_activities_fk" FOREIGN KEY ("lead_activities_id") REFERENCES "public"."lead_activities"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_lead_activities_id_idx" ON "payload_locked_documents_rels" USING btree ("lead_activities_id");
  -- ERD §5 (Payload không khai báo được thứ tự DESC): chống trùng BR-15 và danh sách lead trong admin.
  CREATE INDEX "leads_phone_source_created_idx" ON "leads" USING btree ("phone_normalized", "source", "created_at" DESC);
  CREATE INDEX "leads_status_assignee_created_idx" ON "leads" USING btree ("status", "assigned_to_id", "created_at" DESC);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // IF EXISTS để chạy lặp được: DROP TABLE ... CASCADE đã kéo theo các FK của bảng khác trỏ vào nó.
  await db.execute(sql`
  DROP TABLE IF EXISTS "lead_activities" CASCADE;
  DROP TABLE IF EXISTS "leads" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_leads_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lead_activities_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_leads_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_lead_activities_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "leads_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lead_activities_id";
  DROP TYPE IF EXISTS "public"."enum_leads_source";
  DROP TYPE IF EXISTS "public"."enum_leads_locale";
  DROP TYPE IF EXISTS "public"."enum_leads_status";
  DROP TYPE IF EXISTS "public"."enum_lead_activities_type";
  DROP TYPE IF EXISTS "public"."enum_lead_activities_from_status";
  DROP TYPE IF EXISTS "public"."enum_lead_activities_to_status";
  DROP SEQUENCE IF EXISTS "leads_code_seq";`)
}
