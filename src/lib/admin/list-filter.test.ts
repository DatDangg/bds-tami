import type { CollectionConfig, Field } from "payload";
import { describe, expect, it } from "vitest";

import { Leads } from "../../collections/Leads";
import { createNews } from "../../collections/News";
import { createProjects } from "../../collections/Projects";
import { createPropertyPosts } from "../../collections/PropertyPosts";
import { createRentals } from "../../collections/Rentals";
import { findLayoutField } from "./form-layout";
import { ADMIN_COLLECTIONS } from "../../collections/admin-collections";
import { hideTechnicalListFields } from "./list-filter";

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
        "amenities", "areaM2", "author", "balconyDirection", "bathrooms", "bedrooms", "category", "code", "floor", "furnishing", "houseDirection",
        "isFeatured", "priceMonthlyVnd", "priceNegotiable", "project", "province", "publishedAt", "rentalTerms.availableFrom", "rentalTerms.depositMonths",
        "rentalTerms.minLeaseMonths", "rentalTerms.paymentCycle", "rentedAt", "status", "title", "ward",
      ].sort(),
    );
  });

  it("projects", () => {
    expect(filterable(createProjects())).toEqual(
      [
        "areaFromM2", "areaToM2", "author", "category", "developer", "isFeatured", "priceFromVnd", "priceToVnd", "province", "publishedAt",
        "salesStatus", "status", "title", "ward",
      ].sort(),
    );
  });

  it("property-posts", () => {
    expect(filterable(createPropertyPosts())).toEqual(
      [
        "author", "category", "isFeatured", "offer.endAt", "offer.startAt", "priceVnd", "province", "publishedAt", "relatedProject", "relatedRental",
        "status", "title", "ward",
      ].sort(),
    );
  });

  it("news", () => {
    expect(filterable(createNews())).toEqual(["author", "category", "isFeatured", "publishedAt", "status", "title"].sort());
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
    const after = hideTechnicalListFields(before);
    expect(after.admin?.defaultColumns).toEqual(before.admin?.defaultColumns);
    expect(after.hooks).toBe(before.hooks);
    expect(after.access).toBe(before.access);
  });
});

type Leaf = { path: string; field: Field };
/** Mọi trường lá (cùng quy tắc duyệt group/tabs/row như menu của Payload), kể cả `ui`. */
function leaves(fields: Field[], prefix = ""): Leaf[] {
  return fields.flatMap((field): Leaf[] => {
    if (field.type === "row" || field.type === "collapsible") return leaves(field.fields, prefix);
    if (field.type === "tabs") return field.tabs.flatMap((tab) => leaves(tab.fields, "name" in tab && tab.name ? `${prefix}${tab.name}.` : prefix));
    const path = `${prefix}${"name" in field ? field.name : ""}`;
    if (field.type === "group") return leaves(field.fields, `${path}.`);
    return [{ path, field }];
  });
}
const adminOf = (field: Field) => ("admin" in field ? (field.admin as { disableListColumn?: boolean; disableListFilter?: boolean } | undefined) : undefined);
const bySlug = (slug: string) => {
  const found = ADMIN_COLLECTIONS.find((collection) => collection.slug === slug);
  if (!found) throw new Error(`thiếu collection ${slug}`);
  return found;
};
const columnVisible = (slug: string, path: string) => !adminOf(leaves(bySlug(slug).fields).find((leaf) => leaf.path === path)!.field)?.disableListColumn;
const filterVisible = (slug: string, path: string) => !adminOf(leaves(bySlug(slug).fields).find((leaf) => leaf.path === path)!.field)?.disableListFilter;

