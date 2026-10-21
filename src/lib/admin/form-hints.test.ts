import { describe, expect, it } from "vitest";

import { describeSummaryLength, todayDateFieldValue } from "./form-hints";
import { formatPriceInWords } from "./list-summary";

describe("describeSummaryLength", () => {
  it("rỗng/không phải chuỗi → 0 ký tự, không cảnh báo", () => {
    expect(describeSummaryLength(undefined)).toEqual({ text: "0 ký tự · nên 150–200", outOfRange: false });
  });
  it("ngắn, đúng khoảng, dài", () => {
    expect(describeSummaryLength("a".repeat(123))).toEqual({ text: "123 ký tự · nên 150–200 (hơi ngắn)", outOfRange: true });
    expect(describeSummaryLength("a".repeat(150)).outOfRange).toBe(false);
    expect(describeSummaryLength("a".repeat(200)).outOfRange).toBe(false);
    expect(describeSummaryLength("a".repeat(201)).text).toContain("hơi dài");
  });
});

describe("formatPriceInWords", () => {
  it.each([
    [undefined, null],
    [0, null],
    [950_000, "≈ 950.000 đồng"],
    [15_000_000, "≈ 15 triệu đồng"],
    [3_500_000_000, "≈ 3,5 tỷ đồng"],
    [1_000_000_000, "≈ 1 tỷ đồng"],
  ])("%s → %s", (amount, expected) => expect(formatPriceInWords(amount)).toBe(expected));
});

describe("todayDateFieldValue", () => {
  it("lấy ngày theo giờ VN (23:30 UTC đã sang ngày sau ở VN), ghim 12:00 UTC", () => {
    expect(todayDateFieldValue(new Date("2026-10-20T23:30:00.000Z"))).toBe("2026-10-21T12:00:00.000Z");
    expect(todayDateFieldValue(new Date("2026-10-21T01:00:00.000Z"))).toBe("2026-10-21T12:00:00.000Z");
  });
});
