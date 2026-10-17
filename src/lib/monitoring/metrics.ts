/**
 * Metrics Prometheus tự viết (không thêm prom-client): chỉ cần histogram + counter + vài gauge.
 * Trạng thái nằm trên globalThis vì Next có thể nạp module này nhiều lần (bundle route, instrumentation, dev reload).
 *
 * Giới hạn đo (Next app router không có hook "request kết thúc" toàn cục):
 *  - Thời gian phản hồi + 5xx: chỉ các route đã bọc `withRequestMetrics` (REST của Payload, health; `/api/metrics` và `/api/monitoring-config` không bọc).
 *  - Lỗi render trang / route handler ném lỗi chưa bọc: đếm qua `onRequestError` (`recordRequestError`).
 *  - Latency trang public (SSR): dùng `upstream_response_time` của Nginx (access log -> Loki).
 */
export const DURATION_BUCKETS_SECONDS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] as const;

export const PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  options?: { max?: number };
}

interface DurationSeries {
  bucketCounts: number[];
  count: number;
  sum: number;
}

interface MetricsState {
  durations: Map<string, DurationSeries>;
  requests: Map<string, number>;
  requestErrors: Map<string, number>;
  pool?: PoolStats;
}

const STATE_KEY = Symbol.for("tami.metrics.state");
const globalWithState = globalThis as typeof globalThis & { [STATE_KEY]?: MetricsState };

function getState(): MetricsState {
  globalWithState[STATE_KEY] ??= {
    durations: new Map(),
    requests: new Map(),
    requestErrors: new Map(),
  };
  return globalWithState[STATE_KEY];
}

/** Xoá toàn bộ số đo (chỉ dùng trong test). */
export function resetMetrics(): void {
  globalWithState[STATE_KEY] = undefined;
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function labelString(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(",");
}

function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/** `route` là nhãn cố định do code đặt (không dùng URL thật) để tránh bùng nổ số series. */
export function recordHttpRequest(input: { route: string; method: string; status: number; durationSeconds: number }): void {
  const state = getState();
  const labels = labelString({ route: input.route, method: input.method });
  increment(state.requests, `${labels},status_class="${statusClass(input.status)}"`);
  const series = state.durations.get(labels) ?? {
    bucketCounts: DURATION_BUCKETS_SECONDS.map(() => 0),
    count: 0,
    sum: 0,
  };
  DURATION_BUCKETS_SECONDS.forEach((upperBound, index) => {
    if (input.durationSeconds <= upperBound) series.bucketCounts[index] = (series.bucketCounts[index] ?? 0) + 1;
  });
  series.count += 1;
  series.sum += input.durationSeconds;
  state.durations.set(labels, series);
}

/** Lỗi do Next báo qua `onRequestError` (render, route handler, server action, proxy). */
export function recordRequestError(routeType: string): void {
  increment(getState().requestErrors, labelString({ route_type: routeType }));
}

/** Gọi từ `onInit` của Payload: pool pg của adapter, dùng để xuất số kết nối DB. */
export function registerDbPool(pool: PoolStats | undefined): void {
  getState().pool = pool;
}

function metricHeader(lines: string[], name: string, help: string, type: string): void {
  lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`);
}

function renderHistogram(lines: string[], state: MetricsState): void {
  const name = "tami_http_request_duration_seconds";
  metricHeader(lines, name, "Thoi gian phan hoi cua cac route da boc withRequestMetrics.", "histogram");
  for (const [labels, series] of state.durations) {
    DURATION_BUCKETS_SECONDS.forEach((upperBound, index) => {
      lines.push(`${name}_bucket{${labels},le="${upperBound}"} ${series.bucketCounts[index] ?? 0}`);
    });
    lines.push(`${name}_bucket{${labels},le="+Inf"} ${series.count}`);
    lines.push(`${name}_sum{${labels}} ${series.sum}`, `${name}_count{${labels}} ${series.count}`);
  }
}

function renderCounters(lines: string[], state: MetricsState): void {
  metricHeader(lines, "tami_http_requests_total", "So request theo route, method va lop status (5xx = loi server).", "counter");
  for (const [labels, value] of state.requests) lines.push(`tami_http_requests_total{${labels}} ${value}`);
  metricHeader(lines, "tami_request_errors_total", "Loi Next bao qua onRequestError (render, route handler, action).", "counter");
  for (const [labels, value] of state.requestErrors) lines.push(`tami_request_errors_total{${labels}} ${value}`);
}

function renderPool(lines: string[], pool: PoolStats | undefined): void {
  if (!pool) return;
  const gauges: [string, string, number | undefined][] = [
    ["tami_db_pool_connections", "Tong ket noi trong pool DB cua Payload.", pool.totalCount],
    ["tami_db_pool_idle_connections", "Ket noi nhan roi trong pool DB.", pool.idleCount],
    ["tami_db_pool_waiting_clients", "Truy van dang cho ket noi DB (pool can).", pool.waitingCount],
    ["tami_db_pool_max_connections", "So ket noi toi da cua pool DB.", pool.options?.max],
  ];
  for (const [name, help, value] of gauges) {
    if (value === undefined) continue;
    metricHeader(lines, name, help, "gauge");
    lines.push(`${name} ${value}`);
  }
}

function renderProcess(lines: string[]): void {
  const memory = process.memoryUsage();
  metricHeader(lines, "tami_process_uptime_seconds", "Thoi gian process da chay.", "gauge");
  lines.push(`tami_process_uptime_seconds ${Math.round(process.uptime())}`);
  metricHeader(lines, "tami_process_resident_memory_bytes", "RSS cua process.", "gauge");
  lines.push(`tami_process_resident_memory_bytes ${memory.rss}`);
  metricHeader(lines, "tami_process_heap_used_bytes", "Heap V8 dang dung.", "gauge");
  lines.push(`tami_process_heap_used_bytes ${memory.heapUsed}`);
}

/** Xuất toàn bộ metrics theo Prometheus text exposition format 0.0.4 (HELP viết không dấu cho an toàn ký tự). */
export function renderPrometheusMetrics(): string {
  const state = getState();
  const lines: string[] = [];
  renderHistogram(lines, state);
  renderCounters(lines, state);
  renderPool(lines, state.pool);
  renderProcess(lines);
  return `${lines.join("\n")}\n`;
}

/**
 * Bọc route handler để đo thời gian + status. Handler ném lỗi thì ghi 500 rồi ném lại nguyên vẹn
 * (Next và `onRequestError` vẫn xử lý như cũ).
 */
export function withRequestMetrics<Args extends unknown[]>(
  route: string,
  handler: (request: Request, ...args: Args) => Promise<Response> | Response,
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    const startedAt = performance.now();
    const record = (status: number) =>
      recordHttpRequest({ route, method: request.method, status, durationSeconds: (performance.now() - startedAt) / 1000 });
    try {
      const response = await handler(request, ...args);
      record(response.status);
      return response;
    } catch (error) {
      record(500);
      throw error;
    }
  };
}
