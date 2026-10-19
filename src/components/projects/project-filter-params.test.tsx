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

  it("URL cũ đọc ra đúng bộ lọc: giá trị lạ/quá dài bị bỏ, tham số ngoài (utm) bỏ qua, không có tham số từ khoá", () => {
    const raw = Object.fromEntries(new URLSearchParams("category=can-ho&province=da-nang&status=handed_over&utm_source=fb&q=abc"));
    expect(parseProjectFilters(raw)).toEqual({ categorySlug: "can-ho", provinceSlug: "da-nang", status: "handed_over" });
    expect(parseProjectFilters({ status: "sai", province: "x".repeat(101) })).toEqual({});
  });

  it("noindex chỉ khi có tham số lọc có giá trị (province= rỗng do form gửi 'Tất cả' không tính)", () => {
    expect(hasFilterParams({ province: "", status: "" })).toBe(false);
    expect(hasFilterParams({ status: "selling" })).toBe(true);
  });
});
