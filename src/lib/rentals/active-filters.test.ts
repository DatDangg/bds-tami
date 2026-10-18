import { describe, expect, it } from "vitest";

import { activeFilterKinds, filtersWithout } from "./active-filters";
import type { RentalFilters } from "../search/url-params";

const all: RentalFilters = {
  q: "studio",
  category: "can-ho",
  province: "ha-noi",
  ward: "ba-dinh",
  priceMin: 1,
  priceMax: 2,
  areaMin: 3,
  bedrooms: 2,
  furnishing: "full",
  sort: "price_asc",
  page: 4,
};

describe("activeFilterKinds", () => {
  it("không có điều kiện (sort/page không tính) -> rỗng", () => {
    expect(activeFilterKinds({ sort: "price_asc", page: 3 })).toEqual([]);
  });

  it("theo thứ tự ô lọc; khoảng giá/diện tích là một chip", () => {
    expect(activeFilterKinds(all)).toEqual(["q", "category", "province", "ward", "price", "area", "bedrooms", "furnishing"]);
  });
});

describe("filtersWithout", () => {
  it("bỏ đúng một nhóm, giữ sort, về trang 1", () => {
    expect(filtersWithout(all, "q")).not.toHaveProperty("q");
    expect(filtersWithout(all, "q")).toMatchObject({ category: "can-ho", sort: "price_asc", page: 1 });
    const noPrice = filtersWithout(all, "price");
    expect(noPrice).not.toHaveProperty("priceMin");
    expect(noPrice).not.toHaveProperty("priceMax");
    expect(noPrice.areaMin).toBe(3);
  });

  it("bỏ tỉnh thì bỏ luôn phường", () => {
    const next = filtersWithout(all, "province");
    expect(next).not.toHaveProperty("province");
    expect(next).not.toHaveProperty("ward");
  });

  it("bỏ phường giữ tỉnh", () => {
    expect(filtersWithout(all, "ward")).toMatchObject({ province: "ha-noi" });
  });

  it("không đổi bộ lọc gốc", () => {
    filtersWithout(all, "price");
    expect(all.priceMin).toBe(1);
  });
});
