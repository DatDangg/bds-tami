import { describe, expect, it } from "vitest";
import { RENTAL_SECTION_DOM_ID, RENTAL_SECTION_IDS, visibleRentalSections } from "./rental-detail-sections";

const empty = { hasTerms: false, hasDescription: false, videoUrl: null, map: null, legalNote: null };
const full = {
  hasTerms: true,
  hasDescription: true,
  videoUrl: "https://youtu.be/abc",
  map: { location: { lat: 21, lng: 105 }, approximate: true },
  legalNote: "Sổ hồng",
};

describe("visibleRentalSections", () => {
  it("không có dữ liệu nào → chỉ còn Tổng quan", () => {
    expect(visibleRentalSections(empty)).toEqual(["overview"]);
  });

  it("đủ dữ liệu → đúng thứ tự trang", () => {
    expect(visibleRentalSections(full)).toEqual(["overview", "terms", "description", "video", "location", "legal"]);
  });

  it("mỗi mục chỉ vào thanh khi có đúng dữ liệu của nó", () => {
    expect(visibleRentalSections({ ...empty, hasTerms: true })).toEqual(["overview", "terms"]);
    expect(visibleRentalSections({ ...empty, hasDescription: true })).toEqual(["overview", "description"]);
    expect(visibleRentalSections({ ...empty, videoUrl: full.videoUrl })).toEqual(["overview", "video"]);
    expect(visibleRentalSections({ ...empty, map: full.map })).toEqual(["overview", "location"]);
    expect(visibleRentalSections({ ...empty, legalNote: "x" })).toEqual(["overview", "legal"]);
  });

  it("mọi mục có DOM id duy nhất", () => {
    const ids = RENTAL_SECTION_IDS.map((id) => RENTAL_SECTION_DOM_ID[id]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
