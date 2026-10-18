import { describe, expect, it } from "vitest";

import en from "./messages/en.json";
import vi from "./messages/vi.json";
import { checkMessages, flattenMessages, hasMessageProblems } from "./messages-check";

describe("checkMessages (so khoá vi/en)", () => {
  it("en.json đủ mọi khoá của vi.json, không thừa, không gạch dài, cùng tham số ICU", () => {
    expect(checkMessages(vi, en)).toEqual({ missingInEn: [], extraInEn: [], dashes: [], placeholderMismatches: [] });
  });

  it("thiếu khoá ở en → báo đúng khoá (kể cả khoá lồng)", () => {
    const result = checkMessages({ a: "A", b: { c: "C", d: "D" } }, { a: "A", b: { c: "C" } });
    expect(result.missingInEn).toEqual(["b.d"]);
    expect(hasMessageProblems(result)).toBe(true);
  });

  it("khoá thừa ở en, gạch dài ở cả hai bản, lệch tham số đều bị bắt", () => {
    const result = checkMessages({ a: "Xin chào {name}", b: "Một – hai" }, { a: "Hello {user}", b: "One — two", extra: "x" });
    expect(result.extraInEn).toEqual(["extra"]);
    expect(result.dashes).toEqual(["vi:b", "en:b"]);
    expect(result.placeholderMismatches).toEqual(["a"]);
  });

  it("hai bản khớp nhau thì không có vấn đề", () => {
    expect(hasMessageProblems(checkMessages({ a: "{n} căn", b: { c: "C" } }, { a: "{n} units", b: { c: "C" } }))).toBe(false);
  });

  it("flattenMessages duỗi cây thành khoá chấm", () => {
    expect(flattenMessages({ a: { b: "x" }, c: "y" })).toEqual({ "a.b": "x", c: "y" });
  });
});
