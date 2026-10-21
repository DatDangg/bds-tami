import { describe, expect, it } from "vitest";

import { dropUnknownSlugs, type RentalFilterOptions, toRentalProvinceFacets } from "./rental-list-queries";

const options: RentalFilterOptions = {
  categories: [{ id: "c1", slug: "can-ho", label: "Căn hộ", depth: 0 }],
  provinces: [
    { id: "p1", slug: "ha-noi", name: "Hà Nội" },
    { id: "p2", slug: "ho-chi-minh", name: "TP.HCM" },
    { id: "p3", slug: "da-nang", name: "Đà Nẵng" },
  ],
  wards: [],
  wardsProvince: null,
  projects: [{ slug: "vinhomes-ocean-park", title: "Vinhomes Ocean Park" }],
};

describe("dropUnknownSlugs: project (BL-052)", () => {
  it("giữ dự án có trong danh sách (dự án có tin cho thuê), bỏ slug lạ thay vì trả trang rỗng", () => {
    expect(dropUnknownSlugs({ project: "vinhomes-ocean-park", sort: "newest", page: 1 }, options).project).toBe("vinhomes-ocean-park");
    expect(dropUnknownSlugs({ project: "khong-co", sort: "newest", page: 1 }, options)).toEqual({ sort: "newest", page: 1 });
  });
});

describe("toRentalProvinceFacets", () => {
  it("chỉ tỉnh có tin; sắp theo số tin không lọc giảm dần, hoà theo thứ tự danh mục tỉnh; count theo bộ lọc (0 vẫn giữ)", () => {
    const facets = toRentalProvinceFacets(options.provinces, [
      { provinceId: "p3", count: 0, total: 4 },
      { provinceId: "p1", count: 2, total: 9 },
      { provinceId: "p2", count: 1, total: 4 },
      { provinceId: "khong-co", count: 1, total: 99 },
    ]);
    expect(facets).toEqual([
      { id: "p1", slug: "ha-noi", name: "Hà Nội", count: 2 },
      { id: "p2", slug: "ho-chi-minh", name: "TP.HCM", count: 1 },
      { id: "p3", slug: "da-nang", name: "Đà Nẵng", count: 0 },
    ]);
  });
});
