import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTIONS, ADMIN_GLOBALS } from "../collections/admin-collections";
import { adminDate, VN_DATE_TIME_FORMAT, type DatePickerAppearance } from "./admin-date";

describe("adminDate", () => {
  it.each<[DatePickerAppearance, string, string | undefined]>([
    ["dayAndTime", "dd/MM/yyyy HH:mm", "HH:mm"],
    ["dayOnly", "dd/MM/yyyy", undefined],
    ["default", "dd/MM/yyyy", undefined],
    ["timeOnly", "HH:mm", "HH:mm"],
    ["monthOnly", "MM/yyyy", undefined],
  ])("%s -> %s", (appearance, displayFormat, timeFormat) => {
    expect(adminDate(appearance)).toEqual({ pickerAppearance: appearance, displayFormat, ...(timeFormat ? { timeFormat } : {}) });
  });

  it("không đối số -> giữ appearance mặc định của Payload", () => {
    expect(adminDate().pickerAppearance).toBe("default");
  });

  it("dayAndTime dùng chung hằng với admin.dateFormat", () => {
    expect(adminDate("dayAndTime").displayFormat).toBe(VN_DATE_TIME_FORMAT);
  });
});

/** Duyệt đệ quy mọi field (tabs / row / collapsible / group / array / blocks) và gom field `type: "date"` kèm đường dẫn. */
function collectDateFields(fields: readonly Field[], path: string, out: { path: string; field: Field }[]): void {
  for (const field of fields) {
    const name = "name" in field && field.name ? field.name : "(ui)";
    const here = `${path}.${name}`;
    if (field.type === "date") out.push({ path: here, field });
    if (field.type === "tabs") {
      for (const tab of field.tabs) collectDateFields(tab.fields, here, out);
    } else if (field.type === "blocks") {
      for (const block of field.blocks) collectDateFields(block.fields, `${here}<${block.slug}>`, out);
    } else if ("fields" in field && Array.isArray(field.fields)) {
      collectDateFields(field.fields, here, out);
    }
  }
}

describe("mọi field date trong admin dùng định dạng Việt (BL-076)", () => {
  const found: { path: string; field: Field }[] = [];
  for (const collection of ADMIN_COLLECTIONS) collectDateFields(collection.fields, collection.slug, found);
  for (const global of ADMIN_GLOBALS) collectDateFields(global.fields, global.slug, found);

  it("quét được field date (không quét rỗng)", () => {
    expect(found.length).toBeGreaterThan(15);
  });

  it.each(found.map(({ path, field }) => [path, field] as const))("%s", (_path, field) => {
    const date = field.type === "date" ? field.admin?.date : undefined;
    expect(date?.displayFormat).toBeTruthy();
    expect(date?.displayFormat).not.toMatch(/MMM|a|h/);
    const appearance = date?.pickerAppearance ?? "default";
    if (appearance === "dayAndTime" || appearance === "timeOnly") {
      expect(date && "timeFormat" in date ? date.timeFormat : undefined).toBe("HH:mm");
      expect(date?.displayFormat).toContain("HH:mm");
    }
  });
});
