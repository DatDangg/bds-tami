import type { CollapsibleField, Field, GroupField } from "payload";
import { describe, expect, it } from "vitest";

import { seoField } from "./seo";

const group = seoField();
const fields = group.fields as Field[];

const byName = (name: string) => fields.find((field) => "name" in field && field.name === name) as { admin?: { components?: { beforeInput?: string[]; afterInput?: string[] }; description?: string; placeholder?: string }; label?: unknown; type: string };
const advanced = fields.find((field) => field.type === "collapsible") as CollapsibleField;

/** Đường dẫn dữ liệu (collapsible không tên không thêm cấp) — phải y hệt trước T05. */
function dataPaths(list: readonly Field[]): string[] {
  return list.flatMap((field) => {
    if (field.type === "collapsible") return dataPaths(field.fields);
    return "name" in field && field.name ? [field.name] : [];
  });
}

describe("seoField (BL-058 T05)", () => {
  it("giữ nguyên đường dẫn dữ liệu seo.*, localized, không thêm field mang dữ liệu", () => {
    expect(group).toMatchObject({ name: "seo", type: "group", localized: true });
    expect(dataPaths(fields)).toEqual(["metaTitle", "metaDescription", "ogImage", "noindex", "canonical"]);
  });

  it("nhãn nhóm bỏ để tab/khối SEO không lặp tiêu đề", () => {
    expect((group as GroupField).label).toBe(false);
  });

  it("khối 'Nâng cao' thu gọn mặc định chứa Ẩn trang khỏi Google + Đường dẫn gốc", () => {
    expect(advanced).toMatchObject({ type: "collapsible", label: "Nâng cao", admin: { initCollapsed: true } });
    expect(advanced.fields.map((field) => ("name" in field ? field.name : null))).toEqual(["noindex", "canonical"]);
  });

  it("ô tiêu đề có khung xem trước Google phía trên và bộ đếm ký tự phía dưới; ô mô tả có bộ đếm", () => {
    const metaTitle = byName("metaTitle");
    expect(metaTitle.admin?.components?.beforeInput).toEqual(["/components/admin/SeoPreview#SeoPreview"]);
    expect(metaTitle.admin?.components?.afterInput).toEqual(["/components/admin/SeoLengthCounter#SeoTitleCounter"]);
    expect(metaTitle.admin?.placeholder).toContain("Để trống");
    expect(byName("metaDescription").admin?.components?.afterInput).toEqual(["/components/admin/SeoLengthCounter#SeoDescriptionCounter"]);
  });

  it("câu giải thích nói rõ để trống là tự lấy, không lộ thuật ngữ dev (BL-040)", () => {
    const texts = fields.flatMap((field) => {
      const admin = (field as { admin?: { description?: string } }).admin;
      const own = [("label" in field && typeof field.label === "string" ? field.label : "") as string, admin?.description ?? ""];
      return field.type === "collapsible" ? [...own, ...(field.fields as Field[]).map((child) => (("label" in child && typeof child.label === "string" ? child.label : "") as string))] : own;
    });
    expect(texts.join(" ")).toContain("Để trống thì tự lấy");
    const forbidden = ["canonical", "noindex", "og image", "(slug)"];
    expect(texts.filter((text) => forbidden.some((term) => text.toLowerCase().includes(term)))).toEqual([]);
  });
});
