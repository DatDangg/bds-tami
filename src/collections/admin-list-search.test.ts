import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";

import { ADMIN_COLLECTIONS, LIST_SEARCHABLE_FIELDS } from "./admin-collections";
import config from "../payload.config";

// Trường tự thêm của collection upload (Payload thêm vào lúc sanitize).
const UPLOAD_BUILTIN: Record<string, string[]> = { media: ["filename"] };

function topLevelFieldTypes(fields: Field[], into = new Map<string, string>()): Map<string, string> {
  for (const field of fields) {
    if ("name" in field && field.name) into.set(field.name, field.type);
    if (field.type === "row" || field.type === "collapsible") topLevelFieldTypes(field.fields, into);
    if (field.type === "tabs") for (const tab of field.tabs) if (!("name" in tab && tab.name)) topLevelFieldTypes(tab.fields, into);
  }
  return into;
}

describe("listSearchableFields (BL-039)", () => {
  const bySlug = new Map<string, CollectionConfig>(ADMIN_COLLECTIONS.map((c) => [c.slug, c]));

  it.each(Object.entries(LIST_SEARCHABLE_FIELDS))("%s: ô tìm kiếm trỏ trường text/email có thật", (slug, expected) => {
    const collection = bySlug.get(slug);
    expect(collection, slug).toBeDefined();
    expect(collection?.admin?.listSearchableFields).toEqual(expected);
    const types = topLevelFieldTypes(collection?.fields ?? []);
    for (const name of expected) {
      if (UPLOAD_BUILTIN[slug]?.includes(name)) continue;
      expect(["text", "email"], `${slug}.${name}`).toContain(types.get(name));
    }
  });

  it("không ghi đè listSearchableFields đã khai báo ở Lead/Cho thuê", () => {
    expect(bySlug.get("leads")?.admin?.listSearchableFields).not.toEqual(undefined);
    expect(bySlug.get("rentals")?.admin?.listSearchableFields).toEqual(["code", "title", "address"]);
  });
});

describe("localization.locales (BL-039)", () => {
  it("mỗi ngôn ngữ nội dung có nhãn đầy đủ, code giữ nguyên vi/en", async () => {
    const localization = (await config).localization;
    expect(localization).not.toBe(false);
    if (!localization) return;
    expect(localization.locales.map((l) => [l.code, l.label])).toEqual([
      ["vi", "Tiếng Việt"],
      ["en", "English"],
    ]);
    expect(localization.defaultLocale).toBe("vi");
    expect(localization.localeCodes).toEqual(["vi", "en"]);
  });
});
