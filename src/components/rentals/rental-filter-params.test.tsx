import { describe, expect, it } from "vitest";
import { countActiveFilters, listingHref } from "@/components/listing/listing-params";
import { parseRentalFilters, type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import { RENTAL_ACTIVE_FILTER_SPEC, toCurrentParams, toPreservedParams } from "./rental-list-state";

/**
 * Hợp đồng tham số URL của `/cho-thue` (BL-020 P3-T01 D4, giữ ở BL-052): đổi giao diện bộ lọc KHÔNG được đổi tên khoá / định dạng giá trị — link đã chia sẻ / đánh dấu
 * (kể cả `?category=` từ ô tìm kiếm trang chủ) phải chạy như cũ. Bộ lọc mới dựng URL bằng `listingHref` (P1-T02) từ tham số hiện tại.
 */
const full: RentalFilters = {
  q: "studio",
  category: "can-ho",
  province: "ha-noi",
  ward: "ba-dinh",
  priceMin: 5_000_000,
  priceMax: 10_000_000,
  areaMin: 20,
  areaMax: 50,
  bedrooms: 2,
  furnishing: "full",
  sort: "price_asc",
  page: 3,
};
const golden = "q=studio&category=can-ho&province=ha-noi&ward=ba-dinh&priceMin=5000000&priceMax=10000000&areaMin=20&areaMax=50&bedrooms=2&furnishing=full&sort=price_asc";
const parseHref = (href: string) => parseRentalFilters(Object.fromEntries(new URL(href, "http://x").searchParams));

describe("tham số URL của /cho-thue không đổi với bộ lọc BL-052", () => {
  it("URL đầy đủ: cùng tên khoá, cùng thứ tự; tham số hiện tại của bộ lọc không mang page", () => {
    expect(rentalListQueryString(full)).toBe(`?${golden}&page=3`);
    expect(new URLSearchParams(toCurrentParams(full)).toString()).toBe(golden);
  });

  it("đổi một ô lọc: giữ mọi tham số khác, bỏ page, giá trị VNĐ / m² nguyên như cũ; đọc lại ra đúng bộ lọc", () => {
    const href = listingHref("/cho-thue", toCurrentParams(full), { priceMin: "3000000", priceMax: null, bedrooms: "4" });
    expect(href).toBe("/cho-thue?q=studio&category=can-ho&province=ha-noi&ward=ba-dinh&priceMin=3000000&areaMin=20&areaMax=50&bedrooms=4&furnishing=full&sort=price_asc");
    expect(parseHref(href)).toEqual({ ...full, priceMin: 3_000_000, priceMax: undefined, bedrooms: 4, page: 1 });
  });

  it("đổi tỉnh bỏ phường; tiện ích ghi `a,b` (khoá lặp của form không JS cũng đọc được); dự án (BL-052) là khoá mới", () => {
    const href = listingHref("/cho-thue", toCurrentParams(full), { province: "ho-chi-minh", ward: null, amenities: ["pool", "gym"], project: "vinhomes" });
    expect(href).toContain("province=ho-chi-minh&priceMin");
    expect(href).not.toContain("ward=");
    expect(href).toContain("amenities=pool,gym&project=vinhomes");
    expect(parseHref(href).amenities).toEqual(["pool", "gym"]);
    expect(parseRentalFilters({ amenities: ["gym", "pool"] }).amenities).toEqual(["pool", "gym"]);
  });

  it("URL cũ đọc ra đúng bộ lọc (khứ hồi): parse → query giữ nguyên, khoảng min > max được đảo, tham số lạ bỏ", () => {
    const raw = Object.fromEntries(new URLSearchParams("category=can-ho&priceMin=9000000&priceMax=3000000&sort=price_desc&utm_source=fb"));
    expect(rentalListQueryString(parseRentalFilters(raw))).toBe("?category=can-ho&priceMin=3000000&priceMax=9000000&sort=price_desc");
  });

  it("form không JS giữ danh mục (link cũ), từ khoá, sắp xếp bằng input ẩn; badge chỉ đếm ô trong thẻ lọc (khoảng tính 1, mỗi tiện ích 1)", () => {
    const current = toCurrentParams({ ...full, amenities: ["pool", "gym"] });
    expect(toPreservedParams(current)).toEqual({ q: "studio", category: "can-ho", sort: "price_asc" });
    // tỉnh + phường + phòng ngủ + nội thất + giá + diện tích + 2 tiện ích
    expect(countActiveFilters(current, RENTAL_ACTIVE_FILTER_SPEC)).toBe(8);
    expect(countActiveFilters(toCurrentParams({ q: "x", category: "c", sort: "price_asc", page: 2 }), RENTAL_ACTIVE_FILTER_SPEC)).toBe(0);
  });
});
