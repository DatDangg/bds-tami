import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rentals_amenities" AS ENUM('pool', 'gym', 'elevator', 'parking', 'security', 'balcony', 'washing_machine', 'air_conditioner', 'pet_friendly', 'kitchen');
  CREATE TYPE "public"."enum__rentals_v_version_amenities" AS ENUM('pool', 'gym', 'elevator', 'parking', 'security', 'balcony', 'washing_machine', 'air_conditioner', 'pet_friendly', 'kitchen');
  CREATE TABLE "rentals_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_rentals_amenities",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_rentals_v_version_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__rentals_v_version_amenities",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  ALTER TABLE "rentals_amenities" ADD CONSTRAINT "rentals_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rentals_v_version_amenities" ADD CONSTRAINT "_rentals_v_version_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_rentals_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rentals_amenities_order_idx" ON "rentals_amenities" USING btree ("order");
  CREATE INDEX "rentals_amenities_parent_idx" ON "rentals_amenities" USING btree ("parent_id");
  CREATE INDEX "rentals_amenities_value_idx" ON "rentals_amenities" USING btree ("value");
  CREATE INDEX "_rentals_v_version_amenities_order_idx" ON "_rentals_v_version_amenities" USING btree ("order");
  CREATE INDEX "_rentals_v_version_amenities_parent_idx" ON "_rentals_v_version_amenities" USING btree ("parent_id");
  CREATE INDEX "_rentals_v_version_amenities_value_idx" ON "_rentals_v_version_amenities" USING btree ("value");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "rentals_amenities" CASCADE;
  DROP TABLE "_rentals_v_version_amenities" CASCADE;
  DROP TYPE "public"."enum_rentals_amenities";
  DROP TYPE "public"."enum__rentals_v_version_amenities";`)
}
