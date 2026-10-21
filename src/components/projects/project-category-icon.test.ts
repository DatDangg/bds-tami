import { describe, expect, it } from "vitest";
import { BuildingApartment, Buildings, City, HouseLine, Island, MapTrifold, Storefront } from "@/components/icons";
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

  it("khớp theo đoạn slug, không theo chuỗi con: shophouse ≠ house, island ≠ land", () => {
    expect(projectCategoryIcon("shophouse")).toBe(Storefront);
    expect(projectCategoryIcon("shophouses")).toBe(Storefront);
    expect(projectCategoryIcon("nha-pho-shophouse")).toBe(HouseLine); // từ khoá đầu tiên thắng như trước
    expect(projectCategoryIcon("island-villas")).toBe(HouseLine);
    expect(projectCategoryIcon("island")).toBe(Buildings);
    expect(projectCategoryIcon("dat-nen")).toBe(MapTrifold);
    expect(projectCategoryIcon("land-plots")).toBe(MapTrifold);
    expect(projectCategoryIcon("chung-cu-cao-cap")).toBe(BuildingApartment);
  });
});
