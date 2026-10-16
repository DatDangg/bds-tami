import { describe, expect, it } from "vitest";
import { formatArea, formatDate, formatNumber, formatVnd } from "./format";

describe("formatVnd", () => {
  it("vi: dấu chấm phân cách nghìn, hậu tố ₫", () => {
    expect(formatVnd(5_500_000, "vi")).toBe("5.500.000 ₫");
  });
  it("en: dấu phẩy phân cách nghìn, vẫn là VND", () => {
    expect(formatVnd(5_500_000, "en")).toBe("5,500,000 VND");
  });
  it("làm tròn về đồng, không phần thập phân", () => {
    expect(formatVnd(1500.6, "vi")).toBe("1.501 ₫");
  });
});

describe("formatArea / formatNumber", () => {
  it("vi dùng dấu phẩy thập phân, en dùng dấu chấm", () => {
    expect(formatArea(45.5, "vi")).toBe("45,5 m²");
    expect(formatArea(45.5, "en")).toBe("45.5 m²");
  });
  it("số lớn có phân cách theo locale", () => {
    expect(formatNumber(1234567, "vi")).toBe("1.234.567");
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });
});

describe("formatDate", () => {
  // 15/10/2026 20:00 UTC = 16/10/2026 03:00 giờ Việt Nam (UTC+7)
  const instant = "2026-10-15T20:00:00Z";
  it("tính theo múi giờ Asia/Ho_Chi_Minh, không theo máy chủ", () => {
    expect(formatDate(instant, "vi")).toBe("16/10/2026");
    expect(formatDate(instant, "en")).toBe("10/16/2026");
  });
  it("nhận Date và options tuỳ chỉnh", () => {
    expect(formatDate(new Date(instant), "en", { dateStyle: "long" })).toBe("October 16, 2026");
  });
});
