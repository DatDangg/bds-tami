// BL-051 A9: khẳng định quy tắc CSS nguồn của lưới thẻ Thư viện (không chạy trình duyệt) + cấu hình cột Loại tệp.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { Media } from "../../collections/Media";

const source = readFileSync(join(__dirname, "styles", "_media-grid.scss"), "utf8").replace(/^\s*\/\/.*$/gm, "");
const body = (pattern: RegExp) => pattern.exec(source)?.[1] ?? "";

describe("media-grid.scss", () => {
  it("chỉ áp cho list view Media, không áp trong drawer chọn ảnh", () => {
    expect(source).toContain(".collection-list--media:not(:has(.list-drawer__header))");
    expect(source.match(/^\.[a-z-]+/gm)).toEqual([".collection-list--media", ".tami-media-type"]);
  });

  it("tbody thành lưới tự co, thẻ ≥ 150px; ảnh giữ tỉ lệ (contain) trong khung 4:3", () => {
    expect(body(/tbody\s*\{([^}]*)\}/)).toMatch(/grid-template-columns:\s*repeat\(auto-fill, minmax\(150px, 1fr\)\)\s*;/);
    const thumbnail = body(/\.thumbnail\s*\{([^}]*)\{[^}]*\}/);
    expect(thumbnail).toMatch(/aspect-ratio:\s*4 \/ 3\s*;/);
    expect(thumbnail).toMatch(/min-height:\s*0\s*;/);
    expect(source).toMatch(/object-fit:\s*contain\s*;/);
  });

  it("checkbox chọn nhiều có vùng bấm 44×44 và nổi trên lớp phủ liên kết", () => {
    const select = body(/td\.cell-_select\s*\{([\s\S]*?)\n  \}/);
    expect(select).toMatch(/width:\s*44px\s*;/);
    expect(select).toMatch(/height:\s*44px\s*;/);
    expect(select).toMatch(/z-index:\s*2\s*;/);
    expect(body(/td\.cell-filename a::after\s*\{([^}]*)\}/)).toMatch(/inset:\s*0\s*;/);
  });

  it("không dùng !important", () => {
    expect(source).not.toContain("!important");
  });
});

describe("Media — ô Loại tệp", () => {
  it("dùng MediaTypeCell, không đổi tên/kiểu trường", () => {
    const field = Media.fields.find((entry) => "name" in entry && entry.name === "mimeType") as { type: string; admin?: { components?: { Cell?: string } } };
    expect(field.type).toBe("text");
    expect(field.admin?.components?.Cell).toBe("/components/admin/MediaTypeCell#MediaTypeCell");
  });
});
