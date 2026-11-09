import { describe, expect, it, vi } from "vitest";

import { RENTAL_CATEGORIES_MAX, validateRentalCategories } from "./blocks";

type ValidateOptions = Parameters<typeof validateRentalCategories>[1];

const makeOptions = (event: "onChange" | "submit", scopes: Record<string, string> = {}): ValidateOptions => {
  const find = vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => ({
    docs: where.id.in.filter((id) => id in scopes).map((id) => ({ id, scope: scopes[id] })),
  }));
  return { event, req: { payload: { find, collections: {}, db: { defaultIDType: "text" } }, t: (key: string) => key }, required: false, hasMany: true, maxRows: RENTAL_CATEGORIES_MAX, relationTo: "categories" } as unknown as ValidateOptions;
};

const ids = (count: number) => Array.from({ length: count }, (_, index) => `c${index + 1}`);
const MAX_MESSAGE = "Tối đa 4 danh mục.";

describe("validateRentalCategories", () => {
  it("báo lỗi tiếng Việt ngay ở onChange khi chọn quá 4 và không truy vấn DB", async () => {
    const options = makeOptions("onChange");
    expect(await validateRentalCategories(ids(5), options)).toBe(MAX_MESSAGE);
    expect(options.req.payload.find).not.toHaveBeenCalled();
  });

  it("chặn lưu quá 4 bằng câu tiếng Việt", async () => {
    expect(await validateRentalCategories(ids(5), makeOptions("submit"))).toBe(MAX_MESSAGE);
  });

  it("onChange với 1–4 danh mục vẫn hợp lệ", async () => {
    expect(await validateRentalCategories(ids(4), makeOptions("onChange"))).toBe(true);
  });

  it("lưu 4 danh mục scope rental hợp lệ", async () => {
    const scopes = Object.fromEntries(ids(4).map((id) => [id, "rental"]));
    expect(await validateRentalCategories(ids(4), makeOptions("submit", scopes))).toBe(true);
  });

  it("lưu danh mục khác scope rental bị chặn", async () => {
    const result = await validateRentalCategories(ids(2), makeOptions("submit", { c1: "rental", c2: "sale" }));
    expect(result).toBe('Chỉ chọn danh mục thuộc loại "Cho thuê".');
  });
});
