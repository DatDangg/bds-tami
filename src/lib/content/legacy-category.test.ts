import { describe, expect, it } from "vitest";
import { legacyCategoryOnly } from "./legacy-category";

describe("legacyCategoryOnly (BL-055 C-1)", () => {
  it("URL chỉ có ?category= → slug (trim); khoá lặp lấy giá trị đầu", () => {
    expect(legacyCategoryOnly({ category: "x" })).toBe("x");
    expect(legacyCategoryOnly({ category: " voucher " })).toBe("voucher");
    expect(legacyCategoryOnly({ category: ["x", "y"] })).toBe("x");
  });

  it("có khoá khác mang giá trị không rỗng (page / q / sort / lọc) → null", () => {
    expect(legacyCategoryOnly({ category: "x", page: "2" })).toBeNull();
    expect(legacyCategoryOnly({ category: "x", q: "a" })).toBeNull();
    expect(legacyCategoryOnly({ category: "x", sort: "price_asc" })).toBeNull();
    expect(legacyCategoryOnly({ category: "x", province: ["ha-noi"] })).toBeNull();
    expect(legacyCategoryOnly({ category: "x", utm_source: "fb" })).toBeNull();
  });

  it("khoá khác nhưng rỗng / chỉ khoảng trắng / undefined coi như không có → vẫn slug", () => {
    expect(legacyCategoryOnly({ category: "x", q: "" })).toBe("x");
    expect(legacyCategoryOnly({ category: "x", province: " ", type: undefined, feature: [""] })).toBe("x");
  });

  it("không có category / rỗng / quá dài → null", () => {
    expect(legacyCategoryOnly({})).toBeNull();
    expect(legacyCategoryOnly({ category: " " })).toBeNull();
    expect(legacyCategoryOnly({ category: "" })).toBeNull();
    expect(legacyCategoryOnly({ category: "x".repeat(101) })).toBeNull();
    expect(legacyCategoryOnly({ category: "x".repeat(100) })).toBe("x".repeat(100));
  });
});
