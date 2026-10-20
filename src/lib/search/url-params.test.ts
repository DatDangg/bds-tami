import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  hasNarrowingParams,
  parseRentalFilters,
  rentalCountApiPath,
  rentalListQueryString,
  RENTAL_LIST_PAGE_SIZE,
  secondaryFilterCount,
  toRentalSearchParams,
  type RentalFilters,
} from "./url-params";

describe("parseRentalFilters", () => {
  it("URL rỗng -> bộ lọc rỗng, sort newest, trang 1", () => {
    expect(parseRentalFilters({})).toEqual({ sort: "newest", page: 1 });
  });

  it("đọc đủ mọi tham số hợp lệ", () => {
    const filters = parseRentalFilters({
      q: "studio quan 1",
      category: "can-ho",
      province: "ho-chi-minh",
      ward: "ben-thanh",
      priceMin: "5000000",
      priceMax: "15000000",
      areaMin: "25",
      areaMax: "60.5",
      bedrooms: "4",
      furnishing: "full",
      sort: "price_desc",
      page: "3",
    });
    expect(filters).toEqual({
      q: "studio quan 1",
      category: "can-ho",
      province: "ho-chi-minh",
      ward: "ben-thanh",
      priceMin: 5_000_000,
      priceMax: 15_000_000,
      areaMin: 25,
      areaMax: 60.5,
      bedrooms: 4,
      furnishing: "full",
      sort: "price_desc",
      page: 3,
    });
  });

  it("tham số lạ và giá trị sai bị bỏ qua, không làm vỡ trang", () => {
    const filters = parseRentalFilters({
      utm_source: "fb",
      limit: "9999",
      locale: "en",
      priceMin: "abc",
      areaMax: "-3",
      bedrooms: "9",
      furnishing: "luxury",
      sort: "random",
      page: "0",
    });
    expect(filters).toEqual({ sort: "newest", page: 1 });
  });

  it("ô rỗng (form GET) coi như không truyền; khoá lặp lấy giá trị đầu", () => {
    expect(parseRentalFilters({ q: "  ", province: "", priceMin: ["1000000", "2000000"] })).toEqual({ priceMin: 1_000_000, sort: "newest", page: 1 });
  });

  it("phường chỉ có nghĩa khi kèm tỉnh (slug phường chỉ duy nhất trong tỉnh)", () => {
    expect(parseRentalFilters({ ward: "ben-thanh" })).toEqual({ sort: "newest", page: 1 });
  });

  it("khoảng min > max được đảo lại", () => {
    expect(parseRentalFilters({ priceMin: "9000000", priceMax: "3000000", areaMin: "80", areaMax: "20" })).toMatchObject({
      priceMin: 3_000_000,
      priceMax: 9_000_000,
      areaMin: 20,
      areaMax: 80,
    });
  });

  it("trang vượt trần bị bỏ về 1", () => {
    expect(parseRentalFilters({ page: "501" }).page).toBe(1);
  });

  it("amenities: chuỗi phẩy hoặc mảng (form GET lặp khoá); giá trị lạ/trùng bị bỏ; thứ tự ổn định theo RENTAL_AMENITIES; rỗng thì không có khoá", () => {
    expect(parseRentalFilters({ amenities: "gym,pool,foo,gym" }).amenities).toEqual(["pool", "gym"]);
    expect(parseRentalFilters({ amenities: ["gym", "pool,elevator"] }).amenities).toEqual(["pool", "gym", "elevator"]);
    expect(parseRentalFilters({ amenities: "foo" })).toEqual({ sort: "newest", page: 1 });
    expect(parseRentalFilters({ amenities: "" })).toEqual({ sort: "newest", page: 1 });
  });
});

