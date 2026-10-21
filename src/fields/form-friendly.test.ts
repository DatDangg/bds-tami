import type { Field, GroupField } from "payload";
import { describe, expect, it } from "vitest";

import { authorField } from "./author";
import { publishedAtField } from "./published-at";
import { markRequired, REQUIRED_MARK_CLASS } from "./required-by-locale";
import { scopedCategoryField } from "./scoped-category";
import { titleField } from "./title";
import { translationBlockFields, translationFields, translationGroup } from "./translation";

const adminOf = (field: unknown) => (field as { admin?: { className?: string; placeholder?: string; hidden?: boolean; description?: string } }).admin;

describe("form dễ dùng (BL-042): trường dùng chung", () => {
  it("markRequired thêm lớp * và giữ className sẵn có, không đổi required/validate", () => {
    const field = markRequired({ name: "x", type: "text", admin: { className: "abc", description: "d" } } as Field);
    expect(adminOf(field)).toMatchObject({ className: `abc ${REQUIRED_MARK_CLASS}`, description: "d" });
    expect((field as { required?: boolean }).required).toBeUndefined();
  });

  it("title: có dấu *, placeholder mặc định và theo collection, vẫn giữ Cell", () => {
    expect(adminOf(titleField())).toMatchObject({ className: REQUIRED_MARK_CLASS, placeholder: "Nhập tiêu đề" });
    expect(adminOf(titleField({ placeholder: "VD: Vinhomes Grand Park" }))?.placeholder).toBe("VD: Vinhomes Grand Park");
    expect((titleField().admin as { components?: { Cell?: string } }).components?.Cell).toContain("TitleLinkCell");
  });

  it("danh mục: bắt buộc thì có *, không bắt buộc (tuyển dụng) thì không; filterOptions theo scope giữ nguyên", () => {
    expect(adminOf(scopedCategoryField("project"))?.className).toBe(REQUIRED_MARK_CLASS);
    expect(adminOf(scopedCategoryField("job", { required: false }))?.className).toBeUndefined();
    expect(scopedCategoryField("project").filterOptions).toEqual({ scope: { equals: "project" } });
  });

  it("author: defaultValue là HÀM trả id người đăng nhập (không thành DEFAULT ở DB); access chỉ admin giữ nguyên", () => {
    const field = authorField();
    expect(typeof field.defaultValue).toBe("function");
    const resolve = field.defaultValue as (args: { user?: { id: number } | null }) => unknown;
    expect(resolve({ user: { id: 7 } })).toBe(7);
    expect(resolve({ user: null })).toBeUndefined();
    expect(field.required).toBe(true);
    expect(field.access?.create).toBeTypeOf("function");
  });

  it("publishedAt có câu giải thích", () => {
    expect(adminOf(publishedAtField())?.description).toBe("Tự điền khi xuất bản lần đầu.");
  });

  it("hasEnglish có giải thích 1 câu, vẫn chỉ đọc", () => {
    const hasEnglish = translationFields().find((field) => "name" in field && field.name === "hasEnglish");
    expect(adminOf(hasEnglish)?.description).toBe("Bật thì website có trang tiếng Anh; hệ thống tự dịch từ bản tiếng Việt.");
    expect((hasEnglish as { admin?: { readOnly?: boolean } }).admin?.readOnly).toBe(true);
  });

  it("collection nội dung: nhóm translation ẩn cả nhóm, không chứa ui; tóm tắt rồi nút Dịch lại do translationBlockFields (đặt cạnh công tắc)", () => {
    const group = translationFields().find((field) => "name" in field && field.name === "translation") as GroupField;
    expect(adminOf(group)?.hidden).toBe(true);
    expect(group.fields.some((field) => field.type === "ui")).toBe(false);
    expect(translationBlockFields().map((field) => ("name" in field ? field.name : null))).toEqual(["translationSummary", "retranslateAction"]);
  });

  it("global: nhóm translation (translationGroup()) vẫn hiện, trường hệ thống ẩn khỏi form, có dòng tóm tắt (ui) trước nút Dịch lại; dữ liệu vẫn còn", () => {
    const fields = (translationGroup() as GroupField).fields;
    const hidden = ["status", "enSource", "viChangedAfterManual", "sourceHash", "translatedAt", "model", "lastError"];
    for (const name of hidden) {
      const field = fields.find((candidate) => "name" in candidate && candidate.name === name);
      expect(field, name).toBeDefined();
      expect(adminOf(field)?.hidden, name).toBe(true);
    }
    const names = fields.map((field) => ("name" in field ? field.name : null));
    expect(names.indexOf("translationSummary")).toBeGreaterThan(names.indexOf("lastError"));
    expect(names.indexOf("translationSummary")).toBeLessThan(names.indexOf("retranslateAction"));
    const summary = fields.find((field) => "name" in field && field.name === "translationSummary") as { type: string; admin: { components: { Field: string } } };
    expect(summary.type).toBe("ui");
    expect(summary.admin.components.Field).toContain("TranslationSummary");
  });
});
