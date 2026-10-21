import { describe, expect, it } from "vitest";
import { hasFilterParams, parseProjectFilters, projectQueryString } from "@/lib/projects/project-filters";

/**
 * BL-020 P3-T02 (E1): băng tìm kiếm mới của `/du-an` KHÔNG được đổi URL. Các chuỗi dưới đây là "golden" của hợp đồng tham số trước khi
 * đổi giao diện (tên khoá, thứ tự `category` → `province` → `status` → `page`, "Tất cả" = vắng mặt) — link đã chia sẻ/đánh dấu chạy như cũ.
 */
describe("tham số URL của /du-an không đổi sau khi thay băng tìm kiếm", () => {
  it("đủ tham số: cùng tên khoá, cùng thứ tự; trang 1 không kèm page", () => {
    expect(projectQueryString({ category: "can-ho", province: "ha-noi", status: "selling", page: 3 })).toBe("?category=can-ho&province=ha-noi&status=selling&page=3");
    expect(projectQueryString({ category: "can-ho", province: "ha-noi", status: "selling", page: 1 })).toBe("?category=can-ho&province=ha-noi&status=selling");
  });

  it("'Tất cả' (ô trống) = vắng mặt; không có bộ lọc thì không có dấu ?", () => {
    expect(projectQueryString({ category: "", province: "", status: "" })).toBe("");
    expect(projectQueryString({ province: "", status: "upcoming" })).toBe("?status=upcoming");
  });

  it("URL cũ đọc ra đúng bộ lọc: giá trị lạ/quá dài bị bỏ, tham số ngoài (utm) bỏ qua", () => {
    const raw = Object.fromEntries(new URLSearchParams("category=can-ho&province=da-nang&status=handed_over&utm_source=fb"));
    expect(parseProjectFilters(raw)).toEqual({ categorySlug: "can-ho", provinceSlugs: ["da-nang"], status: "handed_over" });
    expect(parseProjectFilters({ status: "sai", province: "x".repeat(101) })).toEqual({});
  });

  it("noindex chỉ khi có tham số lọc có giá trị (province= rỗng do form gửi 'Tất cả' không tính)", () => {
    expect(hasFilterParams({ province: "", status: "" })).toBe(false);
    expect(hasFilterParams({ status: "selling" })).toBe(true);
  });
});

/** BL-045 phase-1-task-00: `q`, `developer`, `sort` thêm vào hợp đồng tham số của /du-an. */
describe("tham số BL-045 của /du-an: q, developer, sort", () => {
  it("đọc q (trim, ≤ 100 ký tự), developer (id thô) và sort hợp lệ", () => {
    expect(parseProjectFilters({ q: "  crown  ", developer: "dev-1", sort: "price_asc" })).toEqual({ q: "crown", developerId: "dev-1", sort: "price_asc" });
    expect(parseProjectFilters({ q: "x".repeat(101) })).toEqual({});
    expect(parseProjectFilters({ q: ["a", "b"] })).toEqual({ q: "a" });
  });

  it("sort lạ hoặc newest = mặc định (không có trong bộ lọc)", () => {
    expect(parseProjectFilters({ sort: "newest" })).toEqual({});
    expect(parseProjectFilters({ sort: "bogus" })).toEqual({});
    expect(parseProjectFilters({ sort: "price_desc" })).toEqual({ sort: "price_desc" });
  });

  it("projectQueryString: thứ tự cố định, sort=newest và page 1 không lên URL", () => {
    expect(projectQueryString({ category: "can-ho", province: "ha-noi", status: "selling", q: "crown", developer: "d1", sort: "price_desc", page: 2 })).toBe(
      "?category=can-ho&province=ha-noi&status=selling&q=crown&developer=d1&sort=price_desc&page=2",
    );
    expect(projectQueryString({ sort: "newest", q: "" })).toBe("");
  });

  it("hasFilterParams: q / developer / sort khác mặc định là lọc; sort=newest hoặc lạ thì không", () => {
    expect(hasFilterParams({ q: "crown" })).toBe(true);
    expect(hasFilterParams({ developer: "d1" })).toBe(true);
    expect(hasFilterParams({ sort: "price_asc" })).toBe(true);
    expect(hasFilterParams({ sort: "newest" })).toBe(false);
    expect(hasFilterParams({ sort: "bogus", q: "", developer: "" })).toBe(false);
  });
});