describe("rentalListQueryString", () => {
  const full: RentalFilters = {
    q: "căn hộ & studio",
    category: "can-ho",
    province: "ho-chi-minh",
    ward: "ben-thanh",
    priceMin: 5_000_000,
    priceMax: 15_000_000,
    areaMin: 25,
    areaMax: 60,
    bedrooms: 2,
    furnishing: "basic",
    amenities: ["pool", "gym"],
    sort: "price_asc",
    page: 2,
  };

  it("round-trip: parse(serialize(x)) = x", () => {
    const query = rentalListQueryString(full);
    const raw = Object.fromEntries(new URLSearchParams(query));
    expect(parseRentalFilters(raw)).toEqual(full);
  });

  it("thứ tự khoá cố định; mặc định (sort newest, page 1) không xuất hiện; rỗng -> chuỗi rỗng", () => {
    expect(rentalListQueryString({ sort: "newest", page: 1 })).toBe("");
    expect(rentalListQueryString({ province: "ha-noi", q: "a", sort: "newest", page: 1 })).toBe("?q=a&province=ha-noi");
  });

  it("amenities ghi một khoá `a,b` sau furnishing; mảng rỗng không xuất hiện", () => {
    expect(rentalListQueryString({ furnishing: "full", amenities: ["pool", "gym"], sort: "newest", page: 1 })).toBe("?furnishing=full&amenities=pool%2Cgym");
    expect(rentalListQueryString({ amenities: [], sort: "newest", page: 1 })).toBe("");
  });

  it("mã hoá ký tự đặc biệt của q", () => {
    expect(rentalListQueryString({ q: "a&b=c", sort: "newest", page: 1 })).toBe("?q=a%26b%3Dc");
  });

  it("đổi bộ lọc có thể reset trang bằng override", () => {
    expect(rentalListQueryString({ ...full, page: 5 }, { page: 1 })).not.toContain("page=");
  });
});

describe("activeFilterCount / hasNarrowingParams", () => {
  it("đếm điều kiện lọc (khoảng giá/diện tích tính 1), không đếm sort/page; phường tính", () => {
    expect(activeFilterCount({ sort: "price_asc", page: 4 })).toBe(0);
    expect(activeFilterCount({ q: "x", province: "ha-noi", ward: "w", priceMin: 1, priceMax: 2, areaMin: 1, bedrooms: 3, furnishing: "none", category: "c", sort: "newest", page: 1 })).toBe(8);
  });

  it("mỗi tiện ích đếm 1 (khớp số chip Đang lọc), cả tổng lẫn lọc phụ", () => {
    expect(activeFilterCount({ amenities: ["pool", "gym"], sort: "newest", page: 1 })).toBe(2);
    expect(secondaryFilterCount({ amenities: ["pool", "gym"], furnishing: "full", sort: "newest", page: 1 })).toBe(0);
    expect(hasNarrowingParams({ amenities: ["pool"], sort: "newest", page: 1 })).toBe(true);
  });

  it("hasNarrowingParams: chỉ page/sort không làm trang noindex, bộ lọc thì có; lọc gốc theo danh mục hoặc tỉnh vẫn index", () => {
    expect(hasNarrowingParams({ sort: "newest", page: 3 })).toBe(false);
    expect(hasNarrowingParams({ category: "can-ho", sort: "newest", page: 1 })).toBe(false);
    expect(hasNarrowingParams({ province: "ha-noi", sort: "newest", page: 1 })).toBe(false);
    expect(hasNarrowingParams({ category: "can-ho", province: "ha-noi", sort: "newest", page: 1 })).toBe(true);
    expect(hasNarrowingParams({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 1 })).toBe(true);
    expect(hasNarrowingParams({ q: "x", sort: "newest", page: 1 })).toBe(true);
    expect(hasNarrowingParams({ sort: "price_asc", page: 1 })).toBe(true);
    expect(hasNarrowingParams({ priceMax: 5, sort: "newest", page: 1 })).toBe(true);
  });
});

describe("toRentalSearchParams", () => {
  it("ghép bộ lọc + ngôn ngữ + 12 tin/trang cho SearchService (đi qua schema API)", () => {
    const params = toRentalSearchParams({ q: "studio", province: "ha-noi", bedrooms: 2, sort: "price_asc", page: 2 }, "en");
    expect(params).toMatchObject({ locale: "en", q: "studio", province: "ha-noi", bedrooms: 2, sort: "price_asc", page: 2, limit: RENTAL_LIST_PAGE_SIZE, available: true });
    expect(RENTAL_LIST_PAGE_SIZE).toBe(12);
  });

  it("đường dẫn đếm cho Sheet: cùng bộ lọc, limit=1, chỉ tin còn trống, không sort/page", () => {
    const path = rentalCountApiPath({ q: "studio", province: "ha-noi", sort: "price_asc", page: 4 }, "vi");
    const url = new URL(path, "http://x");
    expect(url.pathname).toBe("/api/public/rentals");
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: "studio", province: "ha-noi", locale: "vi", limit: "1", available: "true" });
  });

  it("amenities đi qua schema API nguyên mảng và vào đường dẫn đếm dạng `a,b`", () => {
    expect(toRentalSearchParams({ amenities: ["pool", "gym"], sort: "newest", page: 1 }, "vi").amenities).toEqual(["pool", "gym"]);
    expect(new URL(rentalCountApiPath({ amenities: ["pool", "gym"], sort: "newest", page: 1 }, "vi"), "http://x").searchParams.get("amenities")).toBe("pool,gym");
  });
});
