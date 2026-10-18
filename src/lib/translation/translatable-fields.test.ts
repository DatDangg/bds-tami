import type { Field, SanitizedConfig } from "payload";
import { describe, expect, it } from "vitest";

import { TRANSLATABLE_COLLECTIONS, TRANSLATABLE_GLOBALS } from "./allowlist";
import { collectLeaves, TRANSLATABLE_FIELDS, type TranslatableSlug } from "./leaves";

/** Trường chữ localized cấp cao nhất của một cấu hình (kể cả nhóm/array có chữ localized bên trong): thứ đáng được cân nhắc đưa vào danh sách dịch. */
function localizedTextTopLevel(fields: readonly Field[]): string[] {
  const names: string[] = [];
  const hasLocalizedText = (list: readonly Field[], inherited: boolean): boolean =>
    list.some((field) => {
      if (field.type === "group") return hasLocalizedText(field.fields, inherited || field.localized === true);
      if (field.type === "array") return hasLocalizedText(field.fields, inherited);
      if (field.type === "text" || field.type === "textarea" || field.type === "richText") {
        return (inherited || ("localized" in field && field.localized === true)) && !["slug", "scopeSlug", "searchText", "canonical"].includes(field.name);
      }
      return false;
    });
  for (const field of fields) {
    if ("name" in field && typeof field.name === "string" && hasLocalizedText([field], false)) names.push(field.name);
  }
  return names;
}

/** Cấu hình THẬT của app: danh sách field cho phép dịch phải khớp đúng các trường chữ localized đang có, để trường localized mới không bị gửi ra ngoài âm thầm (và không bị bỏ sót âm thầm). */
describe("TRANSLATABLE_FIELDS khớp cấu hình collection/global thật", async () => {
  const { default: loaded } = await import("../../payload.config");
  const config = (await loaded) as SanitizedConfig;
  const fieldsOf = (slug: string): Field[] =>
    (config.collections.find((collection) => collection.slug === slug)?.fields ?? config.globals.find((global) => global.slug === slug)?.fields ?? []) as Field[];

  it("có danh sách field cho đúng mọi collection/global trong allowlist, không hơn", () => {
    expect(Object.keys(TRANSLATABLE_FIELDS).sort()).toEqual([...TRANSLATABLE_COLLECTIONS, ...TRANSLATABLE_GLOBALS].sort());
  });

  for (const slug of Object.keys(TRANSLATABLE_FIELDS) as TranslatableSlug[]) {
    it(`${slug}: danh sách = đúng các trường chữ localized cấp cao nhất đang có`, () => {
      expect([...TRANSLATABLE_FIELDS[slug]].sort()).toEqual(localizedTextTopLevel(fieldsOf(slug)).sort());
    });
  }

  it("leaves của một bản ghi mẫu chỉ gồm chữ công khai: không slug, không canonical, không trường nội bộ của site-settings", () => {
    const leaves = collectLeaves(
      "site-settings",
      fieldsOf("site-settings"),
      {
        siteName: "TAMI",
        address: "Hà Nội",
        notificationEmails: [{ email: "noi-bo@example.test" }],
        translationGlossary: [{ vi: "Chung cư", en: "Apartment" }],
        hotline: "0900000000",
        
      },
    );
    expect(leaves.map((leaf) => leaf.key).sort()).toEqual(["address", "siteName"]);
  });
});
