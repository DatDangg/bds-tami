import { describe, expect, it } from "vitest";
import { hasPostFilterParams, parsePostFilters, postQueryString } from "./post-filters";

describe("parsePostFilters", () => {
  it("nhận đủ tham số hợp lệ; nhiều giá trị theo thứ tự danh sách cố định (tỉnh theo chữ cái)", () => {
    expect(
      parsePostFilters({
        q: "  biệt thự ",
        type: "villa,apartment",
        province: ["ha-noi", "da-nang,ha-noi"],
        priceMin: "2",
        priceMax: "10",
        areaMin: "50",
        areaMax: "200",
        bedrooms: "3",
        direction: "S,N",
        handover: ["full", "raw"],
        sort: "price_asc",
      }),
    ).toEqual({
      q: "biệt thự",
      types: ["apartment", "villa"],
      provinceSlugs: ["da-nang", "ha-noi"],
      priceMin: 2,
      priceMax: 10,
      areaMin: 50,
      areaMax: 200,
      bedrooms: 3,
      directions: ["N", "S"],
      handovers: ["raw", "full"],
      sort: "price_asc",
    });
  });

  it("giá trị lạ / rỗng / quá dài bị bỏ, không ném lỗi", () => {
    expect(
      parsePostFilters({
        q: "x".repeat(101),
        type: "toString,khong-co",
        province: " , ",
        priceMin: "-1",
        priceMax: "abc",
        areaMin: "1.5",
        bedrooms: "5",
        direction: "__proto__",
        handover: "",
        sort: "oldest",
      }),
    ).toEqual({});
    expect(parsePostFilters({ bedrooms: "0" })).toEqual({});
    expect(parsePostFilters({ bedrooms: ["4", "1"] })).toEqual({ bedrooms: 4 });
  });

  it("thanh trượt: kẹp về trần, min > max đổi chỗ, đầu ở mép (0 / trần) bỏ", () => {
    expect(parsePostFilters({ priceMin: "0", priceMax: "50" })).toEqual({});
    expect(parsePostFilters({ priceMin: "80" })).toEqual({ priceMin: 50 });
    expect(parsePostFilters({ priceMin: "10", priceMax: "2" })).toEqual({ priceMin: 2, priceMax: 10 });
    expect(parsePostFilters({ areaMin: "0", areaMax: "900" })).toEqual({});
    expect(parsePostFilters({ areaMin: "300", areaMax: "100" })).toEqual({ areaMin: 100, areaMax: 300 });
  });

  it("priceMax=0 / areaMax=0 gõ tay = không giới hạn trên (không lọc về 0), kể cả khi có đầu dưới", () => {
    expect(parsePostFilters({ priceMax: "0" })).toEqual({});
    expect(parsePostFilters({ areaMax: "0" })).toEqual({});
    expect(parsePostFilters({ priceMin: "5", priceMax: "0" })).toEqual({ priceMin: 5 });
    expect(parsePostFilters({ areaMin: "40", areaMax: "00" })).toEqual({ areaMin: 40 });
  });

  it("sort mặc định (newest) không có trong kết quả", () => {
    expect(parsePostFilters({ sort: "newest" })).toEqual({});
    expect(parsePostFilters({ sort: "price_desc" })).toEqual({ sort: "price_desc" });
  });
});

describe("hasPostFilterParams (→ noindex)", () => {
  it("có lọc / q / sort khác mặc định → true, kể cả giá trị sai", () => {
    expect(hasPostFilterParams({ q: "abc" })).toBe(true);
    expect(hasPostFilterParams({ type: "khong-co" })).toBe(true);
    expect(hasPostFilterParams({ bedrooms: "2" })).toBe(true);
    expect(hasPostFilterParams({ areaMax: "100" })).toBe(true);
    expect(hasPostFilterParams({ handover: "raw" })).toBe(true);
    expect(hasPostFilterParams({ sort: "price_asc" })).toBe(true);
  });

  it("trang sạch, chỉ `page`, tham số rỗng, sort mặc định / lạ → false", () => {
    expect(hasPostFilterParams({})).toBe(false);
    expect(hasPostFilterParams({ page: "2" })).toBe(false);
    expect(hasPostFilterParams({ province: "", q: " ", direction: "," })).toBe(false);
    expect(hasPostFilterParams({ sort: "newest" })).toBe(false);
    expect(hasPostFilterParams({ sort: "oldest" })).toBe(false);
  });
});

describe("postQueryString", () => {
  it("thứ tự khoá cố định, nhiều giá trị nối dấu phẩy không mã hoá; parse lại ra cùng bộ lọc", () => {
    const filters = parsePostFilters({ sort: "price_desc", handover: "full", type: "villa,apartment", province: "ha-noi,da-nang", q: "nhà phố", bedrooms: "4", areaMax: "200" });
    const query = postQueryString(filters, 2);
    expect(query).toBe("?q=nh%C3%A0+ph%E1%BB%91&type=apartment,villa&province=da-nang,ha-noi&areaMax=200&bedrooms=4&handover=full&sort=price_desc&page=2");
    const parsed = Object.fromEntries(new URLSearchParams(query.slice(1)));
    expect(parsePostFilters(parsed)).toEqual(filters);
  });

  it("trang 1, không lọc → chuỗi rỗng; đầu thanh trượt ở mép không lên URL", () => {
    expect(postQueryString({})).toBe("");
    expect(postQueryString({ priceMin: 0, priceMax: 50, areaMax: 500 }, 1)).toBe("");
  });
});
