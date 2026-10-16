import { describe, expect, it } from "vitest";

import { filterRecipients, findEmailConfigProblems, parseEmailAllowlist } from "./allowlist";

describe("parseEmailAllowlist", () => {
  it("tách theo dấu phẩy, bỏ khoảng trắng, hạ chữ thường, bỏ phần rỗng", () => {
    expect(parseEmailAllowlist(" A@tami.vn, b@tami.vn ,, ")).toEqual(["a@tami.vn", "b@tami.vn"]);
  });

  it("thiếu hoặc rỗng -> danh sách rỗng", () => {
    expect(parseEmailAllowlist(undefined)).toEqual([]);
    expect(parseEmailAllowlist("")).toEqual([]);
  });
});

describe("filterRecipients", () => {
  const allowlist = ["noi-bo@tami.vn"];
  const recipients = ["Noi-Bo@tami.vn", "khach@gmail.com"];

  it("staging: chỉ giữ địa chỉ trong allowlist (không phân biệt hoa thường), đếm phần bị bỏ", () => {
    expect(filterRecipients({ appEnv: "staging", allowlist, recipients })).toEqual({
      allowed: ["Noi-Bo@tami.vn"],
      droppedCount: 1,
    });
  });

  it("production: không lọc dù allowlist rỗng", () => {
    expect(filterRecipients({ appEnv: "production", allowlist: [], recipients })).toEqual({
      allowed: recipients,
      droppedCount: 0,
    });
  });

  it("staging với allowlist rỗng: bỏ hết", () => {
    expect(filterRecipients({ appEnv: "staging", allowlist: [], recipients })).toEqual({
      allowed: [],
      droppedCount: 2,
    });
  });

  it("development/test cũng bị lọc (fail-safe)", () => {
    for (const appEnv of ["development", "test"] as const) {
      expect(filterRecipients({ appEnv, allowlist: [], recipients }).allowed).toEqual([]);
    }
  });
});

describe("findEmailConfigProblems", () => {
  it("báo lỗi khi build production nhưng APP_ENV khác production", () => {
    expect(findEmailConfigProblems({ nodeEnv: "production", appEnv: "development", allowlist: ["a@x.vn"] })).toHaveLength(1);
  });

  it("báo lỗi khi không-prod mà allowlist rỗng", () => {
    expect(findEmailConfigProblems({ nodeEnv: "development", appEnv: "staging", allowlist: [] })).toHaveLength(1);
  });

  it("cấu hình đúng thì không có vấn đề", () => {
    expect(findEmailConfigProblems({ nodeEnv: "production", appEnv: "production", allowlist: [] })).toEqual([]);
    expect(findEmailConfigProblems({ nodeEnv: "production", appEnv: "staging", allowlist: ["a@x.vn"] })).toEqual([]);
  });
});
