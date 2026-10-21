// BL-051 A7: khẳng định quy tắc CSS thanh điều khiển màn sửa trong SCSS nguồn (không có trình duyệt trong vitest).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "styles", "_doc-controls.scss"), "utf8");

describe("doc controls styles (BL-051 A7)", () => {
  it("thanh dính có nền đặc theo token (sáng/tối), không ép z-index/position của Payload", () => {
    const body = /\.doc-controls\s*\{([^}]*)\}/.exec(source)?.[1] ?? "";
    expect(body).toMatch(/background:\s*var\(--theme-bg\)/);
    expect(body).not.toMatch(/(z-index|position)\s*:/);
    expect(source).not.toMatch(/!important\s*;/);
  });

  it("link phụ cao >= 44px ở màn hẹp, chữ ẩn bằng kiểu sr-only (còn cho đọc màn hình)", () => {
    expect(source).toMatch(/@media \(max-width: 768px\)\s*\{[\s\S]*min-height:\s*44px/);
    expect(source).toMatch(/\.tami-doc-nav__text\s*\{[^}]*clip-path/);
  });
});
