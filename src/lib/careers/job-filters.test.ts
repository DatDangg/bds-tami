import { describe, expect, it } from "vitest";

import { hasJobFilterParams, jobQueryString, parseJobFilters } from "./job-filters";

describe("parseJobFilters", () => {
  it("lấy giá trị đầu của mảng, bỏ giá trị rỗng/quá dài", () => {
    expect(parseJobFilters({ category: ["kinh-doanh", "x"], province: " ha-noi " })).toEqual({ categorySlug: "kinh-doanh", provinceSlug: "ha-noi" });
    expect(parseJobFilters({ category: "", province: "x".repeat(101) })).toEqual({});
    expect(parseJobFilters({})).toEqual({});
  });
});

describe("hasJobFilterParams / jobQueryString", () => {
  it("giá trị rỗng không tính là lọc; chuỗi truy vấn theo thứ tự cố định, trang 1 không kèm page", () => {
    expect(hasJobFilterParams({ province: "", category: "" })).toBe(false);
    expect(hasJobFilterParams({ category: "khong-co" })).toBe(true);
    expect(jobQueryString({})).toBe("");
    expect(jobQueryString({ page: 1 })).toBe("");
    expect(jobQueryString({ province: "ha-noi", category: "kinh-doanh", page: 3 })).toBe("?category=kinh-doanh&province=ha-noi&page=3");
  });
});
