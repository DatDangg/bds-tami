import { describe, expect, it } from "vitest";
import { hasFilterParams, parseProjectFilters, projectQueryString, SALES_STATUS_VALUES } from "./project-filters";

describe("parseProjectFilters", () => {
  it("nhận slug danh mục, slug tỉnh và trạng thái mở bán hợp lệ", () => {
    expect(parseProjectFilters({ category: "can-ho", province: "ha-noi", status: "selling" })).toEqual({
      categorySlug: "can-ho",
      provinceSlugs: ["ha-noi"],
      status: "selling",
    });
  });

  it("giá trị rỗng, khoảng trắng, quá dài hoặc trạng thái lạ bị bỏ (không làm vỡ trang)", () => {
    expect(parseProjectFilters({ category: "", province: "  ", status: "khong-co" })).toEqual({});
    expect(parseProjectFilters({ province: "x".repeat(101) })).toEqual({});
    expect(parseProjectFilters({ status: "toString" })).toEqual({});
    expect(parseProjectFilters({ status: "__proto__" })).toEqual({});
  });

  it("tham số một giá trị lặp (?status=a&status=b) lấy giá trị đầu", () => {
    expect(parseProjectFilters({ status: ["upcoming", "selling"] })).toEqual({ status: "upcoming" });
  });

  it("BL-052 tỉnh nhiều giá trị: `a,b` và khoá lặp đều nhận, bỏ rỗng / trùng, sắp chữ cái; slug đơn cũ vẫn chạy", () => {
    expect(parseProjectFilters({ province: "ha-noi" })).toEqual({ provinceSlugs: ["ha-noi"] });
    expect(parseProjectFilters({ province: "ha-noi,da-nang" })).toEqual({ provinceSlugs: ["da-nang", "ha-noi"] });
    expect(parseProjectFilters({ province: ["ha-noi", "da-nang,ha-noi", " ", ","] })).toEqual({ provinceSlugs: ["da-nang", "ha-noi"] });
    expect(parseProjectFilters({ province: `ok,${"x".repeat(101)}` })).toEqual({ provinceSlugs: ["ok"] });
  });

  it("BL-052 type / feature: chỉ giữ giá trị trong danh sách cố định, theo thứ tự danh sách; lạ bị bỏ", () => {
    expect(parseProjectFilters({ type: "villa,apartment,khong-co", feature: ["water_view", "near_school", "__proto__"] })).toEqual({
      types: ["apartment", "villa"],
      features: ["near_school", "water_view"],
    });
    expect(parseProjectFilters({ type: "toString", feature: "" })).toEqual({});
  });

  it("BL-052 giá (tỷ): số nguyên, kẹp ≤ 50, min > max đổi chỗ, mép (0 / 50) bỏ; giá trị sai bị bỏ", () => {
    expect(parseProjectFilters({ priceMin: "2", priceMax: "10" })).toEqual({ priceMin: 2, priceMax: 10 });
    expect(parseProjectFilters({ priceMin: "10", priceMax: "2" })).toEqual({ priceMin: 2, priceMax: 10 });
    expect(parseProjectFilters({ priceMin: "0", priceMax: "50" })).toEqual({});
    expect(parseProjectFilters({ priceMin: "80" })).toEqual({ priceMin: 50 });
    expect(parseProjectFilters({ priceMax: "999" })).toEqual({});
    expect(parseProjectFilters({ priceMin: "60", priceMax: "10" })).toEqual({ priceMin: 10 });
    expect(parseProjectFilters({ priceMin: "1.5", priceMax: "-3" })).toEqual({});
    expect(parseProjectFilters({ priceMin: "abc", priceMax: "1e3" })).toEqual({});
  });

  it("BL-055 C-4: `priceMax=0` (gõ tay / kéo đầu trên về 0) = không giới hạn trên như /tin-bds, không lọc 'giá ≤ 0'", () => {
    expect(parseProjectFilters({ priceMax: "0" })).toEqual({});
    expect(parseProjectFilters({ priceMin: "5", priceMax: "0" })).toEqual({ priceMin: 5 });
    expect(parseProjectFilters({ priceMin: "0", priceMax: "0" })).toEqual({});
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

  it("BL-052: tỉnh nhiều giá trị, type, feature, priceMin / priceMax là tham số lọc", () => {
    expect(hasFilterParams({ province: ",ha-noi" })).toBe(true);
    expect(hasFilterParams({ type: "villa" })).toBe(true);
    expect(hasFilterParams({ feature: ["near_metro"] })).toBe(true);
    expect(hasFilterParams({ priceMin: "5" })).toBe(true);
    expect(hasFilterParams({ priceMax: "0" })).toBe(true);
    expect(hasFilterParams({ type: "", feature: ",", province: [""] })).toBe(false);
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

  it("BL-052: thứ tự khoá cố định; nhiều giá trị nối bằng dấu phẩy (không %2C), không trùng, thứ tự ổn định; giá ở mép không lên URL", () => {
    expect(
      projectQueryString({ page: 2, priceMax: 20, priceMin: 3, feature: ["water_view", "near_school"], type: ["villa", "apartment", "villa"], province: ["ha-noi", "da-nang"], category: "can-ho" }),
    ).toBe("?category=can-ho&province=da-nang,ha-noi&type=apartment,villa&feature=near_school,water_view&priceMin=3&priceMax=20&page=2");
    expect(projectQueryString({ province: ["ha-noi"], priceMin: 0, priceMax: 50, type: [] })).toBe("?province=ha-noi");
    expect(projectQueryString({ province: "ha-noi", sort: "price_asc" })).toBe("?province=ha-noi&sort=price_asc");
  });

  it("parse → serialize → parse ổn định (khoá lặp và a,b cho cùng URL)", () => {
    const fromRepeated = parseProjectFilters({ province: ["b", "a"], type: ["villa", "apartment"] });
    const fromComma = parseProjectFilters({ province: "a,b", type: "apartment,villa" });
    const url = (filters: typeof fromComma) => projectQueryString({ province: filters.provinceSlugs ?? [], type: filters.types ?? [] });
    expect(url(fromRepeated)).toBe(url(fromComma));
    expect(url(fromComma)).toBe("?province=a,b&type=apartment,villa");
  });

  it("mã hoá giá trị", () => {
    expect(projectQueryString({ province: "a b&c" })).toBe("?province=a+b%26c");
  });
});
