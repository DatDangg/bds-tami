import { describe, expect, it } from "vitest";
import type { Field } from "payload";

import { buildEnglishWrite, collectLeaves, hashLeafValue, hashLeaves, hasSourceChanged, parseStoredHashes, readAtPath, TRANSLATABLE_FIELDS } from "./leaves";
import { sampleLexical } from "./test-helpers";

const fields: Field[] = [
  { name: "title", type: "text", localized: true },
  { name: "code", type: "text" },
  { name: "slug", type: "text", localized: true },
  { name: "notes", type: "textarea" },
  { name: "overview", type: "richText", localized: true } as Field,
  { name: "price", type: "number" },
  { name: "seo", type: "group", localized: true, fields: [{ name: "metaTitle", type: "text" }, { name: "canonical", type: "text" }, { name: "noindex", type: "checkbox" }] },
  { name: "scale", type: "group", fields: [{ name: "totalUnits", type: "text" }, { name: "handoverTime", type: "text", localized: true }] },
  { name: "amenities", type: "array", fields: [{ name: "name", type: "text", localized: true }, { name: "icon", type: "text" }] },
];
const slug = "projects" as const;
const doc = () => ({
  title: "Tiêu đề",
  code: "AB-1",
  slug: "tieu-de",
  notes: "ghi chú nội bộ",
  overview: sampleLexical(),
  price: 5,
  seo: { metaTitle: "Meta", canonical: "https://x.example/a", noindex: true },
  scale: { totalUnits: "100", handoverTime: "Quý 4" },
  amenities: [{ id: "r1", name: "Một", icon: "i1" }, { id: "r2", name: "Hai", icon: "i2" }],
});

describe("collectLeaves", () => {
  it("chỉ lấy chữ localized trong danh sách cho phép; bỏ slug/canonical, trường không localized, số, checkbox", () => {
    const leaves = collectLeaves(slug, fields, { ...doc(), seo: doc().seo });
    expect(leaves.map((leaf) => leaf.key).sort()).toEqual(["title", "overview", "seo.metaTitle", "scale.handoverTime", "amenities.r1.name", "amenities.r2.name"].sort());
  });

  it("trường ngoài danh sách cho phép của slug không bao giờ được lấy, dù localized", () => {
    const keys = collectLeaves(slug, [...fields, { name: "internalNote", type: "text", localized: true }], { ...doc(), internalNote: "bí mật" }).map((leaf) => leaf.key);
    expect(keys).not.toContain("internalNote");
  });

  it("group không localized nhưng có trường con localized (scale.handoverTime) được lấy; trường con không localized thì không", () => {
    const keys = collectLeaves(slug, fields, doc()).map((leaf) => leaf.key);
    expect(keys).toContain("scale.handoverTime");
    expect(keys).not.toContain("scale.totalUnits");
  });

  it("array: khoá theo id hàng (không theo chỉ số) nên đổi thứ tự hàng không đổi khoá", () => {
    const reordered = { ...doc(), amenities: [...doc().amenities].reverse() };
    const keys = collectLeaves(slug, [...fields], reordered).map((leaf) => leaf.key);
    expect(keys).toEqual(expect.arrayContaining(["amenities.r1.name", "amenities.r2.name"]));
  });

  it("bản ghi rỗng/thiếu trường -> không có gì", () => {
    expect(collectLeaves(slug, fields, null)).toEqual([]);
    expect(collectLeaves(slug, fields, {})).toEqual([]);
  });
});

describe("hash nguồn", () => {
  it("không phụ thuộc thứ tự khoá object; đổi một chữ thì đổi hash", () => {
    const a = hashLeafValue({ a: 1, b: { x: 1, y: 2 } } as never);
    const b = hashLeafValue({ b: { y: 2, x: 1 }, a: 1 } as never);
    expect(a).toBe(b);
    expect(hashLeafValue("Một")).not.toBe(hashLeafValue("Hai"));
  });

  it("hasSourceChanged: giống nhau -> false; trường mới/đổi -> true; trường bị xoá khỏi nguồn -> false; parseStoredHashes lọc giá trị lạ", () => {
    const current = hashLeaves(collectLeaves(slug, fields, doc()));
    expect(hasSourceChanged(current, current)).toBe(false);
    expect(hasSourceChanged({ ...current, title: "khác" }, current)).toBe(true);
    expect(hasSourceChanged({}, current)).toBe(true);
    const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== "title"));
    expect(hasSourceChanged(current, rest)).toBe(false);
    expect(parseStoredHashes({ a: "x", b: 1, c: null })).toEqual({ a: "x" });
    expect(parseStoredHashes("lạ")).toEqual({});
  });
});

describe("buildEnglishWrite", () => {
  it("đặt bản dịch vào đúng vị trí của bản en đã lưu, giữ phần không dịch (icon, id hàng) và khớp hàng theo id", () => {
    const vi = doc();
    const leaves = collectLeaves(slug, fields, vi);
    const english = {
      title: null,
      seo: { metaTitle: null, noindex: true },
      amenities: [{ id: "r2", name: null, icon: "i2" }, { id: "r1", name: null, icon: "i1" }],
    };
    const translated = leaves.filter((leaf) => ["title", "seo.metaTitle", "amenities.r1.name"].includes(leaf.key)).map((leaf) => ({ leaf, value: `EN:${leaf.value as string}` }));
    const write = buildEnglishWrite(english, translated)!;
    expect(write.title).toBe("EN:Tiêu đề");
    expect(write.seo).toEqual({ metaTitle: "EN:Meta", noindex: true });
    expect(write.amenities).toEqual([{ id: "r2", name: null, icon: "i2" }, { id: "r1", name: "EN:Một", icon: "i1" }]);
    expect(Object.keys(write).sort()).toEqual(["amenities", "seo", "title"]);
  });

  it("hàng không còn ở bản en (xoá giữa chừng) -> null, không ghi dở", () => {
    const leaves = collectLeaves(slug, fields, doc()).filter((leaf) => leaf.key === "amenities.r1.name");
    expect(buildEnglishWrite({ amenities: [{ id: "zzz", name: null }] }, leaves.map((leaf) => ({ leaf, value: "x" })))).toBeNull();
  });

  it("readAtPath đọc đúng giá trị en theo id hàng", () => {
    const leaf = collectLeaves(slug, fields, doc()).find((candidate) => candidate.key === "amenities.r2.name")!;
    expect(readAtPath({ amenities: [{ id: "r2", name: "Two" }] }, leaf.path)).toBe("Two");
  });

  it("danh sách cho phép không có collection nhạy cảm", () => {
    expect(Object.keys(TRANSLATABLE_FIELDS)).not.toEqual(expect.arrayContaining(["leads"]));
    for (const forbidden of ["leads", "lead-activities", "job-applications", "staff", "private-files", "audit-logs", "translation-usage"]) {
      expect(forbidden in TRANSLATABLE_FIELDS).toBe(false);
    }
  });
});
