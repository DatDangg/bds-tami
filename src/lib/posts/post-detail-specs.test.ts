import { describe, expect, it } from "vitest";
import type { PropertyPost, Province, Ward } from "../../payload-types";
import { toPostDetailSpecs } from "./post-detail-specs";
import { isVoucherPost } from "./post-kind";

const post = (overrides: Partial<PropertyPost> = {}): PropertyPost => ({ id: "p1", title: "Tin", updatedAt: "", createdAt: "", ...overrides }) as PropertyPost;
const province = { id: "pv", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM" } as Province;
const ward = { id: "w", name: "Phường Sài Gòn" } as Ward;

describe("toPostDetailSpecs", () => {
  it("tin BĐS đủ trường: định dạng theo ngôn ngữ", () => {
    const specs = toPostDetailSpecs(
      post({
        priceVnd: 3_500_000_000,
        areaM2: 85.5,
        bedrooms: 2,
        bathrooms: 0,
        houseDirection: "SE",
        frontageM: 5,
        floors: 3,
        propertyType: "townhouse",
        handoverCondition: "basic",
        address: " 12 Nguyễn Huệ ",
        location: [106.7, 10.77],
      }),
      "vi",
    );
    expect(specs).toEqual({
      isVoucher: false,
      price: "3,5 tỷ",
      area: "85,5 m²",
      bedrooms: 2,
      bathrooms: 0,
      direction: "SE",
      frontage: "5 m",
      floors: 3,
      propertyType: "townhouse",
      handover: "basic",
      place: "12 Nguyễn Huệ",
      map: { lat: 10.77, lng: 106.7 },
    });
    expect(toPostDetailSpecs(post({ priceVnd: 3_500_000_000, areaM2: 85.5 }), "en")).toMatchObject({ price: "3.5 billion VND", area: "85.5 m²" });
  });

  it("tin cũ trống: mọi ô null (UI bỏ ô); giá lấy ghi chú giá khi không có số", () => {
    expect(toPostDetailSpecs(post(), "vi")).toEqual({
      isVoucher: false,
      price: null,
      area: null,
      bedrooms: null,
      bathrooms: null,
      direction: null,
      frontage: null,
      floors: null,
      propertyType: null,
      handover: null,
      place: null,
      map: null,
    });
    expect(toPostDetailSpecs(post({ priceNote: " Thương lượng " }), "vi").price).toBe("Thương lượng");
  });

  it("giá trị lạ / không hợp lệ bị bỏ", () => {
    const specs = toPostDetailSpecs(
      post({ priceVnd: 0, areaM2: -1, bedrooms: 1.5, houseDirection: "X" as never, propertyType: "castle" as never, location: [500, 500] }),
      "vi",
    );
    expect(specs).toMatchObject({ price: null, area: null, bedrooms: null, direction: null, propertyType: null, map: null });
  });

  it("không có địa chỉ → khu vực 'Phường, Tỉnh' (tên ngắn tỉnh)", () => {
    expect(toPostDetailSpecs(post({ ward, province }), "vi").place).toBe("Phường Sài Gòn, TP.HCM");
    expect(toPostDetailSpecs(post({ province: "pv" }), "vi").place).toBeNull();
  });
});

describe("isVoucherPost", () => {
  it("có ưu đãi và không có giá lẫn diện tích → voucher", () => {
    expect(isVoucherPost(post({ offer: { voucherCode: "TAMI" } }))).toBe(true);
    expect(isVoucherPost(post({ offer: { endAt: "2026-10-30T00:00:00.000Z" }, priceNote: "Liên hệ" }))).toBe(true);
  });

  it("tin bán kèm ưu đãi (có giá hoặc diện tích) hoặc không có ưu đãi → không phải voucher", () => {
    expect(isVoucherPost(post({ offer: { voucherCode: "TAMI" }, priceVnd: 1_000_000 }))).toBe(false);
    expect(isVoucherPost(post({ offer: { endAt: "2026-10-30T00:00:00.000Z" }, areaM2: 50 }))).toBe(false);
    expect(isVoucherPost(post({ offer: { voucherCode: "  " } }))).toBe(false);
  });

  it("cùng quy tắc với thẻ danh sách: hạn ưu đãi không parse được không tính là có ưu đãi", () => {
    expect(isVoucherPost(post({ offer: { endAt: "không-phải-ngày" } }))).toBe(false);
    expect(toPostDetailSpecs(post({ offer: { endAt: "không-phải-ngày" } }), "vi").isVoucher).toBe(false);
  });
});
