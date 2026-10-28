import { describe, expect, it, vi } from "vitest";

// Barrel @payloadcms/ui kéo .css không nạp được trong vitest → chỉ test hàm thuần.
vi.mock("@payloadcms/ui", () => ({ RelationshipInput: () => null, useField: () => ({}), useFormFields: () => undefined }));

import { provincePathOf, shouldResetWard, wardFilterForProvince } from "./WardField";

describe("WardField helpers", () => {
  it("provincePathOf: ô province cùng cấp, kể cả path lồng", () => {
    expect(provincePathOf("ward")).toBe("province");
    expect(provincePathOf("location.ward")).toBe("location.province");
  });

  it("wardFilterForProvince: lọc theo tỉnh (id thô hoặc đã populate), chưa chọn = không lọc", () => {
    expect(wardFilterForProvince("p1")).toEqual({ wards: { province: { equals: "p1" } } });
    expect(wardFilterForProvince({ id: 5 })).toEqual({ wards: { province: { equals: "5" } } });
    expect(wardFilterForProvince(null)).toBeUndefined();
    expect(wardFilterForProvince(undefined)).toBeUndefined();
  });

  it("shouldResetWard: chỉ khi đổi từ tỉnh A sang tỉnh khác; nạp bản ghi / lần đầu thì giữ", () => {
    expect(shouldResetWard("a", "b")).toBe(true);
    expect(shouldResetWard("a", null)).toBe(true);
    expect(shouldResetWard("a", "a")).toBe(false);
    expect(shouldResetWard(null, "a")).toBe(false);
    expect(shouldResetWard(null, null)).toBe(false);
  });
});
