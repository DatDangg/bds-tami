// BL-051 A4/A5/A13: khẳng định quy tắc CSS thanh công cụ danh sách trong SCSS nguồn (không có trình duyệt trong vitest).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "styles", "_list-toolbar.scss"), "utf8");

function ruleBody(selectorPattern: RegExp) {
  return selectorPattern.exec(source)?.[1] ?? "";
}

describe("list toolbar styles (BL-051)", () => {
  it("A13: 'Hiển thị cột' / 'Lọc nâng cao' + panel mặc định ẩn", () => {
    const body = ruleBody(/\.list-controls__toggle-columns,\s*\.list-controls__toggle-where,\s*\.list-controls__columns,\s*\.list-controls__where\s*\{([^}]*)\}/);
    expect(body).toMatch(/display:\s*none\s*;/);
  });

  it("A13: chỉ hiện khi <html data-admin-role=admin>", () => {
    expect(source).toMatch(/:root\[data-admin-role="admin"\]\s*\{[^}]*\.list-controls__toggle-columns,[^}]*\.list-controls__toggle-where\s*\{[^}]*display:\s*inline-flex/s);
    expect(source).not.toMatch(/data-admin-role="sale"/);
  });

  it("A13: khung ô tìm nằm trên .search-filter, cụm nút ngoài khung (search-bar không viền)", () => {
    const bar = ruleBody(/\.list-controls \.search-bar\s*\{([^}]*)\}/);
    expect(bar).toMatch(/border:\s*0\s*;/);
    const filter = ruleBody(/\.search-filter\s*\{([^}]*)\}/);
    expect(filter).toMatch(/border:\s*1px solid var\(--admin-border-strong\)/);
    expect(filter).toMatch(/min-height:\s*44px/);
  });

  it("A13: nút Cột/Lọc cao >= 44px, có viền", () => {
    const pill = ruleBody(/&__actions \.pill\s*\{([^}]*)\}/);
    expect(pill).toMatch(/min-height:\s*44px/);
    expect(pill).toMatch(/border:\s*1px solid var\(--admin-border-strong\)/);
  });

  it("A4: 'Tạo mới' là nút chính nền accent, chữ on-accent, cao >= 44px, nằm ô 'create' góc phải", () => {
    const body = ruleBody(/\.list-create-new-doc__create-new-button\.btn:not\(\.btn--disabled\)\s*\{([^}]*)\}/);
    expect(body).toMatch(/--bg-color:\s*var\(--admin-accent\)/);
    expect(body).toMatch(/--color:\s*var\(--admin-on-accent\)/);
    expect(body).toMatch(/min-height:\s*44px/);
    expect(source).toMatch(/grid-template-areas:\s*"title tabs create"/);
  });

  it("A4: header trong list drawer không bị đổi", () => {
    expect(source).toMatch(/\.list-header:not\(\.list-drawer__header\)/);
  });

  it("A5: 'Xuất Excel' lên hàng ô tìm chỉ khi nút có mặt (:has), cột 2 hàng 2", () => {
    expect(source).toMatch(/\.collection-list__wrap:has\(> \.list-search-action\)/);
    const body = ruleBody(/> \.list-search-action\s*\{([^}]*grid-column:\s*2;[^}]*)\}/);
    expect(body).toMatch(/grid-row:\s*2/);
  });
});

describe("list toolbar breakpoint (BL-051 T03 carry-over)", () => {
  it("mọi @media max-width dùng một mốc 768px (khớp mid-break Payload); min-width là 769px", () => {
    const maxWidths = [...source.matchAll(/@media \(max-width:\s*(\d+)px\)/g)].map((match) => match[1]);
    expect(maxWidths.length).toBeGreaterThan(1);
    expect(new Set(maxWidths)).toEqual(new Set(["768"]));
    expect([...source.matchAll(/@media \(min-width:\s*(\d+)px\)/g)].map((match) => match[1])).toEqual(["769"]);
  });
});
