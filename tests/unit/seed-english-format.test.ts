import { describe, expect, it } from "vitest";

import { exportEntry, hasVietnameseMarks, leafKey, parseTemplatedAlt, resolveEntry, sameLeafValue, templatedAltEn } from "../../seed/english/format";
import type { TranslatableLeaf } from "../../src/lib/translation/leaves";

const rich = (...paragraphs: string[][]) => ({
  root: {
    type: "root",
    children: paragraphs.map((texts) => ({ type: "paragraph", children: texts.map((text) => ({ type: "text", text, format: 1 })) })),
  },
});

const leaves: TranslatableLeaf[] = [
  { key: "title", path: ["title"], kind: "text", value: "Tiêu đề" },
  { key: "amenities.a1.name", path: ["amenities", { rowId: "a1", index: 0 }, "name"], kind: "text", value: "Hồ bơi" },
  { key: "amenities.b2.name", path: ["amenities", { rowId: "b2", index: 1 }, "name"], kind: "text", value: "Phòng gym" },
  { key: "overview", path: ["overview"], kind: "richText", value: rich(["Một, ", "hai."], ["Ba."]) as never },
  { key: "empty", path: ["empty"], kind: "text", value: "   " },
];

describe("seed/english format", () => {
  it("leafKey dùng chỉ số hàng (không dùng id) để dữ liệu commit được", () => {
    expect(leafKey(leaves[1]!)).toBe("amenities.0.name");
    expect(leafKey(leaves[0]!)).toBe("title");
  });

  it("exportEntry: chuỗi + mảng ô chữ richText, bỏ lá trống", () => {
    expect(exportEntry(leaves)).toEqual({
      title: "Tiêu đề",
      "amenities.0.name": "Hồ bơi",
      "amenities.1.name": "Phòng gym",
      overview: ["Một, ", "hai.", "Ba."],
    });
  });

  it("resolveEntry: thay ô chữ richText theo thứ tự, giữ định dạng, không đổi bản gốc", () => {
    const { translated, problems } = resolveEntry(leaves, { title: "Title", overview: ["One, ", "two.", "Three."], "amenities.1.name": "Gym" });
    expect(problems).toEqual([]);
    const overview = translated.find(({ leaf }) => leaf.key === "overview")!.value as ReturnType<typeof rich>;
    expect(overview.root.children.map((node) => node.children.map((child) => child.text))).toEqual([["One, ", "two."], ["Three."]]);
    expect(overview.root.children[0]!.children[0]).toMatchObject({ format: 1 });
    expect((leaves[3]!.value as unknown as ReturnType<typeof rich>).root.children[0]!.children[0]!.text).toBe("Một, ");
  });

  it("resolveEntry: báo lỗi khi số ô chữ lệch, khoá lạ, chuỗi rỗng, sai kiểu", () => {
    const { problems } = resolveEntry(leaves, { overview: ["x"], "nope.0": "x", title: " ", "amenities.0.name": ["a"] as never });
    expect(problems).toHaveLength(4);
    expect(problems[0]).toContain("số ô chữ lệch");
    expect(resolveEntry(leaves, { overview: "text" as never }).problems[0]).toContain("richText cần mảng chuỗi");
  });

  it("sameLeafValue: chuỗi so bằng, richText so theo nội dung (không phụ thuộc thứ tự khoá)", () => {
    expect(sameLeafValue("a", "a")).toBe(true);
    expect(sameLeafValue(null, "a")).toBe(false);
    expect(sameLeafValue({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true);
    expect(sameLeafValue({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameLeafValue(undefined, { a: 1 })).toBe(false);
  });

  it("alt ảnh theo mẫu → hậu tố EN; alt khác mẫu → null", () => {
    expect(parseTemplatedAlt("Mê Linh Vista City - ảnh 3")).toEqual({ titleVi: "Mê Linh Vista City", suffixEn: "photo 3" });
    expect(parseTemplatedAlt("A - B - ảnh bổ sung 2")).toEqual({ titleVi: "A - B", suffixEn: "additional photo 2" });
    expect(parseTemplatedAlt("Dự án X - ảnh bìa")).toEqual({ titleVi: "Dự án X", suffixEn: "cover image" });
    expect(parseTemplatedAlt("Phối cảnh khu đô thị")).toBeNull();
    expect(parseTemplatedAlt("Dự án X - ảnh abc")).toBeNull();
    expect(templatedAltEn("Project X", "photo 3")).toBe("Project X - photo 3");
  });

  it("hasVietnameseMarks nhận dấu tiếng Việt, không nhận tiếng Anh", () => {
    expect(hasVietnameseMarks("Căn hộ")).toBe(true);
    expect(hasVietnameseMarks("Đà Nẵng")).toBe(true);
    expect(hasVietnameseMarks("Apartments")).toBe(false);
  });
});
