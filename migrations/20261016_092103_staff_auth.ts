import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_staff_role" AS ENUM('admin', 'sale');
  ALTER TABLE "staff" ADD COLUMN "full_name" varchar NOT NULL;
  ALTER TABLE "staff" ADD COLUMN "phone" varchar;
  ALTER TABLE "staff" ADD COLUMN "role" "enum_staff_role" DEFAULT 'sale' NOT NULL;
  ALTER TABLE "staff" ADD COLUMN "active" boolean DEFAULT true NOT NULL;
  ALTER TABLE "staff" ADD COLUMN "last_login_at" timestamp(3) with time zone;
  CREATE INDEX "staff_role_idx" ON "staff" USING btree ("role");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "staff_role_idx";
  ALTER TABLE "staff" DROP COLUMN "full_name";
  ALTER TABLE "staff" DROP COLUMN "phone";
  ALTER TABLE "staff" DROP COLUMN "role";
  ALTER TABLE "staff" DROP COLUMN "active";
  ALTER TABLE "staff" DROP COLUMN "last_login_at";
  DROP TYPE "public"."enum_staff_role";`)
}
