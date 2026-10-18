import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Index cho truy vấn quét của job `remind-unassigned-leads` (BR-14, BL-009): `status = 'new'` + `assigned_to_id IS NULL` + `reminded_at IS NULL`
  // + lọc/sắp xếp `created_at` (btree coi IS NULL là điều kiện index). Khai ở `Leads.indexes` nên tên do Payload sinh.
  // Không CONCURRENTLY: runner migration của @payloadcms/drizzle chạy trong transaction; bảng `leads` nhỏ lúc deploy nên khoá ghi ngắn.
  // Nếu `leads` đã rất lớn (~1 triệu dòng trở lên) khi deploy: tạo tay trước bằng `CREATE INDEX CONCURRENTLY` cùng tên/cột, câu dưới thành no-op.
  await db.execute(sql`
   CREATE INDEX IF NOT EXISTS "status_assignedTo_remindedAt_createdAt_idx" ON "leads" USING btree ("status","assigned_to_id","reminded_at","created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "status_assignedTo_remindedAt_createdAt_idx";`)
}
