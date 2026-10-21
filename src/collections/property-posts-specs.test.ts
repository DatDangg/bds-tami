import type { CollapsibleField, Field, SelectField } from "payload";
import { describe, expect, it } from "vitest";

import { flattenLayoutFields } from "../lib/admin/form-layout";
import { DIRECTIONS, HANDOVER_CONDITIONS, PROPERTY_TYPES } from "../shared/listing-options";
import { createPropertyPosts } from "./PropertyPosts";

type Named = Field & { name: string; localized?: boolean; required?: boolean; index?: boolean; min?: number };

const SPEC_FIELDS = ["propertyType", "areaM2", "bedrooms", "bathrooms", "houseDirection", "handoverCondition", "frontageM", "floors", "address", "location"];
const NUMBER_FIELDS = ["areaM2", "bedrooms", "bathrooms", "frontageM", "floors"];

const config = createPropertyPosts();
const tabs = config.fields.find((field) => field.type === "tabs");
const infoTab = tabs && tabs.type === "tabs" ? tabs.tabs.find((tab) => tab.label === "Thông tin tin đăng") : undefined;
const section = infoTab?.fields.find((field): field is CollapsibleField => field.type === "collapsible" && field.label === "Thông số bất động sản");
const specFields = section ? (flattenLayoutFields(section.fields) as Named[]) : [];
const fieldOf = <T extends Field>(name: string) => specFields.find((field) => field.name === name) as T & Named;
const optionValues = (field: SelectField) => field.options.map((option) => (typeof option === "string" ? option : option.value));

describe("property-posts: thông số bất động sản (BL-052)", () => {
  it("nằm trong nhóm 'Thông số bất động sản' của tab 'Thông tin tin đăng', đúng thứ tự, có ghi chú voucher", () => {
    expect(section).toBeDefined();
    expect(section?.admin?.description).toBe("Để trống nếu tin là voucher/ưu đãi.");
    expect(specFields.map((field) => field.name)).toEqual(SPEC_FIELDS);
  });

  it("vỏ collapsible không tên: trường ở cấp gốc dữ liệu (không group), tất cả tuỳ chọn, không localized", () => {
    for (const field of specFields) {
      expect(field.required, field.name).toBeFalsy();
      expect(field.localized, field.name).toBeFalsy();
    }
    expect(config.fields.some((field) => field.type === "group" && "name" in field && field.name === "specs")).toBe(false);
  });

  it("số ≥ 0; propertyType + areaM2 có index", () => {
    for (const name of NUMBER_FIELDS) {
      expect(fieldOf(name).type, name).toBe("number");
      expect(fieldOf(name).min, name).toBe(0);
    }
    expect(fieldOf("propertyType").index).toBe(true);
    expect(fieldOf("areaM2").index).toBe(true);
  });

  it("select dùng danh sách cố định chung: PROPERTY_TYPES, DIRECTIONS (như tin cho thuê), HANDOVER_CONDITIONS", () => {
    expect(optionValues(fieldOf<SelectField>("propertyType"))).toEqual([...PROPERTY_TYPES]);
    expect(optionValues(fieldOf<SelectField>("houseDirection"))).toEqual([...DIRECTIONS]);
    expect(optionValues(fieldOf<SelectField>("handoverCondition"))).toEqual([...HANDOVER_CONDITIONS]);
    for (const name of ["propertyType", "houseDirection", "handoverCondition"]) expect(fieldOf<SelectField>(name).hasMany, name).toBeFalsy();
  });

  it("address text + location point công khai (không có access đọc riêng như tin cho thuê)", () => {
    expect(fieldOf("address").type).toBe("text");
    expect(fieldOf("location").type).toBe("point");
    expect((fieldOf("address") as { access?: unknown }).access).toBeUndefined();
    expect((fieldOf("location") as { access?: unknown }).access).toBeUndefined();
  });
});
