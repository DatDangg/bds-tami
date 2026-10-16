import { describe, expect, it } from "vitest";

import { sanitizeAuditMeta } from "./sanitize-meta";

describe("sanitizeAuditMeta", () => {
  it("trả undefined khi không có meta", () => {
    expect(sanitizeAuditMeta(undefined)).toBeUndefined();
    expect(sanitizeAuditMeta(null)).toBeUndefined();
  });

  it("giữ dữ liệu thường", () => {
    expect(sanitizeAuditMeta({ from: "sale", to: "admin", count: 2, ok: true, note: null })).toEqual({
      from: "sale",
      to: "admin",
      count: 2,
      ok: true,
      note: null,
    });
  });

  it("bỏ trường password, salt, hash, token ở mọi độ sâu, không phân biệt hoa thường", () => {
    const result = sanitizeAuditMeta({
      email: "a@b.vn",
      password: "x",
      Password: "x",
      salt: "s",
      hash: "h",
      resetPasswordToken: "t",
      apiKey: "k",
      before: { role: "sale", hash: "h", nested: [{ salt: "s", keep: 1 }] },
    });
    expect(result).toEqual({ email: "a@b.vn", before: { role: "sale", nested: [{ keep: 1 }] } });
    const json = JSON.stringify(result);
    for (const forbidden of ["password", "salt", "hash", "token", "apiKey"]) {
      expect(json.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("đổi Date/bigint sang dạng JSON, bỏ undefined và hàm", () => {
    const result = sanitizeAuditMeta({
      at: new Date("2026-10-16T00:00:00.000Z"),
      big: 10n,
      nothing: undefined,
      fn: () => 1,
    });
    expect(result).toEqual({ at: "2026-10-16T00:00:00.000Z", big: "10" });
  });

  it("chặn vòng tham chiếu và cắt ở độ sâu tối đa", () => {
    const loop: Record<string, unknown> = { name: "x" };
    loop.self = loop;
    expect(sanitizeAuditMeta({ loop })).toEqual({ loop: { name: "x", self: "[circular]" } });

    let deep: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 10; i += 1) deep = { child: deep };
    expect(JSON.stringify(sanitizeAuditMeta(deep))).toContain("[truncated]");
  });
});
