import { logger } from "@/lib/logger";

const GUARD_KEY = Symbol.for("tami.processErrorHandlersInstalled");
const globalWithGuard = globalThis as typeof globalThis & { [GUARD_KEY]?: boolean };

/**
 * Chặn crash do `unhandledRejection` (Node >= 15 mặc định thoát process). Nguyên nhân thực tế: lúc DB sập,
 * `getPayload` / adapter Postgres sinh rejection không ai bắt (spec-validation layer 2, G4). Web app và jobs
 * phải sống để Docker healthcheck/Uptime Kuma báo đúng trạng thái và tự hồi phục khi DB về.
 *
 * Chỉ ghi log (JSON, có redact) — KHÔNG gọi Sentry ở đây: khi có DSN, `onUnhandledRejectionIntegration` của SDK
 * đã tự gửi GlitchTip, gọi thêm sẽ báo trùng. KHÔNG xử lý `uncaughtException`: trạng thái process không còn đáng tin,
 * để Node thoát (SDK flush lỗi trước khi thoát) và Docker khởi động lại.
 */
export function installProcessErrorHandlers(): void {
  if (globalWithGuard[GUARD_KEY]) return;
  globalWithGuard[GUARD_KEY] = true;
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason instanceof Error ? reason : new Error(String(reason)) }, "unhandledRejection (process vẫn chạy)");
  });
}
