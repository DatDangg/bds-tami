import type { ArrayField, Field, NumberField, SelectField, TextField, UploadField } from "payload";
import { describe, expect, it } from "vitest";

import { flattenLayoutFields } from "../../lib/admin/form-layout";
import { TRANSLATABLE_FIELDS } from "../../lib/translation/leaves";
import { PROJECT_FEATURES, PROPERTY_TYPES } from "../../shared/listing-options";
import { createProjects } from "../Projects";
import { MAX_PRODUCTS } from "./listing-fields";

type Named = Field & { name: string };

/** Trải phẳng cả tab/row lồng nhau để tìm field theo tên ở mọi tab của form dự án. */
function allFields(fields: readonly Field[]): Named[] {
  return fields.flatMap((field): Named[] => {
    if (field.type === "tabs") return field.tabs.flatMap((tab) => allFields(tab.fields));
    if (field.type === "row" || field.type === "collapsible") return allFields(field.fields);
    return "name" in field ? [field as Named] : [];
  });
}

const fields = allFields(createProjects().fields);
const fieldOf = <T extends Field>(name: string) => fields.find((field) => field.name === name) as T & Named;
const subfield = <T extends Field>(array: ArrayField, name: string) => flattenLayoutFields(array.fields).find((field) => "name" in field && field.name === name) as T & Named;
const runValidate = (field: NumberField | TextField, value: unknown, siblingData: Record<string, unknown> = {}) =>
  (field.validate as (v: unknown, o: unknown) => unknown)(value, { siblingData, req: { t: (key: string) => key }, required: false });

describe("projects: trường mới BL-052 (bộ lọc + chi tiết)", () => {
  it("productTypes / featuredAmenities: select nhiều giá trị, có index, đúng danh sách cố định, nhãn tiếng Việt", () => {
    const productTypes = fieldOf<SelectField>("productTypes");
    const featured = fieldOf<SelectField>("featuredAmenities");
    for (const field of [productTypes, featured]) {
      expect(field.type).toBe("select");
      expect(field.hasMany).toBe(true);
      expect(field.index).toBe(true);
      expect(field.required).toBeFalsy();
    }
    expect(productTypes.label).toBe("Loại sản phẩm");
    expect(featured.label).toBe("Tiện ích nổi bật (dùng cho bộ lọc)");
    expect(productTypes.options.map((option) => (typeof option === "string" ? option : option.value))).toEqual([...PROPERTY_TYPES]);
    expect(featured.options.map((option) => (typeof option === "string" ? option : option.value))).toEqual([...PROJECT_FEATURES]);
  });

  it("products: ≤ 8 hàng, type localized bắt buộc trong hàng, số không localized, không bắt buộc cả mảng", () => {
    const products = fieldOf<ArrayField>("products");
    expect(products.maxRows).toBe(MAX_PRODUCTS);
    expect(MAX_PRODUCTS).toBe(8);
    expect(products.required).toBeFalsy();
    const type = subfield<TextField>(products, "type");
    expect(type.localized).toBe(true);
    expect(type.required).toBe(true);
    for (const name of ["count", "areaFrom", "areaTo"]) {
      const number = subfield<NumberField>(products, name);
      expect(number.type).toBe("number");
      expect(number.min).toBe(0);
      expect((number as { localized?: boolean }).localized).toBeFalsy();
    }
  });

  it("products: diện tích 'đến' nhỏ hơn 'từ' bị chặn ở server", () => {
    const areaTo = subfield<NumberField>(fieldOf<ArrayField>("products"), "areaTo");
    expect(runValidate(areaTo, 40, { areaFrom: 50 })).toBe("Diện tích đến không được nhỏ hơn diện tích từ.");
    expect(runValidate(areaTo, 50, { areaFrom: 50 })).toBe(true);
    expect(runValidate(areaTo, 50, {})).toBe(true);
  });

  it("videoUrl: validate như tin cho thuê (chỉ https YouTube/TikTok), để trống được", () => {
    const videoUrl = fieldOf<TextField>("videoUrl");
    expect(videoUrl.label).toBe("Link video giới thiệu");
    expect(runValidate(videoUrl, "")).toBe(true);
    expect(runValidate(videoUrl, "https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(runValidate(videoUrl, "https://evil.example/video")).toBe("Liên kết video phải là https:// của YouTube hoặc TikTok.");
  });

  it("amenities[].description textarea localized; amenitiesImage chỉ nhận ảnh", () => {
    const description = subfield<Field>(fieldOf<ArrayField>("amenities"), "description");
    expect(description.type).toBe("textarea");
    expect((description as { localized?: boolean }).localized).toBe(true);
    const image = fieldOf<UploadField>("amenitiesImage");
    expect(image.type).toBe("upload");
    expect(image.relationTo).toBe("media");
    expect(image.filterOptions).toEqual({ mimeType: { contains: "image/" } });
  });

  it("chữ localized mới nằm trong danh sách dịch (products; amenities đã có)", () => {
    expect(TRANSLATABLE_FIELDS.projects).toEqual(expect.arrayContaining(["products", "amenities"]));
  });
});
