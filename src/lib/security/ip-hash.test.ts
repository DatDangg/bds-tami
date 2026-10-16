import { afterEach, describe, expect, it, vi } from "vitest";
import { ipHash } from "./ip-hash";

const secret = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("ipHash", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("cùng IP + cùng secret -> cùng hash; hex SHA-256 dài 64, không chứa IP thô", () => {
    const a = ipHash("203.0.113.7", secret);
    expect(a).toBe(ipHash("203.0.113.7", secret));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203.0.113.7");
  });

  it("IP khác hoặc secret khác -> hash khác", () => {
    expect(ipHash("203.0.113.7", secret)).not.toBe(ipHash("203.0.113.8", secret));
    expect(ipHash("203.0.113.7", secret)).not.toBe(ipHash("203.0.113.7", `${secret}x`));
  });

  it("bỏ khoảng trắng thừa và coi IPv6 không phân biệt hoa/thường", () => {
    expect(ipHash(" 203.0.113.7 ", secret)).toBe(ipHash("203.0.113.7", secret));
    expect(ipHash("2001:DB8::1", secret)).toBe(ipHash("2001:db8::1", secret));
  });

  it("IPv4-mapped IPv6 trùng IPv4; IPv6 viết đầy đủ trùng dạng rút gọn", () => {
    expect(ipHash("::ffff:203.0.113.7", secret)).toBe(ipHash("203.0.113.7", secret));
    expect(ipHash("::FFFF:203.0.113.7", secret)).toBe(ipHash("203.0.113.7", secret));
    expect(ipHash("2001:0db8:0000:0000:0000:0000:0000:0001", secret)).toBe(ipHash("2001:db8::1", secret));
  });

  it("IPv4-mapped dạng hex (::ffff:cb00:7107) trùng IPv4 tương ứng", () => {
    expect(ipHash("::ffff:cb00:7107", secret)).toBe(ipHash("203.0.113.7", secret));
    expect(ipHash("::FFFF:CB00:7107", secret)).toBe(ipHash("203.0.113.7", secret));
    expect(ipHash("0:0:0:0:0:ffff:cb00:7107", secret)).toBe(ipHash("203.0.113.7", secret));
    expect(ipHash("::ffff:0:1", secret)).toBe(ipHash("0.0.0.1", secret));
    // ::ffff:0:0:1 là địa chỉ IPv6 khác, không được gộp về IPv4.
    expect(ipHash("::ffff:0:0:1", secret)).not.toBe(ipHash("0.0.0.1", secret));
  });

  it("giá trị không phải IP vẫn băm được (không làm sập endpoint)", () => {
    expect(ipHash("unknown", secret)).toMatch(/^[0-9a-f]{64}$/);
    expect(ipHash("fe80::1%eth0", secret)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("khớp vector HMAC-SHA256 tính độc lập trên `ip-hash:v1:<ip>` (không phải hash trần)", () => {
    expect(ipHash("203.0.113.7", secret)).toBe("151e4d15f7ef6ba7a64fef4374dbdb77106514c2547f816c94fbd859e01a17c5");
  });

  it("mặc định đọc secret từ PAYLOAD_SECRET", () => {
    vi.stubEnv("PAYLOAD_SECRET", secret);
    expect(ipHash("203.0.113.7")).toBe(ipHash("203.0.113.7", secret));
  });

  it("thiếu secret hoặc secret rỗng -> throw, không fallback hash không khoá", () => {
    vi.stubEnv("PAYLOAD_SECRET", "");
    expect(() => ipHash("203.0.113.7")).toThrow(/PAYLOAD_SECRET/);
    expect(() => ipHash("203.0.113.7", "")).toThrow();
  });

  it("IP rỗng -> throw (không băm chuỗi rỗng thành một 'IP' chung)", () => {
    expect(() => ipHash("", secret)).toThrow();
    expect(() => ipHash("   ", secret)).toThrow();
  });
});
