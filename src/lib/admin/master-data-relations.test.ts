// @vitest-environment node
import type { CollectionConfig, Config, Field } from "payload";
import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTIONS, ADMIN_GLOBALS } from "../../collections/admin-collections";
import { contentRedirectsPlugin } from "../../collections/redirects-plugin";
import { disableInlineCreateForMasterData, MASTER_DATA_SLUGS } from "./master-data-relations";
import { UPLOAD_BUTTON_LABEL } from "./payload-vi-overrides";

interface Found {
  path: string;
  relationTo: string | string[];
  allowCreate: boolean | undefined;
}

function relationships(fields: Field[], prefix = ""): Found[] {
  return fields.flatMap((field): Found[] => {
    const here = field.type === "relationship" ? [{ path: `${prefix}${field.name}`, relationTo: field.relationTo, allowCreate: field.admin?.allowCreate }] : [];
    if (field.type === "tabs") return field.tabs.flatMap((tab) => relationships(tab.fields, prefix));
    if (field.type === "blocks") return field.blocks.flatMap((block) => relationships(block.fields, `${prefix}${field.name}.${block.slug}.`));
    const nested = "fields" in field && Array.isArray(field.fields) ? relationships(field.fields, "name" in field ? `${prefix}${field.name}.` : prefix) : [];
    return [...here, ...nested];
  });
}

const targets = (found: Found) => (Array.isArray(found.relationTo) ? found.relationTo : [found.relationTo]);

describe("hideAPIURL (BL-051 A1)", () => {
  it("mọi collection + global admin ẩn nút API", () => {
    for (const config of [...ADMIN_COLLECTIONS, ...ADMIN_GLOBALS]) expect(config.admin?.hideAPIURL, config.slug).toBe(true);
  });

  it("collection redirects do plugin sinh cũng ẩn nút API", () => {
    const result = contentRedirectsPlugin()({ collections: [] } as unknown as Config) as Config | Promise<Config>;
    return Promise.resolve(result).then((config) => {
      const redirects = (config.collections ?? []).find((collection: CollectionConfig) => collection.slug === "redirects");
      expect(redirects?.admin?.hideAPIURL).toBe(true);
    });
  });
});

describe("allowCreate ô quan hệ dữ liệu nền (BL-051 A2)", () => {
  const all = [...ADMIN_COLLECTIONS, ...ADMIN_GLOBALS].flatMap((config) => relationships(config.fields).map((found) => ({ slug: config.slug, ...found })));

  it("có ô quan hệ dữ liệu nền để kiểm (không test rỗng)", () => {
    expect(all.filter((found) => targets(found).every((slug) => MASTER_DATA_SLUGS.has(slug))).length).toBeGreaterThan(5);
  });

  it("ô quan hệ chỉ tới provinces/wards/staff có allowCreate=false", () => {
    for (const found of all.filter((f) => targets(f).every((slug) => MASTER_DATA_SLUGS.has(slug)))) expect(found.allowCreate, `${found.slug}.${found.path}`).toBe(false);
  });

  it("ô quan hệ khác không bị đổi allowCreate", () => {
    for (const found of all.filter((f) => !targets(f).every((slug) => MASTER_DATA_SLUGS.has(slug)))) expect(found.allowCreate, `${found.slug}.${found.path}`).toBeUndefined();
  });

  it("duyệt xuống tabs/row/array/blocks và không đổi trường khác", () => {
    const rel = (relationTo: "provinces" | "wards" | "staff" | "categories"): Field => ({ name: `to_${relationTo}`, type: "relationship", relationTo });
    const result = disableInlineCreateForMasterData([
      { type: "tabs", tabs: [{ label: "t", fields: [{ type: "row", fields: [rel("provinces")] }] }] },
      { name: "list", type: "array", fields: [rel("wards")] },
      { name: "blk", type: "blocks", blocks: [{ slug: "b", fields: [rel("staff"), rel("categories")] }] },
      { name: "mixed", type: "relationship", relationTo: ["staff", "categories"] },
    ]);
    const found = relationships(result);
    expect(Object.fromEntries(found.map((f) => [f.path, f.allowCreate]))).toEqual({
      to_provinces: false,
      "list.to_wards": false,
      "blk.b.to_staff": false,
      "blk.b.to_categories": undefined,
      mixed: undefined,
    });
  });
});

describe("chữ nút upload (BL-051 A3)", () => {
  it("là 'Tải lên'", () => expect(UPLOAD_BUTTON_LABEL).toBe("Tải lên"));
});
