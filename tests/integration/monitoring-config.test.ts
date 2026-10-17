import { afterEach, describe, expect, it, vi } from "vitest";

// Route đọc env qua getEnv() (cache theo process): resetModules để mỗi test có cấu hình riêng.
async function callConfig(): Promise<Response> {
  vi.resetModules();
  const { GET } = await import("@/app/(payload)/api/monitoring-config/route");
  return GET();
}

describe("GET /api/monitoring-config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("environment và DSN lấy từ env lúc chạy", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("GLITCHTIP_PUBLIC_DSN", "https://key@glitchtip.example/2");
    const body = (await (await callConfig()).json()) as { dsn: string | null; environment: string };
    expect(body).toEqual({ dsn: "https://key@glitchtip.example/2", environment: "staging" });
  });

  it("Cache-Control private: không cho cache dùng chung (CDN/proxy), chỉ trình duyệt", async () => {
    const res = await callConfig();
    expect(res.headers.get("cache-control")).toBe("private, max-age=300");
  });

  it("chưa có DSN → dsn null (trình duyệt không tải SDK)", async () => {
    vi.stubEnv("GLITCHTIP_PUBLIC_DSN", "");
    const res = await callConfig();
    expect(((await res.json()) as { dsn: string | null }).dsn).toBeNull();
  });
});
