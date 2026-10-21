import { describe, expect, it } from "vitest";
import { BuildingApartment, Buildings, City, HouseLine, Island } from "@/components/icons";
import { projectCategoryIcon } from "./project-category-icon";

describe("projectCategoryIcon", () => {
  it("đoán icon theo slug VI / EN; slug lạ hoặc trống → icon chung", () => {
    expect(projectCategoryIcon("can-ho-chung-cu")).toBe(BuildingApartment);
    expect(projectCategoryIcon("apartments")).toBe(BuildingApartment);
    expect(projectCategoryIcon("khu-do-thi")).toBe(City);
    expect(projectCategoryIcon("nha-pho-biet-thu")).toBe(HouseLine);
    expect(projectCategoryIcon("nghi-duong")).toBe(Island);
    expect(projectCategoryIcon("khac")).toBe(Buildings);
    expect(projectCategoryIcon(null)).toBe(Buildings);
  });
});
