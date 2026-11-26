import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTIONS, ADMIN_GLOBALS } from "../collections/admin-collections";
import { mapLocationField, validateMapLocation } from "./map-location";

const t = (key: string) => key;
const run = (value: unknown, required = false) => validateMapLocation(value as never, { req: { t }, required } as never);

describe("validateMapLocation ([lng, lat])", () => {
  it.each<[string, unknown]>([
    ["null", null],
    ["undefined", undefined],
    ["mảng rỗng", []],
    ["hai ô trống", ["", ""]],
    ["hai null", [null, null]],
  ])("trống (%s) -> hợp lệ", (_label, value) => {
    expect(run(value)).toBe(true);
  });

  it("trống + required -> lỗi của validator mặc định", () => {
    expect(run(null, true)).toBe("validation:required");
  });

  it.each<[string, number, number]>([
    ["TP.HCM", 106.7009, 10.7769],
    ["Hà Nội", 105.8342, 21.0278],
    ["Phú Quốc", 103.9840, 10.2899],
    ["Hoàng Sa", 112, 16.5],
    ["Trường Sa", 111.9, 8.6],
    ["Cà Mau (mũi)", 104.7, 8.6],
    ["biên dưới", 101.5, 7],
    ["biên trên", 118, 24],
  ])("%s -> hợp lệ", (_label, lng, lat) => {
    expect(run([lng, lat])).toBe(true);
  });

  it("chấp nhận chuỗi số (form gửi chuỗi)", () => {
    expect(run(["106.7009", "10.7769"])).toBe(true);
  });

  it("nhập ngược kinh/vĩ độ -> câu riêng", () => {
    expect(run([10.7769, 106.7009])).toBe("Có vẻ bạn nhập ngược kinh độ và vĩ độ.");
    expect(run(["21.0278", "105.8342"])).toBe("Có vẻ bạn nhập ngược kinh độ và vĩ độ.");
  });

  it.each<[string, number, number]>([
    ["Bangkok", 100.5018, 13.7563],
    ["Paris", 2.3522, 48.8566],
    ["ngay ngoài biên kinh độ", 118.01, 16],
    ["ngay ngoài biên vĩ độ", 106, 24.01],
    ["(0, 0)", 0, 0],
  ])("%s -> ngoài Việt Nam", (_label, lng, lat) => {
    expect(run([lng, lat])).toBe("Toạ độ không nằm ở Việt Nam, kiểm tra lại.");
  });

  it("giữ lỗi của validator mặc định (không phải số / vượt ±180)", () => {
    expect(run([200, 10])).toBe("validation:longitudeOutOfBounds");
    expect(run(["abc", "10"])).toBe("validation:invalidInput");
  });
});

describe("mapLocationField", () => {
  it("mặc định: name location, nhãn, validate chung, không access/description", () => {
    const field = mapLocationField();
    expect(field).toMatchObject({ name: "location", type: "point", label: "Toạ độ bản đồ", validate: validateMapLocation });
    expect("access" in field).toBe(false);
    expect("admin" in field).toBe(false);
  });

  it("giữ name/access/description truyền vào", () => {
    const read = () => true;
    const field = mapLocationField({ name: "mapLocation", access: { read }, description: "mô tả" });
    expect(field.name).toBe("mapLocation");
    expect(field.access?.read).toBe(read);
    expect(field.admin?.description).toBe("mô tả");
  });
});

function collectPoints(fields: readonly Field[], path: string, out: { path: string; field: Field }[]): void {
  for (const field of fields) {
    const name = "name" in field && field.name ? field.name : "(ui)";
    const here = `${path}.${name}`;
    if (field.type === "point") out.push({ path: here, field });
    if (field.type === "tabs") {
      for (const tab of field.tabs) collectPoints(tab.fields, here, out);
    } else if (field.type === "blocks") {
      for (const block of field.blocks) collectPoints(block.fields, `${here}<${block.slug}>`, out);
    } else if ("fields" in field && Array.isArray(field.fields)) {
      collectPoints(field.fields, here, out);
    }
  }
}

describe("mọi ô point trong admin dùng validate Việt Nam (BL-131)", () => {
  const found: { path: string; field: Field }[] = [];
  for (const collection of ADMIN_COLLECTIONS) collectPoints(collection.fields, collection.slug, found);
  for (const global of ADMIN_GLOBALS) collectPoints(global.fields, global.slug, found);

  it("quét đủ 6 ô point", () => {
    expect(found.map((f) => f.path).sort()).toHaveLength(6);
  });

  it.each(found.map(({ path, field }) => [path, field] as const))("%s", (_path, field) => {
    expect(field.type === "point" && field.validate).toBe(validateMapLocation);
    expect("label" in field && field.label).toBe("Toạ độ bản đồ");
  });

  it("Cho thuê giữ access.read; tên ô đúng", () => {
    const rentals = found.find((f) => f.path.startsWith("rentals."))?.field;
    expect(rentals && "access" in rentals && rentals.access?.read).toBeTypeOf("function");
    expect(found.some((f) => f.path.endsWith(".mapLocation"))).toBe(true);
  });
});
