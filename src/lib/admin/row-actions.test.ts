// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTIONS } from "../../collections/admin-collections";
import { isRowAuthor, ROW_ACTION_COLLECTIONS, ROW_ACTIONS_FIELD_NAME, rowActionVisibility, withRowActionsColumn } from "./row-actions";

const ALL = { create: true, update: true };
const ADMIN = { id: "u-admin", role: "admin" };
const SALE = { id: "u-sale", role: "sale" };

describe("isRowAuthor", () => {
  it("author dạng id (string/number) hoặc object populate", () => {
    expect(isRowAuthor("u-sale", "u-sale")).toBe(true);
    expect(isRowAuthor(7, 7)).toBe(true);
    expect(isRowAuthor(7, "7")).toBe(true);
    expect(isRowAuthor({ id: "u-sale", email: "x@example.test" }, "u-sale")).toBe(true);
    expect(isRowAuthor("u-other", "u-sale")).toBe(false);
    expect(isRowAuthor({ id: "u-other" }, "u-sale")).toBe(false);
  });

  it("thiếu author / thiếu user / object không có id → false (an toàn)", () => {
    expect(isRowAuthor(undefined, "u-sale")).toBe(false);
    expect(isRowAuthor(null, "u-sale")).toBe(false);
    expect(isRowAuthor({}, "u-sale")).toBe(false);
    expect(isRowAuthor("u-sale", undefined)).toBe(false);
    expect(isRowAuthor("u-sale", null)).toBe(false);
  });
});

describe("rowActionVisibility (BL-051 A12)", () => {
  const input = (user: object | null, rowData: object, over: object = {}) => ({ user, permissions: ALL, rowData, disableDuplicate: false, ...over });

  it("admin: đủ Sửa, Nhân bản, Xoá ở mọi dòng", () => {
    expect(rowActionVisibility(input(ADMIN, { author: "u-sale" }))).toEqual({ edit: true, duplicate: true, trash: true });
  });

  it("sale, dòng của người khác: không Sửa, không Xoá (kể cả author populate)", () => {
    expect(rowActionVisibility(input(SALE, { author: "u-admin" }))).toMatchObject({ edit: false, trash: false });
    expect(rowActionVisibility(input(SALE, { author: { id: "u-admin" } }))).toMatchObject({ edit: false, trash: false });
  });

  it("sale, dòng của mình: Sửa + Xoá, author dạng id và dạng object populate", () => {
    expect(rowActionVisibility(input(SALE, { author: "u-sale" }))).toEqual({ edit: true, duplicate: true, trash: true });
    expect(rowActionVisibility(input(SALE, { author: { id: "u-sale", fullName: "A" } }))).toEqual({ edit: true, duplicate: true, trash: true });
  });

  it("sale, rowData thiếu author → không Sửa/Xoá", () => {
    expect(rowActionVisibility(input(SALE, {}))).toMatchObject({ edit: false, trash: false });
    expect(rowActionVisibility({ user: SALE, permissions: ALL, rowData: undefined, disableDuplicate: false })).toMatchObject({ edit: false, trash: false });
  });

  it("Xoá KHÔNG xét quyền delete cấp danh sách; Sửa vẫn cần quyền update; Nhân bản cần quyền create", () => {
    const noDelete = { create: true, update: true, delete: undefined };
    expect(rowActionVisibility({ ...input(SALE, { author: "u-sale" }), permissions: noDelete }).trash).toBe(true);
    expect(rowActionVisibility({ ...input(SALE, { author: "u-sale" }), permissions: { create: true } }).edit).toBe(false);
    expect(rowActionVisibility({ ...input(SALE, { author: "u-sale" }), permissions: { update: true } }).duplicate).toBe(false);
    expect(rowActionVisibility({ ...input(ADMIN, {}), permissions: undefined })).toEqual({ edit: false, duplicate: false, trash: true });
  });

  it("collection disableDuplicate (Trang pháp lý) → không Nhân bản", () => {
    expect(rowActionVisibility(input(ADMIN, {}, { disableDuplicate: true })).duplicate).toBe(false);
  });

  it("chưa đăng nhập → không nút nào", () => {
    expect(rowActionVisibility(input(null, { author: "u-sale" }))).toEqual({ edit: false, duplicate: false, trash: false });
  });
});

describe("withRowActionsColumn (cấu hình cột)", () => {
  const column = (slug: string) => ADMIN_COLLECTIONS.find((collection) => collection.slug === slug)!;

  it("7 collection nội dung có trường ui 'Thao tác' ở cuối fields + defaultColumns, có Cell, không bị ẩn khỏi 'Hiển thị cột'", () => {
    expect([...ROW_ACTION_COLLECTIONS].sort()).toEqual(["job-postings", "news", "pages", "projects", "property-posts", "rentals", "services"]);
    for (const slug of ROW_ACTION_COLLECTIONS) {
      const collection = column(slug);
      expect(collection.admin?.defaultColumns?.at(-1), slug).toBe(ROW_ACTIONS_FIELD_NAME);
      const field = collection.fields.at(-1) as { name?: string; type?: string; label?: string; admin?: { disableListColumn?: boolean; components?: unknown } };
      expect(field, slug).toMatchObject({ name: ROW_ACTIONS_FIELD_NAME, type: "ui", label: "Thao tác" });
      expect(JSON.stringify(field.admin?.components), slug).toContain("RowActionsCell#RowActionsCell");
      expect(field.admin?.disableListColumn, slug).not.toBe(true);
    }
  });

  it("Trang pháp lý vẫn disableDuplicate (client không hiện Nhân bản)", () => {
    expect(column("pages").disableDuplicate).toBe(true);
  });

  it("collection khác (Lead, Media…) không có cột; áp hai lần không nhân đôi", () => {
    expect(column("leads").admin?.defaultColumns ?? []).not.toContain(ROW_ACTIONS_FIELD_NAME);
    const once = withRowActionsColumn({ slug: "news", fields: [], admin: { defaultColumns: ["title"] } });
    expect(withRowActionsColumn(once)).toBe(once);
    expect(once.admin?.defaultColumns).toEqual(["title", ROW_ACTIONS_FIELD_NAME]);
  });
});
