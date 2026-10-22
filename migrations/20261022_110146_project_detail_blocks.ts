import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "projects_amenities_image_idx";
  ALTER TABLE "projects_amenities" ADD COLUMN "image_id" uuid;
  ALTER TABLE "projects" ADD COLUMN "location_media_image_id" uuid;
  ALTER TABLE "projects" ADD COLUMN "location_media_video_url" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "location_media_title" varchar;
  ALTER TABLE "_projects_v_version_amenities" ADD COLUMN "image_id" uuid;
  ALTER TABLE "_projects_v" ADD COLUMN "version_location_media_image_id" uuid;
  ALTER TABLE "_projects_v" ADD COLUMN "version_location_media_video_url" varchar;
  ALTER TABLE "_projects_v_locales" ADD COLUMN "version_location_media_title" varchar;
  ALTER TABLE "projects_amenities" ADD CONSTRAINT "projects_amenities_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_location_media_image_id_media_id_fk" FOREIGN KEY ("location_media_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_amenities" ADD CONSTRAINT "_projects_v_version_amenities_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_location_media_image_id_media_id_fk" FOREIGN KEY ("version_location_media_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_amenities_image_idx" ON "projects_amenities" USING btree ("image_id");
  CREATE INDEX "projects_location_media_location_media_image_idx" ON "projects" USING btree ("location_media_image_id");
  CREATE INDEX "projects_amenities_image_1_idx" ON "projects" USING btree ("amenities_image_id");
  CREATE INDEX "_projects_v_version_amenities_image_idx" ON "_projects_v_version_amenities" USING btree ("image_id");
  CREATE INDEX "_projects_v_version_location_media_version_location_medi_idx" ON "_projects_v" USING btree ("version_location_media_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_amenities" DROP CONSTRAINT "projects_amenities_image_id_media_id_fk";
  
  ALTER TABLE "projects" DROP CONSTRAINT "projects_location_media_image_id_media_id_fk";
  
  ALTER TABLE "_projects_v_version_amenities" DROP CONSTRAINT "_projects_v_version_amenities_image_id_media_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_location_media_image_id_media_id_fk";
  
  DROP INDEX "projects_amenities_image_idx";
  DROP INDEX "projects_location_media_location_media_image_idx";
  DROP INDEX "projects_amenities_image_1_idx";
  DROP INDEX "_projects_v_version_amenities_image_idx";
  DROP INDEX "_projects_v_version_location_media_version_location_medi_idx";
  CREATE INDEX "projects_amenities_image_idx" ON "projects" USING btree ("amenities_image_id");
  ALTER TABLE "projects_amenities" DROP COLUMN "image_id";
  ALTER TABLE "projects" DROP COLUMN "location_media_image_id";
  ALTER TABLE "projects" DROP COLUMN "location_media_video_url";
  ALTER TABLE "projects_locales" DROP COLUMN "location_media_title";
  ALTER TABLE "_projects_v_version_amenities" DROP COLUMN "image_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_location_media_image_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_location_media_video_url";
  ALTER TABLE "_projects_v_locales" DROP COLUMN "version_location_media_title";`)
}
