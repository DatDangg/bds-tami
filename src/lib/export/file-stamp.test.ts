import { describe, expect, it } from "vitest";

import { exportFileStamp } from "./file-stamp";

describe("exportFileStamp", () => {
  it("qua nửa đêm giờ VN: 17:23 UTC ngày 19 -> 00:23 ngày 20", () => {
    expect(exportFileStamp(new Date("2026-11-19T17:23:00Z"))).toBe("202611200023");
  });

  it("qua giao thừa: 17:30 UTC 31/12 -> 00:30 01/01 năm sau", () => {
    expect(exportFileStamp(new Date("2026-12-31T17:30:00Z"))).toBe("202701010030");
  });

  it("giờ trong ngày và nửa đêm đúng 24h (không ra 24:00)", () => {
    expect(exportFileStamp(new Date("2026-11-19T03:05:00Z"))).toBe("202611191005");
    expect(exportFileStamp(new Date("2026-11-19T17:00:00Z"))).toBe("202611200000");
  });
});
