import { describe, expect, it } from "vitest";
import { POST_SECTION_DOM_ID, visiblePostSections } from "./post-detail-sections";

const none = { hasOffer: false, hasLocation: false, hasGallery: false, hasRelated: false };

describe("visiblePostSections", () => {
  it("chỉ có Tổng quan khi không có ưu đãi, vị trí, ảnh, tin liên quan", () => {
    expect(visiblePostSections(none)).toEqual(["overview"]);
  });

  it("đủ mục theo thứ tự cố định (BL-052)", () => {
    expect(visiblePostSections({ hasOffer: true, hasLocation: true, hasGallery: true, hasRelated: true })).toEqual(["overview", "offer", "location", "gallery", "related"]);
  });

  it("ẩn mục rỗng, giữ thứ tự", () => {
    expect(visiblePostSections({ ...none, hasLocation: true, hasRelated: true })).toEqual(["overview", "location", "related"]);
  });

  it("id DOM không dịch theo ngôn ngữ", () => {
    expect(POST_SECTION_DOM_ID.overview).toBe("overview");
    expect(POST_SECTION_DOM_ID.related).toBe("related");
  });
});
