// Next 16 + Turbopack nạp file này ở trình duyệt (thay `sentry.client.config.ts` kiểu cũ). Chạy ở mọi trang,
// kể cả /admin: lỗi giao diện của nhân viên cũng cần lên GlitchTip (đã lọc PII trong `beforeSend`).
// DSN + environment lấy LÚC CHẠY từ /api/monitoring-config (không nhúng lúc build, xem route đó).
// Không DSN → không tải SDK Sentry (bundle trình duyệt không chứa SDK), không gọi ra ngoài.
import { initSentryIfConfigured } from "@/lib/monitoring/sentry-options";

interface ClientMonitoringConfig {
  dsn: string | null;
  environment: string;
}

async function startClientMonitoring(): Promise<void> {
  const response = await fetch("/api/monitoring-config", { credentials: "omit" });
  if (!response.ok) return;
  const config = (await response.json()) as ClientMonitoringConfig;
  if (!config.dsn) return;
  const Sentry = await import("@sentry/nextjs");
  initSentryIfConfigured(
    Sentry.init,
    { dsn: config.dsn, environment: config.environment },
    {
      // Chỉ thu lỗi: bỏ tracing/performance của trình duyệt (giảm tải và không gửi URL điều hướng).
      integrations: (defaults) => defaults.filter((integration) => integration.name !== "BrowserTracing"),
    },
  );
}

// Chạy khi trình duyệt rảnh để không cạnh tranh với hydrate; giám sát lỗi không được làm hỏng trang.
const runWhenIdle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1_000));
runWhenIdle(() => {
  startClientMonitoring().catch(() => undefined);
});
