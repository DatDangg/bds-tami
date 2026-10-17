/**
 * `prodMigrations` của adapter Postgres: adapter chạy danh sách này lúc connect khi NODE_ENV=production, nên
 * app và jobs sẽ đua nhau migrate nếu luôn bật. Mặc định tắt (migrate là bước riêng của pipeline deploy,
 * ARCHITECTURE §6.4); chỉ bật khi AUTO_MIGRATE_ON_START=true (môi trường 1 container).
 */
export function resolveProdMigrations<Migration>(
  autoMigrateOnStart: string | undefined,
  migrations: Migration[],
): Migration[] | undefined {
  return autoMigrateOnStart === "true" ? migrations : undefined;
}
