import { beforeEach, describe, expect, it } from "vitest";

import { isValidMetricsToken } from "./metrics-auth";
import {
  recordHttpRequest,
  recordRequestError,
  registerDbPool,
  renderPrometheusMetrics,
  resetMetrics,
  withRequestMetrics,
} from "./metrics";

beforeEach(() => resetMetrics());

describe("metrics Prometheus", () => {
  it("histogram thời gian phản hồi + đếm theo lớp status (5xx tách riêng)", () => {
    recordHttpRequest({ route: "health", method: "GET", status: 200, durationSeconds: 0.08 });
    recordHttpRequest({ route: "health", method: "GET", status: 503, durationSeconds: 3 });
    const text = renderPrometheusMetrics();
    expect(text).toContain('tami_http_requests_total{route="health",method="GET",status_class="2xx"} 1');
    expect(text).toContain('tami_http_requests_total{route="health",method="GET",status_class="5xx"} 1');
    expect(text).toContain('tami_http_request_duration_seconds_bucket{route="health",method="GET",le="0.1"} 1');
    expect(text).toContain('tami_http_request_duration_seconds_bucket{route="health",method="GET",le="5"} 2');
    expect(text).toContain('tami_http_request_duration_seconds_bucket{route="health",method="GET",le="+Inf"} 2');
    expect(text).toContain('tami_http_request_duration_seconds_count{route="health",method="GET"} 2');
  });

  it("kết nối DB (pool) chỉ xuất khi đã đăng ký; lỗi onRequestError được đếm", () => {
    expect(renderPrometheusMetrics()).not.toContain("tami_db_pool_connections");
    registerDbPool({ totalCount: 3, idleCount: 2, waitingCount: 1, options: { max: 10 } });
    recordRequestError("render");
    const text = renderPrometheusMetrics();
    expect(text).toContain("tami_db_pool_connections 3");
    expect(text).toContain("tami_db_pool_idle_connections 2");
    expect(text).toContain("tami_db_pool_waiting_clients 1");
    expect(text).toContain("tami_db_pool_max_connections 10");
    expect(text).toContain('tami_request_errors_total{route_type="render"} 1');
  });

  it("withRequestMetrics ghi status trả về; handler ném lỗi → ghi 500 và ném lại", async () => {
    const ok = withRequestMetrics("demo", () => new Response("x", { status: 201 }));
    await ok(new Request("http://t/x", { method: "POST" }));
    const boom = withRequestMetrics("demo", () => Promise.reject(new Error("boom")));
    await expect(boom(new Request("http://t/x"))).rejects.toThrow("boom");
    const text = renderPrometheusMetrics();
    expect(text).toContain('route="demo",method="POST",status_class="2xx"} 1');
    expect(text).toContain('route="demo",method="GET",status_class="5xx"} 1');
  });
});

describe("isValidMetricsToken", () => {
  const token = "a".repeat(40);
  it("chỉ chấp nhận đúng Bearer token", () => {
    expect(isValidMetricsToken(`Bearer ${token}`, token)).toBe(true);
    expect(isValidMetricsToken(`Bearer ${token}x`, token)).toBe(false);
    expect(isValidMetricsToken("Bearer short", token)).toBe(false);
    expect(isValidMetricsToken(token, token)).toBe(false);
    expect(isValidMetricsToken("Basic abc", token)).toBe(false);
    expect(isValidMetricsToken(null, token)).toBe(false);
    expect(isValidMetricsToken("Bearer ", token)).toBe(false);
  });
});
