import { describe, expect, it } from "vitest";
import { RENTAL_SECTION_DOM_ID, RENTAL_SECTION_IDS, visibleRentalSections } from "./rental-detail-sections";

const empty = { hasTerms: false, hasDescription: false, videoUrl: null, map: null, legalNote: null, amenities: [] };
const full = {
  hasTerms: true,
  hasDescription: true,
  videoUrl: "https://youtu.be/abc",
  map: { location: { lat: 21, lng: 105 }, approximate: true },
  legalNote: "Sổ hồng",
  amenities: ["pool" as const],
};

describe("visibleRentalSections", () => {
  it("không có dữ liệu nào → chỉ còn Thông tin chi tiết", () => {
    expect(visibleRentalSections(empty)).toEqual(["details"]);
  });

  it("đủ dữ liệu → đúng thứ tự trang", () => {
    expect(visibleRentalSections(full)).toEqual(["overview", "details", "amenities", "terms", "video", "location", "legal"]);
  });

  it("mỗi mục chỉ vào thanh khi có đúng dữ liệu của nó", () => {
    expect(visibleRentalSections({ ...empty, hasDescription: true })).toEqual(["overview", "details"]);
    expect(visibleRentalSections({ ...empty, amenities: full.amenities })).toEqual(["details", "amenities"]);
    expect(visibleRentalSections({ ...empty, hasTerms: true })).toEqual(["details", "terms"]);
    expect(visibleRentalSections({ ...empty, videoUrl: full.videoUrl })).toEqual(["details", "video"]);
    expect(visibleRentalSections({ ...empty, map: full.map })).toEqual(["details", "location"]);
    expect(visibleRentalSections({ ...empty, legalNote: "x" })).toEqual(["details", "legal"]);
  });

  it("mọi mục có DOM id duy nhất", () => {
    const ids = RENTAL_SECTION_IDS.map((id) => RENTAL_SECTION_DOM_ID[id]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
