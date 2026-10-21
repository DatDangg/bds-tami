import { describe, expect, it } from "vitest";
import { fakeMedia } from "@/components/media/test-utils";
import { RENTAL_SECTION_DOM_ID, RENTAL_SECTION_IDS, visibleRentalSections } from "./rental-detail-sections";

const empty = { hasTerms: false, map: null, legalNote: null, amenities: [], gallery: [fakeMedia("g1")] };
const full = {
  hasTerms: true,
  map: { location: { lat: 21, lng: 105 }, approximate: true },
  legalNote: "Sổ hồng",
  amenities: ["pool" as const],
  gallery: [fakeMedia("g1"), fakeMedia("g2")],
};

describe("visibleRentalSections", () => {
  it("không có dữ liệu nào → chỉ còn Tổng quan (lưới thông tin luôn có mã tin)", () => {
    expect(visibleRentalSections(empty)).toEqual(["overview"]);
  });

  it("đủ dữ liệu → đúng thứ tự trang (BL-052)", () => {
    expect(visibleRentalSections(full)).toEqual(["overview", "location", "amenities", "gallery", "terms", "legal"]);
  });

  it("mỗi mục chỉ vào thanh khi có đúng dữ liệu của nó; Hình ảnh cần ≥ 2 ảnh", () => {
    expect(visibleRentalSections({ ...empty, map: full.map })).toEqual(["overview", "location"]);
    expect(visibleRentalSections({ ...empty, amenities: full.amenities })).toEqual(["overview", "amenities"]);
    expect(visibleRentalSections({ ...empty, gallery: full.gallery })).toEqual(["overview", "gallery"]);
    expect(visibleRentalSections({ ...empty, gallery: [] })).toEqual(["overview"]);
    expect(visibleRentalSections({ ...empty, hasTerms: true })).toEqual(["overview", "terms"]);
    expect(visibleRentalSections({ ...empty, legalNote: "x" })).toEqual(["overview", "legal"]);
  });

  it("mọi mục có DOM id duy nhất", () => {
    const ids = RENTAL_SECTION_IDS.map((id) => RENTAL_SECTION_DOM_ID[id]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
