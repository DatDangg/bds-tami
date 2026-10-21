import { describe, expect, it } from "vitest";

import { mediaTypeLabel } from "./media-type-label";

describe("mediaTypeLabel (BL-051 A9)", () => {
  it("ảnh/video kèm định dạng, PDF chỉ định dạng", () => {
    expect(mediaTypeLabel("image/webp")).toBe("Ảnh · WEBP");
    expect(mediaTypeLabel("image/jpeg")).toBe("Ảnh · JPG");
    expect(mediaTypeLabel("video/mp4")).toBe("Video · MP4");
    expect(mediaTypeLabel("application/pdf")).toBe("PDF");
  });

  it("giá trị lạ/trống → chuỗi trống", () => {
    expect(mediaTypeLabel(undefined)).toBe("");
    expect(mediaTypeLabel("")).toBe("");
    expect(mediaTypeLabel("image")).toBe("");
    expect(mediaTypeLabel(42)).toBe("");
  });
});
