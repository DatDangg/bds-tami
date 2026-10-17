import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

import { recordRequestError } from "@/lib/monitoring/metrics";

export async function register(): Promise<void> {
  // Edge runtime: app không có route/proxy chạy ở edge (proxy.ts chạy Node), nên chỉ cấu hình Node.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("../sentry.server.config");
  const { installProcessErrorHandlers } = await import("@/lib/monitoring/process-errors");
  installProcessErrorHandlers();
}

/** Mọi lỗi Next bắt được (render, route handler, server action): đếm metrics + gửi GlitchTip (no-op khi không có DSN). */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  recordRequestError(context.routeType);
  Sentry.captureRequestError(error, request, context);
};
