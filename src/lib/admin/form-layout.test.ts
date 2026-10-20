import type { CollectionConfig, Field } from "payload";
import { describe, expect, it } from "vitest";

import { withContentDefaults } from "../../collections/_shared/content-defaults";
import { findLayoutField, flattenLayoutFields, formRow, formTabs } from "./form-layout";

const text = (name: string): Field => ({ name, type: "text" });
const namesOf = (fields: readonly Field[]) => fields.map((field) => ("name" in field ? field.name : `(${field.type})`));

describe("form-layout", () => {
  it("formTabs tạo bộ tab KHÔNG tên (không đổi đường dẫn dữ liệu)", () => {
    const tabs = formTabs([{ label: "Nội dung", fields: [text("a")] }]);
    expect(tabs.type).toBe("tabs");
    expect(tabs.tabs.every((tab) => !("name" in tab))).toBe(true);
  });

  it("flattenLayoutFields trải phẳng tab không tên, row, collapsible; giữ nguyên field có tên và group", () => {
    const group: Field = { name: "seo", type: "group", fields: [text("metaTitle")] };
    const fields: Field[] = [
      text("title"),
      formTabs([
        { label: "A", fields: [formRow(text("x"), text("y")), group] },
        { label: "B", fields: [{ type: "collapsible", label: "C", fields: [text("z")] }] },
      ]),
    ];
    expect(namesOf(flattenLayoutFields(fields))).toEqual(["title", "x", "y", "seo", "z"]);
    expect(findLayoutField(fields, "z")).toMatchObject({ name: "z" });
    expect(findLayoutField(fields, "metaTitle")).toBeUndefined();
  });

  it("tab CÓ tên là một cấp dữ liệu nên không bị trải phẳng", () => {
    const named: Field = { type: "tabs", tabs: [{ name: "info", label: "Info", fields: [text("a")] }] };
    expect(flattenLayoutFields([named])).toEqual([]);
  });
});

describe("withContentDefaults: bố cục tab", () => {
  const base = (fields: Field[]): CollectionConfig => ({ slug: "news", fields });

  it("có bộ tab ở cấp gốc: seo + translation thành tab SEO / Bản dịch, trường dùng chung còn lại ở cấp gốc sau bộ tab", () => {
    const config = withContentDefaults(base([formTabs([{ label: "Nội dung", fields: [{ name: "title", type: "text", localized: true }] }])]));
    const [tabs, ...rest] = config.fields;
    expect(tabs?.type).toBe("tabs");
    const tabList = (tabs as { tabs: { label: string; fields: Field[] }[] }).tabs;
    expect(tabList.map((tab) => tab.label)).toEqual(["Nội dung", "SEO", "Bản dịch"]);
    expect(namesOf(tabList[1]!.fields)).toEqual(["seo"]);
    expect(namesOf(tabList[2]!.fields)).toEqual(["translation"]);
    // Cột phải theo thứ tự: trạng thái · ngày xuất bản · tác giả · nổi bật · khối "Nâng cao" (slug) · có bản EN.
    expect(namesOf(rest)).toEqual(["status", "publishedAt", "author", "isFeatured", "(collapsible)", "hasEnglish"]);
    expect(namesOf(flattenLayoutFields(rest))).toEqual(["status", "publishedAt", "author", "isFeatured", "slug", "hasEnglish"]);
    for (const field of rest) expect((field as { admin?: { position?: string } }).admin?.position).toBe("sidebar");
  });

  it("không có bộ tab: nối trường dùng chung vào cuối như cũ", () => {
    const config = withContentDefaults(base([{ name: "title", type: "text", localized: true }]));
    expect(namesOf(config.fields)).toEqual(["title", "status", "publishedAt", "author", "isFeatured", "(collapsible)", "hasEnglish", "translation", "seo"]);
  });
});
