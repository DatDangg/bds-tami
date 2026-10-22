import type { Field, GroupField, TextareaField } from "payload";
import { describe, expect, it } from "vitest";

import { createSiteSettings } from "../SiteSettings";
import { NEWS_CONTACT_NOTE_MAX_LENGTH, newsDetailField } from "./news-detail";

const hasName = (field: Field, name: string) => "name" in field && field.name === name;

describe("site-settings: nhóm newsDetail (BL-062)", () => {
  it("nằm trong tab tiếng Việt 'Tin tức' của site-settings", () => {
    const tabs = createSiteSettings().fields.find((field) => field.type === "tabs");
    const tab = tabs && "tabs" in tabs ? tabs.tabs.find((item) => item.label === "Tin tức") : undefined;
    expect(tab?.fields).toContain(newsDetailField);
    expect(newsDetailField).toMatchObject({ name: "newsDetail", type: "group", label: "Trang chi tiết tin tức" });
  });

  it("contactNote: textarea localized, nhãn tiếng Việt, ≤ 500 ký tự, cắt khoảng trắng đầu/cuối, có mô tả cho admin", () => {
    const group = newsDetailField as GroupField;
    const note = group.fields.find((field) => hasName(field, "contactNote")) as TextareaField;
    expect(note).toMatchObject({ type: "textarea", localized: true, label: "Khung liên hệ cuối bài", maxLength: NEWS_CONTACT_NOTE_MAX_LENGTH });
    expect(NEWS_CONTACT_NOTE_MAX_LENGTH).toBe(500);
    expect(note.required).toBeFalsy();
    expect(note.admin?.description).toContain("TAMI REAL ESTATE");
    const trim = note.hooks?.beforeValidate?.[0];
    expect(trim?.({ value: "  Chữ  " } as never)).toBe("Chữ");
  });

  it("quyền ghi giữ nguyên của global: chỉ admin sửa (không thêm access riêng cho trường)", () => {
    const global = createSiteSettings();
    expect(global.access?.update).toBeDefined();
    expect((newsDetailField as { access?: unknown }).access).toBeUndefined();
  });
});
