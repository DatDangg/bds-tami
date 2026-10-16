// Nạp .env.local cho test (Next/@next/env bỏ qua .env.local khi NODE_ENV=test). Thiếu file thì thôi:
// CI truyền biến qua môi trường. Biến đã có trong môi trường không bị ghi đè.
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
