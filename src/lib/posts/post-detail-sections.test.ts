import { describe, expect, it } from "vitest";
import { POST_SECTION_DOM_ID, visiblePostSections } from "./post-detail-sections";

describe("visiblePostSections", () => {
  it("chỉ có Tổng quan khi không có ưu đãi, nội dung, ảnh", () => {
    expect(visiblePostSections({ hasOffer: false, hasContent: false, hasGallery: false })).toEqual(["overview"]);
  });

  it("đủ mục theo thứ tự cố định", () => {
    expect(visiblePostSections({ hasOffer: true, hasContent: true, hasGallery: true })).toEqual(["overview", "offer", "content", "gallery"]);
  });

  it("ẩn mục rỗng, giữ thứ tự", () => {
    expect(visiblePostSections({ hasOffer: false, hasContent: true, hasGallery: true })).toEqual(["overview", "content", "gallery"]);
  });

  it("id DOM không dịch theo ngôn ngữ", () => {
    expect(POST_SECTION_DOM_ID.overview).toBe("overview");
  });
});
