import { describe, expect, it } from "vitest";

import { altFromFilename, FALLBACK_IMAGE_ALT } from "./alt-from-filename";

describe("altFromFilename", () => {
  it.each([
    ["can-ho-view-song.jpg", "can ho view song"],
    ["Phoi_canh__Vinhomes.2026.PNG", "Phoi canh Vinhomes 2026"],
    ["C:\\anh\\Mat bang T5.webp", "Mat bang T5"],
    ["Căn hộ 2PN.jpeg", "Căn hộ 2PN"],
  ])("%s → %s", (name, expected) => {
    expect(altFromFilename(name)).toBe(expected);
  });

  it.each([undefined, null, "", ".jpg", "1234.jpg", "0b8f5d3e-1c2a-4f6b-9a7d-3e5c8b1a2d4f.jpg"])("%s → dự phòng", (name) => {
    expect(altFromFilename(name)).toBe(FALLBACK_IMAGE_ALT);
  });

  it("cắt tên quá dài", () => {
    expect(altFromFilename(`${"a".repeat(300)}.jpg`).length).toBeLessThanOrEqual(120);
  });
});
