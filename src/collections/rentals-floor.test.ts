import type { Field, NumberField, SelectField, TextField } from "payload";
import { describe, expect, it } from "vitest";

import { flattenLayoutFields } from "../lib/admin/form-layout";
import { createRentals } from "./Rentals";

const field = (name: string) => flattenLayoutFields(createRentals().fields).find((f) => "name" in f && f.name === name) as Field & { name: string };
const context = { req: { t: (key: string) => key }, required: false };

describe("rentals: tầng chuẩn hoá (BL-065)", () => {
  it("mức tầng là ô chọn cao/trung/thấp, số tầng là số nguyên ≥ 0, đều tuỳ chọn và dùng chung vi/en", () => {
    const level = field("floorLevel") as SelectField;
    expect(level.options).toEqual([
      { label: "Tầng cao", value: "high" },
      { label: "Tầng trung", value: "mid" },
      { label: "Tầng thấp", value: "low" },
    ]);
    const num = field("floorNumber") as NumberField;
    expect(num.min).toBe(0);
    for (const f of [level, num]) {
      expect(f.required).toBeFalsy();
      expect(f.localized).toBeFalsy();
    }
    const validate = num.validate as (v: number | null | undefined, o: unknown) => unknown;
    expect(validate(7, context)).toBe(true);
    expect(validate(0, context)).toBe(true);
    expect(validate(null, context)).toBe(true);
    expect(validate(2.5, context)).toBe("Số tầng phải là số nguyên.");
  });

  it("ô 'giá trị cũ' chỉ hiện khi còn chữ cũ mà chưa có mức/số tầng", () => {
    const legacy = field("floor") as TextField;
    expect(legacy.label).toBe("Tầng (giá trị cũ)");
    const show = legacy.admin!.condition!;
    expect(show({ floor: "3.4.5.6" }, {}, {} as never)).toBe(true);
    expect(show({ floor: "3.4.5.6", floorLevel: "high" }, {}, {} as never)).toBe(false);
    expect(show({ floor: "3.4.5.6", floorNumber: 3 }, {}, {} as never)).toBe(false);
    expect(show({ floor: " " }, {}, {} as never)).toBe(false);
    expect(show({}, {}, {} as never)).toBe(false);
  });
});
