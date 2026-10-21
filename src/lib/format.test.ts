import { describe, expect, it } from "vitest";
import { formatArea, formatDate, formatFileSize, formatMeters, formatNumber, formatVnd, formatVndCompact } from "./format";

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
    expect(formatMeters(4.5, "vi")).toBe("4,5 m");
    expect(formatMeters(4.5, "en")).toBe("4.5 m");
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

describe("formatVndCompact", () => {
  it("vi: tỷ / triệu, dấu phẩy thập phân, tối đa 2 chữ số lẻ", () => {
    expect(formatVndCompact(3_500_000_000, "vi")).toBe("3,5 tỷ");
    expect(formatVndCompact(450_000_000, "vi")).toBe("450 triệu");
    expect(formatVndCompact(1_234_000_000, "vi")).toBe("1,23 tỷ");
  });
  it("en: billion / million VND, dấu chấm thập phân", () => {
    expect(formatVndCompact(3_500_000_000, "en")).toBe("3.5 billion VND");
    expect(formatVndCompact(450_000_000, "en")).toBe("450 million VND");
  });
  it("dưới 1 triệu hiện số đầy đủ", () => {
    expect(formatVndCompact(900_000, "vi")).toBe("900.000 ₫");
  });
});

describe("formatFileSize", () => {
  it("KB cho tệp nhỏ (tối thiểu 1 KB), MB một chữ số thập phân từ 1 MB; dấu thập phân theo ngôn ngữ", () => {
    expect(formatFileSize(10, "vi")).toBe("1 KB");
    expect(formatFileSize(850 * 1024, "vi")).toBe("850 KB");
    expect(formatFileSize(2.4 * 1024 * 1024, "vi")).toBe("2,4 MB");
    expect(formatFileSize(2.4 * 1024 * 1024, "en")).toBe("2.4 MB");
    expect(formatFileSize(1024 * 1024, "en")).toBe("1 MB");
  });
});
