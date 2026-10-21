import { describe, expect, it } from "vitest";

import { formatPriceRange, formatRoomsArea, formatUnitsSummary } from "./list-summary";

describe("formatUnitsSummary", () => {
  it("số căn có dấu chấm nghìn; thiếu → —", () => {
    expect(formatUnitsSummary(1200)).toBe("1.200 căn");
    expect(formatUnitsSummary(0)).toBe("0 căn");
    expect(formatUnitsSummary(undefined)).toBe("—");
    expect(formatUnitsSummary(null)).toBe("—");
  });
});

describe("formatPriceRange", () => {
  it("cùng đơn vị dùng chung hậu tố", () => expect(formatPriceRange(2_100_000_000, 3_500_000_000)).toBe("2,1 – 3,5 tỷ"));
  it("khác đơn vị ghi đủ", () => expect(formatPriceRange(850_000_000, 1_200_000_000)).toBe("850 triệu – 1,2 tỷ"));
  it("tối đa 2 chữ số lẻ, bỏ 0 thừa", () => {
    expect(formatPriceRange(2_000_000_000, 3_456_000_000)).toBe("2 – 3,46 tỷ");
  });
  it("một đầu", () => {
    expect(formatPriceRange(2_100_000_000, undefined)).toBe("Từ 2,1 tỷ");
    expect(formatPriceRange(null, 3_500_000_000)).toBe("Đến 3,5 tỷ");
  });
  it("bằng nhau → một giá", () => expect(formatPriceRange(900_000_000, 900_000_000)).toBe("900 triệu"));
  it("thiếu cả hai → —", () => expect(formatPriceRange(undefined, null)).toBe("—"));
  it("dưới 1 triệu giữ số đầy đủ", () => expect(formatPriceRange(500_000, 800_000)).toBe("500.000 – 800.000 ₫"));
});

describe("formatPriceRange: làm tròn + giá 0", () => {
  it("chọn đơn vị sau khi làm tròn", () => expect(formatPriceRange(999_999_999, 2_000_000_000)).toBe("1 – 2 tỷ"));
  it("hai đầu ra cùng chuỗi → một giá", () => expect(formatPriceRange(999_999_999, 1_000_000_000)).toBe("1 tỷ"));
  it("giá 0 coi như chưa có", () => {
    expect(formatPriceRange(0, 0)).toBe("—");
    expect(formatPriceRange(0, 3_000_000_000)).toBe("Đến 3 tỷ");
    expect(formatPriceRange(2_000_000_000, 0)).toBe("Từ 2 tỷ");
  });
});

describe("formatRoomsArea", () => {
  it("đủ", () => expect(formatRoomsArea(2, 75)).toBe("2 PN · 75 m²"));
  it("0 PN → Studio", () => expect(formatRoomsArea(0, 30)).toBe("Studio · 30 m²"));
  it("thiếu PN → chỉ diện tích", () => expect(formatRoomsArea(undefined, 75)).toBe("75 m²"));
  it("thiếu diện tích → chỉ phòng", () => expect(formatRoomsArea(3, null)).toBe("3 PN"));
  it("thiếu cả hai → —", () => expect(formatRoomsArea(undefined, undefined)).toBe("—"));
});
