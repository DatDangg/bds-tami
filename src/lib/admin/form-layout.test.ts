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

  it("có bộ tab ở cấp gốc: seo thành tab SEO (không còn tab Bản dịch), trường dùng chung còn lại ở cấp gốc sau bộ tab", () => {
    const config = withContentDefaults(base([formTabs([{ label: "Nội dung", fields: [{ name: "title", type: "text", localized: true }] }])]));
    const [tabs, ...rest] = config.fields;
    expect(tabs?.type).toBe("tabs");
    const tabList = (tabs as { tabs: { label: string; fields: Field[] }[] }).tabs;
    expect(tabList.map((tab) => tab.label)).toEqual(["Nội dung", "SEO"]);
    expect(namesOf(tabList[1]!.fields)).toEqual(["seo"]);
    // Cột phải theo thứ tự: trạng thái · ngày xuất bản · tác giả · nổi bật · khối "Nâng cao" (slug) · khối "Bản dịch tiếng Anh" (công tắc EN + tóm tắt + nút).
    expect(namesOf(rest)).toEqual(["status", "publishedAt", "author", "isFeatured", "(collapsible)", "(collapsible)"]);
    expect(namesOf(flattenLayoutFields(rest))).toEqual(["status", "publishedAt", "author", "isFeatured", "slug", "hasEnglish", "translation", "translationSummary", "retranslateAction"]);
    for (const field of rest) expect((field as { admin?: { position?: string } }).admin?.position).toBe("sidebar");
  });

  it("không có bộ tab: nối trường dùng chung vào cuối như cũ", () => {
    const config = withContentDefaults(base([{ name: "title", type: "text", localized: true }]));
    expect(namesOf(config.fields)).toEqual(["title", "status", "publishedAt", "author", "isFeatured", "(collapsible)", "(collapsible)", "seo"]);
  });

  it("khối bản dịch cột phải: công tắc chỉ đọc + nhóm translation ẩn (đường dẫn dữ liệu giữ) + tóm tắt + nút Dịch lại + nút riêng của collection", () => {
    const config = withContentDefaults(base([{ name: "title", type: "text", localized: true }]), {
      translationActions: [{ name: "approveEnglishAction", type: "ui", admin: {} }],
    });
    const block = config.fields.find((field) => field.type === "collapsible" && field.label === "Bản dịch tiếng Anh") as { admin: { position: string }; fields: Field[] };
    expect(block.admin.position).toBe("sidebar");
    expect(namesOf(block.fields)).toEqual(["hasEnglish", "translation", "translationSummary", "retranslateAction", "approveEnglishAction"]);
    const [hasEnglish, translation] = block.fields as unknown as [{ admin: { readOnly: boolean } }, { type: string; admin: { hidden: boolean } }];
    expect(hasEnglish.admin.readOnly).toBe(true);
    expect(translation.type).toBe("group");
    expect(translation.admin.hidden).toBe(true);
    // Không còn trường nào tên hasEnglish/translation ở chỗ khác (không nhân đôi, không tab riêng).
    expect(config.fields.some((field) => field.type === "tabs")).toBe(false);
  });

  it("omit cả hasEnglish + translation: không có khối bản dịch", () => {
    const config = withContentDefaults(base([{ name: "title", type: "text", localized: true }]), { omit: ["hasEnglish", "translation"] });
    expect(config.fields.some((field) => field.type === "collapsible" && field.label === "Bản dịch tiếng Anh")).toBe(false);
    expect(namesOf(flattenLayoutFields(config.fields))).not.toContain("translationSummary");
  });
});
