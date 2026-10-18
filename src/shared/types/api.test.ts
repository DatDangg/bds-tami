import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiErrorSchema, apiResponseSchema, rentalSearchParamsSchema } from "./api";

describe("api schemas", () => {
  const schema = apiResponseSchema(z.object({ id: z.number() }));

  it("nhận thành công và lỗi theo response contract", () => {
    expect(schema.safeParse({ success: true, data: { id: 1 } }).success).toBe(true);
    expect(schema.safeParse({ success: false, error: "x", details: [] }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ success: false, error: "x", details: [{ a: 1 }] }).success).toBe(true);
  });

  it("từ chối data sai kiểu hoặc thiếu error", () => {
    expect(schema.safeParse({ success: true, data: { id: "1" } }).success).toBe(false);
    expect(schema.safeParse({ success: false }).success).toBe(false);
  });
});

describe("rentalSearchParamsSchema (API_SPEC §3.3)", () => {
  it("mặc định: vi, newest, trang 1, 12 tin; giá trị rỗng coi như không truyền", () => {
    expect(rentalSearchParamsSchema.parse({ q: "", category: "  ", priceMin: "" })).toEqual({ locale: "vi", sort: "newest", page: 1, limit: 12 });
  });

  it("ép kiểu số từ chuỗi và cắt khoảng trắng của q", () => {
    expect(rentalSearchParamsSchema.parse({ q: " studio ", priceMin: "5000000", areaMax: "60.5", bedrooms: "4", page: "2", limit: "48" })).toMatchObject({
      q: "studio", priceMin: 5_000_000, areaMax: 60.5, bedrooms: 4, page: 2, limit: 48,
    });
  });

  it.each([
    { limit: "49" }, { limit: "0" }, { page: "0" }, { page: "501" }, { locale: "fr" }, { sort: "random" }, { furnishing: "luxury" },
    { bedrooms: "5" }, { bedrooms: "-1" }, { bedrooms: "1.5" }, { priceMin: "abc" }, { priceMin: "-1" }, { areaMin: "NaN" },
    { priceMin: "10", priceMax: "5" }, { areaMin: "50", areaMax: "20" }, { q: "x".repeat(101) },
  ])("từ chối %j", (input) => {
    expect(rentalSearchParamsSchema.safeParse(input).success).toBe(false);
  });
});
