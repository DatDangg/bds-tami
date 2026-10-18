import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- pg_trgm là extension "trusted" (PG13+) có sẵn trong contrib của image postgis/postgis: chủ database tạo được, không cần superuser.
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  -- Tìm từ khoá (ERD §5, §6): searchText đã được chuẩn hoá ở app (không dấu, chữ thường) nên LIKE '%từ%' dùng thẳng index trigram, không cần unaccent.
  -- Tạo trên bảng rỗng lúc build; trên dữ liệu lớn về sau dùng CREATE INDEX CONCURRENTLY (không chạy được trong transaction của migration).
  CREATE INDEX IF NOT EXISTS "rentals_locales_search_text_trgm_idx" ON "rentals_locales" USING gin ("search_text" gin_trgm_ops);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Không DROP EXTENSION pg_trgm: DB dev đã có sẵn và migration khác/lệnh khác có thể dùng; chỉ gỡ thứ migration này tạo.
  await db.execute(sql`
  DROP INDEX IF EXISTS "rentals_locales_search_text_trgm_idx";`)
}
