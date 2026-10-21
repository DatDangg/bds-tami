// BL-051 A6/A12: khẳng định quy tắc CSS nguồn của thanh chọn hàng loạt nổi + cột Thao tác (không chạy trình duyệt).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "styles", "_list-actions.scss"), "utf8").replace(/^\s*\/\/.*$/gm, "");
const body = (pattern: RegExp) => pattern.exec(source)?.[1] ?? "";

describe("list-actions.scss", () => {
  it("thanh chọn hàng loạt desktop: ghim đáy, nền đặc, bóng, không phủ drawer", () => {
    expect(source).toContain(".collection-list .list-header:not(.list-drawer__header) .list-selection");
    const rule = body(/\.list-header:not\(\.list-drawer__header\) \.list-selection\s*\{([^}]*)\}/);
    expect(rule).toMatch(/position:\s*fixed\s*;/);
    expect(rule).toMatch(/bottom:\s*16px\s*;/);
    expect(rule).toMatch(/background:\s*var\(--admin-surface\)\s*;/);
    expect(rule).toMatch(/box-shadow:/);
    expect(rule).toMatch(/max-width:\s*calc\(100vw - 32px\)\s*;/);
  });

  it("nút trong thanh ≥ 44px; chừa đệm đáy khi có dòng chọn; không !important", () => {
    expect(body(/\.list-selection__button\s*\{([^}]*)\}/)).toMatch(/min-height:\s*44px\s*;/);
    expect(body(/\.collection-list:has\(\.list-selection\)\s*\{([^}]*)\}/)).toMatch(/padding-bottom:\s*\d+px\s*;/);
    expect(source).not.toContain("!important");
  });

  it("icon thao tác có vùng bấm 44x44", () => {
    const rule = body(/\n\.tami-row-action\s*\{([^}]*)\}/);
    expect(rule).toMatch(/min-width:\s*44px\s*;/);
    expect(rule).toMatch(/min-height:\s*44px\s*;/);
  });
});
