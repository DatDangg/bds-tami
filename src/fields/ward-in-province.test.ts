import { describe, expect, it, vi } from "vitest";

import { validateWardInProvince, validateWardWithOptionalProvince } from "./ward-in-province";

const UUID = "11111111-2222-4333-8444-555555555555";

function options(wardProvince: string | null, siblingData: Record<string, unknown>, required = false) {
  const findByID = vi.fn(async () => (wardProvince === null ? null : { province: wardProvince }));
  // Validator `relationship` mặc định gọi find để kiểm id tồn tại; mock coi mọi id test là tồn tại.
  const find = vi.fn(async () => ({ docs: [{ id: "w1" }, { id: UUID }], totalDocs: 2 }));
  const req = { payload: { findByID, find, collections: { wards: { config: {} } } }, t: (key: string) => key, user: null };
  return { options: { req, siblingData, required, data: siblingData, id: "x", event: "update", relationTo: "wards", preferences: {}, collectionSlug: "projects", path: ["ward"], blockData: {}, operation: "update", overrideAccess: true } as never, findByID };
}

describe("validateWardInProvince", () => {
  it("phường sai tỉnh: câu tiếng Việt, không chứa UUID", async () => {
    const { options: o } = options("B", { province: "A" });
    const result = await validateWardInProvince(UUID, o);
    expect(result).toBe("Phường/xã không thuộc tỉnh/thành đã chọn.");
    expect(String(result)).not.toContain(UUID);
  });

  it("phường đúng tỉnh: hợp lệ (chấp nhận id số/chuỗi)", async () => {
    const { options: o } = options("7", { province: 7 });
    expect(await validateWardInProvince("w1", o)).toBe(true);
  });

  it("phường không tồn tại: câu tiếng Việt", async () => {
    const { options: o } = options(null, { province: "A" });
    expect(await validateWardInProvince(UUID, o)).toBe("Phường/xã không tồn tại.");
  });

  it("sửa riêng tỉnh (không gửi ward) vẫn so với phường đang lưu", async () => {
    const { options: o, findByID } = options("B", { province: "A", ward: UUID });
    expect(await validateWardInProvince(undefined, o)).toBe("Phường/xã không thuộc tỉnh/thành đã chọn.");
    expect(findByID).toHaveBeenCalledOnce();
  });

  it("thiếu phường + required: vẫn chạy validator mặc định (lỗi bắt buộc, không tra DB)", async () => {
    const { options: o, findByID } = options("A", { province: "A" }, true);
    const result = await validateWardInProvince(null, o);
    expect(result).not.toBe(true);
    expect(findByID).not.toHaveBeenCalled();
  });
});

describe("validateWardWithOptionalProvince", () => {
  it("chọn phường mà thiếu tỉnh là lỗi", async () => {
    const { options: o } = options("A", {});
    expect(await validateWardWithOptionalProvince("w1", o)).toBe("Chọn tỉnh/thành trước khi chọn phường/xã.");
  });

  it("phường không hợp lệ + thiếu tỉnh: câu thiếu tỉnh, không gọi validator mặc định (không lộ id)", async () => {
    const { options: o, findByID } = options(null, {});
    const result = await validateWardWithOptionalProvince(UUID, o);
    expect(result).toBe("Chọn tỉnh/thành trước khi chọn phường/xã.");
    expect(findByID).not.toHaveBeenCalled();
  });

  it("phường sai tỉnh: câu tiếng Việt không UUID", async () => {
    const { options: o } = options("B", { province: "A" });
    const result = await validateWardWithOptionalProvince(UUID, o);
    expect(result).toBe("Phường/xã không thuộc tỉnh/thành đã chọn.");
  });
});
