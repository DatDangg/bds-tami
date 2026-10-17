import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "job_applications" ALTER COLUMN "cv_id" DROP NOT NULL;`)
}

// Dev rollback only: SET NOT NULL fails if rows with cv_id NULL exist (cv_id is NULL only after anonymisation, when data-retention deletes the CV).
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "job_applications" ALTER COLUMN "cv_id" SET NOT NULL;`)
}
