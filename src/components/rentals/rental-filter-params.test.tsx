import { describe, expect, it } from "vitest";
import { parseRentalFilters, type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import { PRICE_HINTS } from "./FilterFields";
import { draftOf, queryOfDraft } from "./use-rental-draft";

/**
 * BL-020 P3-T01 (D4): băng tìm kiếm mới KHÔNG được đổi URL. Các chuỗi dưới đây là "golden" của hợp đồng tham số trước khi đổi giao diện
 * (tên khoá, thứ tự, "Tất cả" = vắng mặt, về trang 1 khi lọc) — link đã chia sẻ/đánh dấu phải chạy như cũ.
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

describe("tham số URL của /cho-thue không đổi sau khi thay băng tìm kiếm", () => {
  it("bộ lọc đầy đủ: cùng tên khoá, cùng thứ tự; lọc mới (từ bản nháp) bỏ page về trang 1", () => {
    const golden = "q=studio&category=can-ho&province=ha-noi&ward=ba-dinh&priceMin=5000000&priceMax=10000000&areaMin=20&areaMax=50&bedrooms=2&furnishing=full&sort=price_asc";
    expect(rentalListQueryString(full)).toBe(`?${golden}&page=3`);
    expect(queryOfDraft(draftOf(full))).toBe(`?${golden}`);
  });

  it("'Tất cả' (ô trống) = vắng mặt; sắp xếp mặc định không xuất hiện", () => {
    expect(queryOfDraft({ ...draftOf({ sort: "newest", page: 1 }) })).toBe("");
    expect(queryOfDraft({ ...draftOf(full), category: "", province: "", ward: "", priceMin: "", priceMax: "", sort: "newest" })).toBe(
      "?q=studio&areaMin=20&areaMax=50&bedrooms=2&furnishing=full",
    );
  });

  it("mỗi mục của ô Khoảng giá ra đúng cặp priceMin/priceMax của chip mốc giá cũ", () => {
    const base = draftOf({ sort: "newest", page: 1 });
    const queries = PRICE_HINTS.map((hint) => queryOfDraft({ ...base, priceMin: hint.min, priceMax: hint.max }));
    expect(queries).toEqual(["?priceMax=5000000", "?priceMin=5000000&priceMax=10000000", "?priceMin=10000000&priceMax=20000000", "?priceMin=20000000"]);
  });

  it("URL cũ đọc ra đúng bộ lọc (khứ hồi): parse → query giữ nguyên, khoảng min > max được đảo", () => {
    const raw = Object.fromEntries(new URLSearchParams("category=can-ho&priceMin=9000000&priceMax=3000000&sort=price_desc&utm_source=fb"));
    expect(rentalListQueryString(parseRentalFilters(raw))).toBe("?category=can-ho&priceMin=3000000&priceMax=9000000&sort=price_desc");
  });
});
