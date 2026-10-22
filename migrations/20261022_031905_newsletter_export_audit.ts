import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// BL-054 P1-T04: chỉ thêm giá trị enum hành động audit `newsletter.export` (additive, không đụng dữ liệu).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE IF NOT EXISTS 'newsletter.export';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Cố ý không làm gì (như `20261018_130000_data_retention`): dựng lại enum bằng cast sẽ lỗi nếu đã có dòng `newsletter.export`,
  // và các dòng đó là vết của những lần xuất dữ liệu cá nhân nên phải còn sau rollback. Postgres không bỏ được giá trị enum;
  // giữ lại vô hại (code cũ chỉ hiển thị chuỗi). Chạy lại up vẫn đúng nhờ ADD VALUE IF NOT EXISTS.
  await db.execute(sql`SELECT 1;`)
}
