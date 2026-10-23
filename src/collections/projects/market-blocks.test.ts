import type { ArrayField, Field, NumberField } from "payload";
import { describe, expect, it } from "vitest";

import { TRANSLATABLE_FIELDS } from "../../lib/translation/leaves";
import { createProjects } from "../Projects";
import { flattenLayoutFields } from "../../lib/admin/form-layout";
import { MAX_FAQS, MAX_HIGHLIGHTS, MAX_NEARBY_AMENITIES, MAX_PRICE_ROWS, projectMarketBlockFields } from "./market-blocks";

const arrayOf = (name: string) => projectMarketBlockFields.find((field) => "name" in field && field.name === name) as ArrayField;
const subfield = (array: ArrayField, name: string) => flattenLayoutFields(array.fields).find((field) => "name" in field && field.name === name) as Field & { name: string };
const validateOf = (array: ArrayField, name: string) => (subfield(array, name) as NumberField).validate!;
const runValidate = (array: ArrayField, name: string, value: number, siblingData: Record<string, unknown>) =>
  (validateOf(array, name) as (v: number, o: unknown) => unknown)(value, { siblingData, req: { t: (key: string) => key }, required: false });

describe("projects: khối nội dung mở rộng (BL-020 P5-T01)", () => {
  it("nằm trong collection projects, đều tuỳ chọn, có giới hạn số dòng", () => {
    const names = flattenLayoutFields(createProjects().fields).map((field) => ("name" in field ? field.name : ""));
    expect(names).toEqual(expect.arrayContaining(["highlights", "nearbyAmenities", "priceTable", "priceUpdatedAt", "faqs"]));
    for (const field of projectMarketBlockFields) expect("required" in field && field.required).toBeFalsy();
    expect(arrayOf("highlights").maxRows).toBe(MAX_HIGHLIGHTS);
    expect(MAX_HIGHLIGHTS).toBe(8);
    expect(arrayOf("nearbyAmenities").maxRows).toBe(MAX_NEARBY_AMENITIES);
    expect(arrayOf("priceTable").maxRows).toBe(MAX_PRICE_ROWS);
    expect(arrayOf("faqs").maxRows).toBe(MAX_FAQS);
  });

  it("chữ localized nằm trong danh sách dịch, trường số/chọn thì không localized", () => {
    expect(TRANSLATABLE_FIELDS.projects).toEqual(expect.arrayContaining(["highlights", "nearbyAmenities", "priceTable", "faqs"]));
    expect((subfield(arrayOf("highlights"), "title") as { localized?: boolean }).localized).toBe(true);
    expect((subfield(arrayOf("nearbyAmenities"), "name") as { localized?: boolean }).localized).toBe(true);
    for (const name of ["distance", "distanceValue", "distanceUnit"]) expect((subfield(arrayOf("nearbyAmenities"), name) as { localized?: boolean }).localized).toBeFalsy();
    expect((subfield(arrayOf("priceTable"), "unitType") as { localized?: boolean }).localized).toBe(true);
    expect((subfield(arrayOf("faqs"), "answer") as { localized?: boolean }).localized).toBe(true);
    expect((subfield(arrayOf("priceTable"), "priceFrom") as { localized?: boolean }).localized).toBeFalsy();
  });

  it("khoảng cách chuẩn hoá: số ≥ 0 + đơn vị km/m/phút; có số thiếu đơn vị (hoặc ngược lại) là lỗi; ô 'giá trị cũ' chỉ hiện khi chưa có số (BL-065)", () => {
    const amenities = arrayOf("nearbyAmenities");
    expect((subfield(amenities, "distanceValue") as NumberField).min).toBe(0);
    expect((subfield(amenities, "distanceUnit") as { options: unknown }).options).toEqual([
      { label: "Ki-lô-mét (km)", value: "km" },
      { label: "Mét (m)", value: "m" },
      { label: "Phút", value: "min" },
    ]);
    expect(runValidate(amenities, "distanceValue", 1.2, { distanceUnit: "km" })).toBe(true);
    expect(runValidate(amenities, "distanceValue", 1.2, {})).toBe("Chọn đơn vị cho khoảng cách (hoặc xoá số).");
    const validateUnit = (subfield(amenities, "distanceUnit") as { validate: (v: unknown, o: unknown) => unknown }).validate;
    const ctx = (siblingData: Record<string, unknown>) => ({ siblingData, req: { t: (key: string) => key }, required: false, options: [{ value: "km" }, { value: "m" }, { value: "min" }] });
    expect(validateUnit("km", ctx({ distanceValue: 2 }))).toBe(true);
    expect(validateUnit("km", ctx({}))).toBe("Nhập số cho khoảng cách (hoặc xoá đơn vị).");
    expect(validateUnit(undefined, ctx({}))).toBe(true);
    const legacy = subfield(amenities, "distance") as unknown as { label: string; admin: { condition: (d: unknown, s: Record<string, unknown>) => boolean } };
    expect(legacy.label).toBe("Khoảng cách (giá trị cũ)");
    expect(legacy.admin.condition({}, { distance: "gần chợ" })).toBe(true);
    expect(legacy.admin.condition({}, { distance: "gần chợ", distanceValue: 3 })).toBe(false);
    expect(legacy.admin.condition({}, {})).toBe(false);
  });

  it("không bắt buộc cả mảng (không chặn xuất bản EN của dự án cũ)", () => {
    for (const name of ["highlights", "nearbyAmenities", "priceTable", "faqs"]) expect(arrayOf(name).required).toBeFalsy();
  });

  it("diện tích/giá 'đến' không được nhỏ hơn 'từ'", () => {
    const table = arrayOf("priceTable");
    expect(runValidate(table, "areaTo", 40, { areaFrom: 50 })).toBe("Diện tích đến không được nhỏ hơn diện tích từ.");
    expect(runValidate(table, "areaTo", 50, { areaFrom: 50 })).toBe(true);
    expect(runValidate(table, "priceTo", 1, { priceFrom: 2 })).toBe("Giá đến không được nhỏ hơn giá từ.");
    expect(runValidate(table, "priceTo", 2, { priceFrom: 2 })).toBe(true);
    expect(runValidate(table, "priceTo", 2, {})).toBe(true);
  });
});
