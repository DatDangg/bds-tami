import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientIp, UNKNOWN_CLIENT_IP } from "./client-ip";

// Logger thật ghi ra stdout; test kiểm nội dung log qua mock.
const log = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { child: () => log, ...log } }));

const headers = (init: Record<string, string>) => new Headers(init);

describe("getClientIp", () => {
  it("tin CF-Connecting-IP khi bật proxy tin cậy", () => {
    expect(getClientIp(headers({ "cf-connecting-ip": "203.0.113.7" }), { trustCloudflare: true })).toBe("203.0.113.7");
    expect(getClientIp(headers({ "cf-connecting-ip": "2001:db8::1" }), { trustCloudflare: true })).toBe("2001:db8::1");
  });

  it("không tin CF-Connecting-IP khi chưa cấu hình proxy: dùng remote address", () => {
    const h = headers({ "cf-connecting-ip": "6.6.6.6" });
    expect(getClientIp(h, { trustCloudflare: false, remoteAddress: "198.51.100.9" })).toBe("198.51.100.9");
  });

  it("không bao giờ đọc X-Forwarded-For / X-Real-IP, kể cả khi tin Cloudflare", () => {
    const h = headers({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "7.7.7.7" });
    expect(getClientIp(h, { trustCloudflare: true, remoteAddress: "198.51.100.9" })).toBe("198.51.100.9");
    expect(getClientIp(h, { trustCloudflare: true })).toBe(UNKNOWN_CLIENT_IP);
  });

  it("CF-Connecting-IP không phải IP hợp lệ -> bỏ qua", () => {
    const h = headers({ "cf-connecting-ip": "not-an-ip, 1.1.1.1" });
    expect(getClientIp(h, { trustCloudflare: true, remoteAddress: "198.51.100.9" })).toBe("198.51.100.9");
  });

  it("không xác định được -> bucket chung 'unknown' (không bỏ qua rate limit)", () => {
    expect(getClientIp(headers({}))).toBe(UNKNOWN_CLIENT_IP);
    expect(getClientIp(headers({}), { remoteAddress: "garbage" })).toBe(UNKNOWN_CLIENT_IP);
  });

  it("mặc định đọc TRUST_CF_CONNECTING_IP từ env", () => {
    const h = headers({ "cf-connecting-ip": "203.0.113.7" });
    const previous = process.env.TRUST_CF_CONNECTING_IP;
    try {
      process.env.TRUST_CF_CONNECTING_IP = "true";
      expect(getClientIp(h)).toBe("203.0.113.7");
      process.env.TRUST_CF_CONNECTING_IP = "false";
      expect(getClientIp(h)).toBe(UNKNOWN_CLIENT_IP);
    } finally {
      if (previous === undefined) delete process.env.TRUST_CF_CONNECTING_IP;
      else process.env.TRUST_CF_CONNECTING_IP = previous;
    }
  });

  it("cờ TRUST_CF_CONNECTING_IP giá trị lạ -> lỗi nêu tên biến", () => {
    vi.stubEnv("TRUST_CF_CONNECTING_IP", "yes");
    expect(() => getClientIp(headers({}))).toThrow(/TRUST_CF_CONNECTING_IP/);
  });
});

describe("getClientIp cảnh báo bucket unknown ở production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("cảnh báo đúng một lần mỗi process, không log IP/header", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    const warn = log.warn;
    warn.mockClear();
    const mod = await import("./client-ip");
    const h = headers({ "cf-connecting-ip": "6.6.6.6" });
    mod.getClientIp(h, { trustCloudflare: false });
    mod.getClientIp(h, { trustCloudflare: false });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("6.6.6.6");
  });

  it("không cảnh báo ngoài production hoặc khi xác định được IP", async () => {
    vi.resetModules();
    const warn = log.warn;
    warn.mockClear();
    const mod = await import("./client-ip");
    mod.getClientIp(headers({}));
    vi.stubEnv("NODE_ENV", "production");
    mod.getClientIp(headers({}), { remoteAddress: "198.51.100.9" });
    expect(warn).not.toHaveBeenCalled();
  });
});
