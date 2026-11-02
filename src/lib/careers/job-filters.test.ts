import { describe, expect, it } from "vitest";

import { hasJobFilterParams, jobQueryString, matchesJobKeyword, parseJobFilters } from "./job-filters";

describe("parseJobFilters", () => {
  it("lấy giá trị đầu của mảng, bỏ giá trị rỗng/quá dài", () => {
    expect(parseJobFilters({ category: ["kinh-doanh", "x"], province: " ha-noi " })).toEqual({ categorySlug: "kinh-doanh", provinceSlug: "ha-noi" });
    expect(parseJobFilters({ category: "", province: "x".repeat(101) })).toEqual({});
    expect(parseJobFilters({})).toEqual({});
  });

  it("q (BL-054): cắt khoảng trắng, lấy giá trị đầu, rỗng / > 100 ký tự bị bỏ", () => {
    expect(parseJobFilters({ q: "  tư vấn  " })).toEqual({ q: "tư vấn" });
    expect(parseJobFilters({ q: ["marketing", "x"] })).toEqual({ q: "marketing" });
    expect(parseJobFilters({ q: "   " })).toEqual({});
    expect(parseJobFilters({ q: "a".repeat(101) })).toEqual({});
  });
});

describe("hasJobFilterParams / jobQueryString", () => {
  it("giá trị rỗng không tính là lọc; chuỗi truy vấn theo thứ tự cố định, trang 1 không kèm page", () => {
    expect(hasJobFilterParams({ province: "", category: "", q: " " })).toBe(false);
    expect(hasJobFilterParams({ category: "khong-co" })).toBe(true);
    expect(hasJobFilterParams({ q: "sale" })).toBe(true);
    expect(jobQueryString({})).toBe("");
    expect(jobQueryString({ page: 1 })).toBe("");
    expect(jobQueryString({ province: "ha-noi", category: "kinh-doanh", page: 3 })).toBe("?category=kinh-doanh&province=ha-noi&page=3");
    expect(jobQueryString({ q: "tư vấn", province: "ha-noi", page: 2 })).toBe("?province=ha-noi&q=t%C6%B0+v%E1%BA%A5n&page=2");
  });
});

describe("matchesJobKeyword", () => {
  it("không dấu, không phân biệt hoa thường, đ = d; 1 từ là chuỗi con", () => {
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "tu van")).toBe(true);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "BẤT ĐỘNG")).toBe(true);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "dong san")).toBe(true);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "tu van marketing")).toBe(false);
    expect(matchesJobKeyword("Nhân viên hành chính", "Hành   chính")).toBe(true);
  });

  it("BL-103: ≥ 2 từ phải liền nhau đúng thứ tự ở đầu từ; 1 từ vẫn là chuỗi con", () => {
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "tư vấn")).toBe(true);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "viên tư")).toBe(true);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "tu van bat")).toBe(true);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "van tu")).toBe(false);
    expect(matchesJobKeyword("Chuyên viên tư vấn bất động sản", "viên vấn")).toBe(false);
    expect(matchesJobKeyword("Nhân viên Ba Đình", "ba đình")).toBe(true);
    expect(matchesJobKeyword("Quản lý gia đình ba phòng", "ba đình")).toBe(false);
    expect(matchesJobKeyword("Quyết định ba", "ba đình")).toBe(false);
    expect(matchesJobKeyword("Sale (BĐS) - HN", "bds hn")).toBe(true);
    expect(matchesJobKeyword("C++ dev", "c++ dev")).toBe(true);
    expect(matchesJobKeyword("a.b dev", "a.b dev")).toBe(true);
    expect(matchesJobKeyword("axb dev", "a.b dev")).toBe(false);
    expect(matchesJobKeyword("Chuyên viên", "uyên")).toBe(true);
  });

  it("từ khoá rỗng khớp mọi tên; tên trống không khớp từ khoá có chữ", () => {
    expect(matchesJobKeyword("Bất kỳ", undefined)).toBe(true);
    expect(matchesJobKeyword("Bất kỳ", "  ")).toBe(true);
    expect(matchesJobKeyword(null, "sale")).toBe(false);
  });
});
