import { describe, expect, it } from "vitest";
import type { Field } from "payload";

import { Projects } from "./Projects";
import { Rentals } from "./Rentals";

const uiFields = (fields: Field[]): Field[] => fields.filter((field) => field.type === "ui");

describe("cột nghiệp vụ danh sách (BL-039)", () => {
  it("Dự án: cột mặc định có Quy mô + Khoảng giá, là trường ui có Cell và hiện được trong Hiển thị cột", () => {
    expect(Projects.admin?.defaultColumns).toEqual(["gallery", "title", "category", "salesStatus", "unitsSummary", "priceRange", "status", "publishedAt", "author"]);
    const ui = uiFields(Projects.fields);
    expect(ui.map((f) => "name" in f && f.name)).toEqual(["unitsSummary", "priceRange"]);
    for (const field of ui) {
      expect(field.admin?.components?.Cell).toBeTruthy();
      expect(field.admin?.disableListColumn).toBeFalsy();
    }
  });

  it("Cho thuê: cột mặc định có Phòng · diện tích + Thuộc dự án", () => {
    expect(Rentals.admin?.defaultColumns).toEqual(["gallery", "code", "title", "category", "roomsArea", "project", "priceMonthlyVnd", "status", "author"]);
    const [roomsArea] = uiFields(Rentals.fields);
    expect(roomsArea).toMatchObject({ name: "roomsArea", label: "Phòng · diện tích" });
    expect(roomsArea?.admin?.disableListColumn).toBeFalsy();
  });
});
