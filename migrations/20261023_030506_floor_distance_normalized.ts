import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { parseLegacyDistance, parseLegacyFloor } from '../src/lib/units/legacy-parse'

/**
 * HIGH_RISK_MIGRATION (chỉ vì backfill 4 bảng: rentals, _rentals_v, projects_nearby_amenities, _projects_v_version_nearby_amenities). Vẫn additive:
 * CREATE TYPE + ADD COLUMN nullable; backfill chỉ ghi cột mới khi còn NULL (idempotent); cột cũ không đụng; rollback = `down` (drop cột/enum mới).
 * Bắt buộc chạy + verify trên staging (đo thời gian backfill) trước khi promote prod.
 * BL-065: chuẩn hoá "Tầng" (rentals) và "Khoảng cách" (projects.nearbyAmenities) thành mã + số, nhãn dựng theo ngôn ngữ ở web.
 * ADDITIVE: chỉ ADD COLUMN nullable + CREATE TYPE; backfill CHỈ ghi vào cột mới và chỉ khi cột mới còn NULL (chạy lại không đè).
 * Cột cũ (`rentals.floor`, `_rentals_v.version_floor`, `*.distance`) giữ nguyên, không UPDATE/DROP.
 * Giá trị cũ không parse được (vd "3.4.5.6") KHÔNG đoán: được in ra log (bảng + id + giá trị) và admin sửa tay qua ô "(giá trị cũ)".
 */

type Row = { id: string | number; legacy: string | null }
type Executor = MigrateUpArgs['db']

const rowsOf = (result: unknown): Row[] => (result as { rows: Row[] }).rows

async function backfillFloors(db: Executor, table: string, legacyColumn: string, levelColumn: string, numberColumn: string, levelType: string): Promise<void> {
  const rows = rowsOf(
    await db.execute(sql`SELECT "id" AS "id", ${sql.raw(`"${legacyColumn}"`)} AS "legacy" FROM ${sql.raw(`"${table}"`)} WHERE ${sql.raw(`"${legacyColumn}"`)} IS NOT NULL AND ${sql.raw(`"${levelColumn}"`)} IS NULL AND ${sql.raw(`"${numberColumn}"`)} IS NULL ORDER BY "id"`),
  )
  const counts = { level: 0, number: 0, empty: 0, unparsed: 0 }
  for (const { id, legacy } of rows) {
    const parsed = parseLegacyFloor(legacy)
    if (parsed.kind === 'level') {
      await db.execute(sql`UPDATE ${sql.raw(`"${table}"`)} SET ${sql.raw(`"${levelColumn}"`)} = ${parsed.level}::${sql.raw(`"public"."${levelType}"`)} WHERE "id" = ${id}`)
      counts.level += 1
    } else if (parsed.kind === 'number') {
      await db.execute(sql`UPDATE ${sql.raw(`"${table}"`)} SET ${sql.raw(`"${numberColumn}"`)} = ${parsed.number} WHERE "id" = ${id}`)
      counts.number += 1
    } else if (parsed.kind === 'empty') {
      counts.empty += 1
    } else {
      counts.unparsed += 1
      console.warn(`[BL-065] ${table}.${legacyColumn} không parse được — id=${id} giá trị=${JSON.stringify(legacy)}`)
    }
  }
  console.info(`[BL-065] ${table}: mức tầng ${counts.level}, số tầng ${counts.number}, rỗng ${counts.empty}, không parse được ${counts.unparsed}`)
}

