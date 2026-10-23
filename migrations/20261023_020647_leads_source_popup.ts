import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Chỉ thêm giá trị enum (additive): nguồn lead `popup` (popup "Nhận tư vấn", BL-066). Không đổi bảng, không backfill.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_leads_source" ADD VALUE IF NOT EXISTS 'popup';`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op có chủ ý: Postgres không có DROP VALUE cho enum. Dựng lại enum bằng cast sẽ lỗi nếu còn lead mang nguồn `popup`,
  // còn xoá/đổi nguồn lead khách đã gửi là mất dữ liệu. Giá trị thừa vô hại; chạy lại up vẫn đúng nhờ ADD VALUE IF NOT EXISTS.
}
