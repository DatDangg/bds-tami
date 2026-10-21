import { describe, expect, it } from "vitest";
import { effectivePriceFromVnd } from "./project-price";

describe("effectivePriceFromVnd (BL-052 Quyết định 6)", () => {
  it("min priceTable[].priceFrom > 0 đi trước priceFromVnd", () => {
    expect(effectivePriceFromVnd({ priceFromVnd: 1_000_000_000, priceTable: [{ unitType: "A", priceFrom: 6_000_000_000 }, { unitType: "B", priceFrom: 5_400_000_000 }] })).toBe(5_400_000_000);
  });

  it("bỏ giá 0 / trống / âm trong bảng giá", () => {
    expect(
      effectivePriceFromVnd({ priceTable: [{ unitType: "A", priceFrom: 0 }, { unitType: "B", priceFrom: null }, { unitType: "C", priceFrom: -5 }, { unitType: "D", priceFrom: 3_000_000_000 }] }),
    ).toBe(3_000_000_000);
  });

  it("bảng giá không có giá → priceFromVnd > 0; không có → null", () => {
    expect(effectivePriceFromVnd({ priceFromVnd: 2_500_000_000, priceTable: [{ unitType: "A", priceFrom: null }] })).toBe(2_500_000_000);
    expect(effectivePriceFromVnd({ priceFromVnd: 2_500_000_000 })).toBe(2_500_000_000);
    expect(effectivePriceFromVnd({ priceFromVnd: 0, priceTable: [] })).toBeNull();
    expect(effectivePriceFromVnd({ priceFromVnd: null, priceTable: null })).toBeNull();
    expect(effectivePriceFromVnd({})).toBeNull();
  });
});