describe("Danh sách gọn mọi collection (BL-039)", () => {
  it("áp cho đủ 21 collection admin", () => {
    expect(ADMIN_COLLECTIONS).toHaveLength(21);
  });

  it("mọi collection: SEO/bản dịch/slug/hasEnglish/richText/textarea/json/array/blocks/ui-không-Cell ẩn cả cột lẫn lọc; upload chỉ ẩn lọc", () => {
    for (const collection of ADMIN_COLLECTIONS) {
      for (const { path, field } of leaves(collection.fields)) {
        const admin = adminOf(field);
        const where = `${collection.slug}.${path}`;
        const shared = path.split(".")[0] ?? "";
        const bothHidden =
          ["seo", "translation"].includes(shared) || ["slug", "scopeSlug", "hasEnglish", "searchText", "searchReindexPending"].includes(path) ||
          ["richText", "textarea", "json", "array", "blocks", "point", "join"].includes(field.type) || (field.type === "ui" && !field.admin?.components?.Cell);
        if (bothHidden) {
          const kept = [...(collection.admin?.defaultColumns ?? []), collection.admin?.useAsTitle].includes(path);
          expect(Boolean(admin?.disableListColumn), `${where} phải ẩn cột`).toBe(!kept);
          expect(admin?.disableListFilter, `${where} phải ẩn lọc`).toBe(true);
        }
        if (field.type === "upload" && !bothHidden) {
          expect(admin?.disableListFilter, `${where} upload phải ẩn lọc`).toBe(true);
          expect(admin?.disableListColumn, `${where} upload giữ cột`).toBeFalsy();
        }
      }
    }
  });

  it("cột mặc định và useAsTitle không bị ẩn khỏi cột", () => {
    for (const collection of ADMIN_COLLECTIONS) {
      const shown = [...(collection.admin?.defaultColumns ?? []), ...(collection.admin?.useAsTitle ? [collection.admin.useAsTitle] : [])];
      const byPath = new Map(leaves(collection.fields).map((leaf) => [leaf.path, leaf.field]));
      for (const column of shown) {
        const field = byPath.get(column);
        if (field) expect(adminOf(field)?.disableListColumn, `${collection.slug}.${column}`).toBeFalsy();
      }
    }
  });

  it("trường nghiệp vụ mẫu vẫn lọc + hiện cột được", () => {
    const samples: Array<[string, string]> = [
      ["job-postings", "deadline"], ["job-postings", "status"], ["job-postings", "category"],
      ["job-applications", "status"], ["job-applications", "jobPosting"], ["pages", "kind"], ["categories", "scope"],
    ];
    for (const [slug, path] of samples) {
      expect(columnVisible(slug, path), `${slug}.${path} cột`).toBe(true);
      expect(filterVisible(slug, path), `${slug}.${path} lọc`).toBe(true);
    }
  });

  it("ui có Cell không bị tắt cột; ui không Cell (nút thao tác) bị ẩn", () => {
    const withCell: Field = { name: "x", type: "ui", admin: { components: { Cell: "/c#C" } } };
    const noCell: Field = { name: "y", type: "ui", admin: { components: { Field: "/f#F" } } };
    const out = hideTechnicalListFields({ slug: "t", fields: [withCell, noCell] });
    expect(adminOf(out.fields[0]!)?.disableListColumn).toBeFalsy();
    expect(adminOf(out.fields[1]!)?.disableListColumn).toBe(true);
  });

  it("hiddenPaths chỉ ẩn lọc, hiddenColumnPaths ẩn cả cột", () => {
    const fields: Field[] = [{ name: "a", type: "text" }, { name: "b", type: "text" }];
    const out = hideTechnicalListFields({ slug: "t", fields }, ["a"], ["b"]);
    expect(adminOf(out.fields[0]!)).toMatchObject({ disableListFilter: true });
    expect(adminOf(out.fields[0]!)?.disableListColumn).toBeFalsy();
    expect(adminOf(out.fields[1]!)).toMatchObject({ disableListFilter: true, disableListColumn: true });
  });

  it("collection upload: trường nền Payload (url, filesize, width, height, sizes…) ẩn khỏi cột", () => {
    for (const slug of ["media", "private-files"]) {
      const all = leaves(bySlug(slug).fields);
      for (const name of ["url", "thumbnailURL", "filesize", "width", "height"]) {
        expect(adminOf(all.find((leaf) => leaf.path === name)!.field)?.disableListColumn, `${slug}.${name}`).toBe(true);
      }
    }
  });
});
