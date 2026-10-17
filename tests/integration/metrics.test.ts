import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TOKEN = "t".repeat(48);

// Route đọc env qua getEnv() (cache theo process): resetModules để mỗi test có cấu hình riêng.
async function callMetrics(headers: Record<string, string> = {}): Promise<Response> {
  vi.resetModules();
  const { GET } = await import("@/app/(payload)/api/metrics/route");
  return GET(new Request("http://localhost/api/metrics", { headers }));
}

// Cần .env.local dev (getEnv validate đủ biến bắt buộc) như các integration test khác.
describe("GET /api/metrics", () => {
  beforeEach(() => {
    vi.stubEnv("METRICS_TOKEN", TOKEN);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("không token → 401, no-store, không lộ số đo", async () => {
    const res = await callMetrics();
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).not.toContain("tami_");
  });

  it("token sai → 401", async () => {
    expect((await callMetrics({ authorization: `Bearer ${"x".repeat(48)}` })).status).toBe(401);
  });

  it("chưa cấu hình METRICS_TOKEN → 404 (kể cả khi gửi header)", async () => {
    vi.stubEnv("METRICS_TOKEN", "");
    expect((await callMetrics({ authorization: `Bearer ${TOKEN}` })).status).toBe(404);
  });

  it("token đúng → 200 dạng Prometheus text, no-store, có số đo process và request", async () => {
    const { withRequestMetrics } = await import("@/lib/monitoring/metrics");
    await withRequestMetrics("probe", () => new Response("ok"))(new Request("http://localhost/x"));
    const res = await callMetrics({ authorization: `Bearer ${TOKEN}` });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain; version=0.0.4");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).toContain("# TYPE tami_http_request_duration_seconds histogram");
    expect(text).toContain("tami_process_resident_memory_bytes");
    expect(text).toContain('route="probe"');
  });
});
