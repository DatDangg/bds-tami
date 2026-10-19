import type { CollectionConfig, Field } from "payload";
import { describe, expect, it } from "vitest";

import { Leads } from "../../collections/Leads";
import { createNews } from "../../collections/News";
import { createProjects } from "../../collections/Projects";
import { createPropertyPosts } from "../../collections/PropertyPosts";
import { createRentals } from "../../collections/Rentals";
import { findLayoutField } from "./form-layout";
import { hideTechnicalListFilters } from "./list-filter";

/** Đường dẫn các trường lá mà "Thêm bộ lọc" của Payload còn cho chọn (cùng quy tắc `reduceFieldsToOptions`: bỏ hidden/virtual, group đi xuống tận lá). */
function filterablePaths(fields: Field[], prefix = ""): string[] {
  return fields.flatMap((field): string[] => {
    if (field.type === "row" || field.type === "collapsible") return filterablePaths(field.fields, prefix);
    if (field.type === "tabs") return field.tabs.flatMap((tab) => filterablePaths(tab.fields, "name" in tab && tab.name ? `${prefix}${tab.name}.` : prefix));
    if (field.type === "ui") return [];
    const admin = "admin" in field ? field.admin : undefined;
    if (admin?.hidden || ("hidden" in field && field.hidden) || ("virtual" in field && field.virtual)) return [];
    const path = `${prefix}${"name" in field ? field.name : ""}`;
    if (field.type === "group") return filterablePaths(field.fields, `${path}.`);
    return admin?.disableListFilter ? [] : [path];
  });
}
const filterable = (collection: CollectionConfig) => filterablePaths(collection.fields).sort();

describe("Thêm bộ lọc: chỉ còn trường nghiệp vụ (BL-021 #06)", () => {
  it("rentals", () => {
    expect(filterable(createRentals())).toEqual(
      [
        "areaM2", "author", "balconyDirection", "bathrooms", "bedrooms", "category", "code", "floor", "furnishing", "hasEnglish", "houseDirection",
        "isFeatured", "priceMonthlyVnd", "priceNegotiable", "project", "province", "publishedAt", "rentalTerms.availableFrom", "rentalTerms.depositMonths",
        "rentalTerms.minLeaseMonths", "rentalTerms.paymentCycle", "rentedAt", "status", "title", "ward",
      ].sort(),
    );
  });

  it("projects", () => {
    expect(filterable(createProjects())).toEqual(
      [
        "areaFromM2", "areaToM2", "author", "category", "developer", "hasEnglish", "isFeatured", "priceFromVnd", "priceToVnd", "province", "publishedAt",
        "salesStatus", "status", "title", "ward",
      ].sort(),
    );
  });

  it("property-posts", () => {
    expect(filterable(createPropertyPosts())).toEqual(
      [
        "author", "category", "hasEnglish", "isFeatured", "offer.endAt", "offer.startAt", "priceVnd", "province", "publishedAt", "relatedProject", "relatedRental",
        "status", "title", "ward",
      ].sort(),
    );
  });

  it("news", () => {
    expect(filterable(createNews())).toEqual(["author", "category", "hasEnglish", "isFeatured", "publishedAt", "status", "title"].sort());
  });

  it("leads", () => {
    expect(filterable(Leads)).toEqual(
      [
        "assignedAt", "assignedTo", "code", "firstContactedAt", "lastActivityAt", "project", "propertyPost", "rental", "source", "status",
        "utm.campaign", "utm.content", "utm.medium", "utm.source", "utm.term",
      ].sort(),
    );
  });

  it("nhóm translation: trường lá bị ẩn khỏi menu nhưng cấu hình/trường vẫn còn để TranslationStatusFilter lọc qua `where`", () => {
    const rentals = createRentals();
    const group = findLayoutField(rentals.fields, "translation");
    expect(group).toBeDefined();
    const leaves = (group as Extract<Field, { type: "group" }>).fields.filter((field) => "name" in field);
    expect(leaves.map((field) => ("name" in field ? field.name : ""))).toContain("status");
    expect(leaves.every((field) => field.type === "ui" || (field.admin?.disableListFilter ?? false))).toBe(true);
  });

  it("không đổi cấu hình khác: cột danh sách, hook, access giữ nguyên", () => {
    const before = createNews();
    const after = hideTechnicalListFilters(before);
    expect(after.admin?.defaultColumns).toEqual(before.admin?.defaultColumns);
    expect(after.hooks).toBe(before.hooks);
    expect(after.access).toBe(before.access);
  });
});