async function backfillDistances(db: Executor, table: string): Promise<void> {
  const rows = rowsOf(
    await db.execute(sql`SELECT "id" AS "id", "distance" AS "legacy" FROM ${sql.raw(`"${table}"`)} WHERE "distance" IS NOT NULL AND "distance_value" IS NULL AND "distance_unit" IS NULL ORDER BY "id"`),
  )
  const unitType = table.startsWith('_projects_v') ? 'enum__projects_v_version_nearby_amenities_distance_unit' : 'enum_projects_nearby_amenities_distance_unit'
  const counts = { ok: 0, empty: 0, unparsed: 0 }
  for (const { id, legacy } of rows) {
    const parsed = parseLegacyDistance(legacy)
    if (parsed.kind === 'ok') {
      await db.execute(sql`UPDATE ${sql.raw(`"${table}"`)} SET "distance_value" = ${parsed.value}, "distance_unit" = ${parsed.unit}::${sql.raw(`"public"."${unitType}"`)} WHERE "id" = ${id}`)
      counts.ok += 1
    } else if (parsed.kind === 'empty') {
      counts.empty += 1
    } else {
      counts.unparsed += 1
      console.warn(`[BL-065] ${table}.distance không parse được — id=${id} giá trị=${JSON.stringify(legacy)}`)
    }
  }
  console.info(`[BL-065] ${table}: chuyển được ${counts.ok}, rỗng ${counts.empty}, không parse được ${counts.unparsed}`)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_nearby_amenities_distance_unit" AS ENUM('km', 'm', 'min');
  CREATE TYPE "public"."enum__projects_v_version_nearby_amenities_distance_unit" AS ENUM('km', 'm', 'min');
  CREATE TYPE "public"."enum_rentals_floor_level" AS ENUM('high', 'mid', 'low');
  CREATE TYPE "public"."enum__rentals_v_version_floor_level" AS ENUM('high', 'mid', 'low');
  ALTER TABLE "projects_nearby_amenities" ADD COLUMN "distance_value" numeric;
  ALTER TABLE "projects_nearby_amenities" ADD COLUMN "distance_unit" "enum_projects_nearby_amenities_distance_unit";
  ALTER TABLE "_projects_v_version_nearby_amenities" ADD COLUMN "distance_value" numeric;
  ALTER TABLE "_projects_v_version_nearby_amenities" ADD COLUMN "distance_unit" "enum__projects_v_version_nearby_amenities_distance_unit";
  ALTER TABLE "rentals" ADD COLUMN "floor_level" "enum_rentals_floor_level";
  ALTER TABLE "rentals" ADD COLUMN "floor_number" numeric;
  ALTER TABLE "_rentals_v" ADD COLUMN "version_floor_level" "enum__rentals_v_version_floor_level";
  ALTER TABLE "_rentals_v" ADD COLUMN "version_floor_number" numeric;`)

  await backfillFloors(db, 'rentals', 'floor', 'floor_level', 'floor_number', 'enum_rentals_floor_level')
  await backfillFloors(db, '_rentals_v', 'version_floor', 'version_floor_level', 'version_floor_number', 'enum__rentals_v_version_floor_level')
  await backfillDistances(db, 'projects_nearby_amenities')
  await backfillDistances(db, '_projects_v_version_nearby_amenities')
}

/**
 * Chỉ DROP cột/enum mới: mất dữ liệu dẫn xuất từ cột cũ và những giá trị admin nhập vào cột mới sau migration. Cột cũ còn nguyên nên
 * dữ liệu gốc không mất; giá trị admin đã sửa tay trong cột cũ (nếu có) không bị đụng.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_nearby_amenities" DROP COLUMN "distance_value";
  ALTER TABLE "projects_nearby_amenities" DROP COLUMN "distance_unit";
  ALTER TABLE "_projects_v_version_nearby_amenities" DROP COLUMN "distance_value";
  ALTER TABLE "_projects_v_version_nearby_amenities" DROP COLUMN "distance_unit";
  ALTER TABLE "rentals" DROP COLUMN "floor_level";
  ALTER TABLE "rentals" DROP COLUMN "floor_number";
  ALTER TABLE "_rentals_v" DROP COLUMN "version_floor_level";
  ALTER TABLE "_rentals_v" DROP COLUMN "version_floor_number";
  DROP TYPE "public"."enum_projects_nearby_amenities_distance_unit";
  DROP TYPE "public"."enum__projects_v_version_nearby_amenities_distance_unit";
  DROP TYPE "public"."enum_rentals_floor_level";
  DROP TYPE "public"."enum__rentals_v_version_floor_level";`)
}
