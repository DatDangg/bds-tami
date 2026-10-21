import { describe, expect, it } from "vitest";
import { countActiveFilters, firstParam, listingHref, parseMultiValue, serializeMultiValue } from "./listing-params";

const PROVINCES = ["ha-noi", "bac-ninh", "hung-yen"] as const;

describe("parseMultiValue", () => {
  it("nhận `a,b`, khoá lặp và kết hợp cả hai; cắt khoảng trắng, bỏ rỗng / trùng", () => {
    expect(parseMultiValue("ha-noi,bac-ninh")).toEqual(["ha-noi", "bac-ninh"]);
    expect(parseMultiValue(["ha-noi", "bac-ninh,hung-yen"])).toEqual(["ha-noi", "bac-ninh", "hung-yen"]);
    expect(parseMultiValue(" ha-noi , ,ha-noi,")).toEqual(["ha-noi"]);
    expect(parseMultiValue(undefined)).toEqual([]);
    expect(parseMultiValue("")).toEqual([]);
  });

  it("có danh sách hợp lệ: bỏ giá trị lạ, thứ tự theo danh sách (ổn định bất kể thứ tự trên URL)", () => {
    expect(parseMultiValue("hung-yen,xyz,ha-noi", PROVINCES)).toEqual(["ha-noi", "hung-yen"]);
    expect(parseMultiValue(["bac-ninh", "ha-noi"], PROVINCES)).toEqual(["ha-noi", "bac-ninh"]);
    expect(parseMultiValue("<script>", PROVINCES)).toEqual([]);
  });

  it("serialize ngược lại `a,b`; rỗng → chuỗi rỗng", () => {
    expect(serializeMultiValue(["ha-noi", "bac-ninh"])).toBe("ha-noi,bac-ninh");
    expect(serializeMultiValue([])).toBe("");
  });
});

describe("firstParam", () => {
  it("khoá lặp lấy giá trị đầu, cắt khoảng trắng; thiếu → rỗng", () => {
    expect(firstParam([" a ", "b"])).toBe("a");
    expect(firstParam("x")).toBe("x");
    expect(firstParam(undefined)).toBe("");
  });
});

describe("listingHref", () => {
  it("giữ tham số khác, bỏ `page`, đặt giá trị mới", () => {
    expect(listingHref("/du-an", { q: "vin", page: "3", status: "selling" }, { status: "upcoming" })).toBe("/du-an?q=vin&status=upcoming");
  });

  it("null / chuỗi rỗng / mảng rỗng bỏ tham số; không còn gì → chỉ đường dẫn", () => {
    expect(listingHref("/du-an", { status: "selling", page: "2" }, { status: null })).toBe("/du-an");
    expect(listingHref("/du-an", { status: "selling" }, { status: "" })).toBe("/du-an");
    expect(listingHref("/du-an", { province: "ha-noi" }, { province: [] })).toBe("/du-an");
  });

  it("mảng ghi `a,b`; khoá lặp đang có trên URL gộp thành `a,b`; khoá mới nối cuối", () => {
    expect(listingHref("/en/du-an", { q: "a b", province: ["ha-noi", "bac-ninh"] }, { type: ["villa", "apartment"] })).toBe(
      "/en/du-an?q=a+b&province=ha-noi%2Cbac-ninh&type=villa%2Capartment",
    );
  });

  it("không patch → URL sạch của bộ lọc hiện tại (bỏ trang, bỏ rỗng)", () => {
    expect(listingHref("/du-an", { q: "", sort: "price_asc", page: "4", x: undefined })).toBe("/du-an?sort=price_asc");
  });
});

describe("countActiveFilters", () => {
  const spec = { single: ["status", "developer"], multi: ["province", "feature"], ranges: [["priceMin", "priceMax"]] } as const;

  it("đơn = 1, nhiều giá trị = số giá trị, khoảng = 1 nếu có một đầu; từ khoá / sắp xếp / trang không tính", () => {
    expect(
      countActiveFilters({ status: "selling", developer: "", province: "ha-noi,bac-ninh", feature: ["near_school"], priceMax: "20", q: "vin", sort: "price_asc", page: "2" }, spec),
    ).toBe(5);
  });

  it("không có lọc → 0", () => {
    expect(countActiveFilters({ q: "abc" }, spec)).toBe(0);
    expect(countActiveFilters({}, {})).toBe(0);
  });
});
