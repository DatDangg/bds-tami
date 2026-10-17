import { getEnv } from "@/lib/env";
import { PROMETHEUS_CONTENT_TYPE, renderPrometheusMetrics } from "@/lib/monitoring/metrics";
import { isValidMetricsToken } from "@/lib/monitoring/metrics-auth";

// Route tĩnh `/api/metrics` được Next ưu tiên hơn catch-all `/api/[...slug]` của Payload.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Metrics cho Prometheus. Chỉ phục vụ khi có `METRICS_TOKEN` và request mang đúng Bearer token:
 *  - chưa cấu hình token → 404 (coi như không tồn tại);
 *  - thiếu/sai token → 401.
 * Lớp thứ hai nằm ngoài app: Nginx không được proxy đường `/api/metrics` ra Internet (scrape qua 127.0.0.1/network nội bộ).
 */
export async function GET(request: Request): Promise<Response> {
  const token = getEnv().METRICS_TOKEN;
  if (!token) return new Response("Not Found", { status: 404, headers: NO_STORE });
  if (!isValidMetricsToken(request.headers.get("authorization"), token)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { ...NO_STORE, "WWW-Authenticate": 'Bearer realm="metrics"' },
    });
  }
  return new Response(renderPrometheusMetrics(), {
    headers: { ...NO_STORE, "Content-Type": PROMETHEUS_CONTENT_TYPE },
  });
}
