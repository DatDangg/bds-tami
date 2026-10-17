import { getEnv } from "@/lib/env";

// Route tĩnh `/api/monitoring-config` được Next ưu tiên hơn catch-all `/api/[...slug]` của Payload.
export const dynamic = "force-dynamic";

/**
 * Cấu hình GlitchTip cho trình duyệt, đọc LÚC CHẠY (không `NEXT_PUBLIC_*`: Next nhúng chúng lúc build, mà cùng một
 * image được promote staging -> prod nên environment/DSN phải theo container). DSN trình duyệt vốn công khai.
 * Cache ngắn để mỗi lượt xem trang không tốn thêm request tới server.
 */
export function GET(): Response {
  const env = getEnv();
  return Response.json(
    { dsn: env.GLITCHTIP_PUBLIC_DSN ?? null, environment: env.APP_ENV },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
