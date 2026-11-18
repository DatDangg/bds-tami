import type { RelationshipField } from "payload";
import { describe, expect, it } from "vitest";

import { withMaxSelection } from "./max-selection";

type Field = RelationshipField & { name: string; hasMany: true };
const base = { name: "items", type: "relationship", relationTo: "projects", hasMany: true } as Field;
const callFilter = (field: Field, siblingData: unknown) => (field.filterOptions as (args: unknown) => unknown)({ siblingData, relationTo: "projects" });

describe("withMaxSelection", () => {
  it("đặt maxRows và thêm MaxSelectionHint vào afterInput (giữ cái sẵn có)", () => {
    const field = withMaxSelection({ ...base, admin: { components: { afterInput: ["/x#Y"] } } } as Field, 6, "dự án");
    expect(field.maxRows).toBe(6);
    expect(field.admin?.components?.afterInput).toEqual(["/x#Y", { path: "/components/admin/MaxSelectionHint#MaxSelectionHint", clientProps: { max: 6, unit: "dự án" } }]);
  });

  it("chưa đủ → giữ filter gốc (true nếu không có); đủ → khoá vào đúng các id đã chọn", async () => {
    const field = withMaxSelection(base, 2, "dự án");
    expect(await callFilter(field, { items: ["a"] })).toBe(true);
    expect(await callFilter(field, undefined)).toBe(true);
    expect(await callFilter(field, { items: ["a", { id: "b" }] })).toEqual({ id: { in: ["a", "b"] } });
  });

  it("đủ + có filter gốc → AND; filter gốc dạng hàm cũng được", async () => {
    const scoped = withMaxSelection({ ...base, filterOptions: { scope: { equals: "rental" } } } as Field, 1, "danh mục");
    expect(await callFilter(scoped, { items: ["a"] })).toEqual({ and: [{ scope: { equals: "rental" } }, { id: { in: ["a"] } }] });
    const fn = withMaxSelection({ ...base, filterOptions: () => ({ scope: { equals: "sale" } }) } as Field, 1, "danh mục");
    expect(await callFilter(fn, { items: ["a"] })).toEqual({ and: [{ scope: { equals: "sale" } }, { id: { in: ["a"] } }] });
    expect(await callFilter(fn, { items: [] })).toEqual({ scope: { equals: "sale" } });
  });

  it("validate: vượt giới hạn trả lỗi tiếng Việt trước khi gọi validate gốc", async () => {
    let called = false;
    const field = withMaxSelection({ ...base, validate: () => ((called = true), true) } as Field, 2, "bài viết");
    const validate = field.validate as (value: unknown, options: unknown) => unknown;
    expect(await validate(["a", "b", "c"], {})).toBe("Tối đa 2 bài viết.");
    expect(called).toBe(false);
    expect(await validate(["a"], {})).toBe(true);
    expect(called).toBe(true);
  });
});
