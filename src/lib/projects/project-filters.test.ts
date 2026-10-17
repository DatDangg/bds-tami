import { describe, expect, it } from "vitest";
import { hasFilterParams, parseProjectFilters, projectQueryString, SALES_STATUS_VALUES } from "./project-filters";

describe("parseProjectFilters", () => {
  it("nhận slug danh mục, slug tỉnh và trạng thái mở bán hợp lệ", () => {
    expect(parseProjectFilters({ category: "can-ho", province: "ha-noi", status: "selling" })).toEqual({
      categorySlug: "can-ho",
      provinceSlug: "ha-noi",
      status: "selling",
    });
  });

  it("giá trị rỗng, khoảng trắng, quá dài hoặc trạng thái lạ bị bỏ (không làm vỡ trang)", () => {
    expect(parseProjectFilters({ category: "", province: "  ", status: "khong-co" })).toEqual({});
    expect(parseProjectFilters({ province: "x".repeat(101) })).toEqual({});
    expect(parseProjectFilters({ status: "toString" })).toEqual({});
    expect(parseProjectFilters({ status: "__proto__" })).toEqual({});
  });

  it("tham số lặp (?province=a&province=b) lấy giá trị đầu", () => {
    expect(parseProjectFilters({ province: ["ha-noi", "da-nang"], status: ["upcoming", "selling"] })).toEqual({ provinceSlug: "ha-noi", status: "upcoming" });
  });

  it("đủ ba trạng thái mở bán của collection", () => {
    expect(SALES_STATUS_VALUES.sort()).toEqual(["handed_over", "selling", "upcoming"]);
  });
});

describe("hasFilterParams", () => {
  it("có giá trị ở category/province/status (kể cả giá trị sai) thì là trang lọc", () => {
    expect(hasFilterParams({ province: "ha-noi" })).toBe(true);
    expect(hasFilterParams({ status: "khong-co" })).toBe(true);
    expect(hasFilterParams({ category: ["can-ho"] })).toBe(true);
  });

  it("chỉ `page` hoặc giá trị rỗng do form gửi 'Tất cả' thì không phải trang lọc", () => {
    expect(hasFilterParams({ page: "2" })).toBe(false);
    expect(hasFilterParams({ province: "", status: "" })).toBe(false);
    expect(hasFilterParams({})).toBe(false);
  });
});

describe("projectQueryString", () => {
  it("thứ tự cố định, trang 1 không kèm page, rỗng thì trả chuỗi rỗng", () => {
    expect(projectQueryString({})).toBe("");
    expect(projectQueryString({ page: 1 })).toBe("");
    expect(projectQueryString({ status: "selling", province: "ha-noi", category: "can-ho", page: 3 })).toBe("?category=can-ho&province=ha-noi&status=selling&page=3");
  });

  it("mã hoá giá trị", () => {
    expect(projectQueryString({ province: "a b&c" })).toBe("?province=a+b%26c");
  });
});
