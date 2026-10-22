// BL-058 T03: khẳng định CSS nguồn của nút tạo mới cạnh ô quan hệ (không chạy trình duyệt).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "styles", "_forms.scss"), "utf8").replace(/^\s*\/\/.*$/gm, "");
const body = (pattern: RegExp) => pattern.exec(source)?.[1] ?? "";

describe("_forms.scss nút tạo mới cạnh ô quan hệ", () => {
  it("chỉ icon: không còn chữ 'Thêm mới' chèn bằng CSS", () => {
    expect(source).not.toMatch(/content:\s*"Thêm mới"/);
  });

  it("tách rời ô: cách 8px, bo đủ 4 góc, ghi đè cả nhánh popup (.doc-drawer__toggler)", () => {
    expect(source).toContain(".relationship-add-new__add-button:not(.relationship-add-new__add-button--unstyled).doc-drawer__toggler");
    const rule = body(/\n\.relationship-add-new__add-button:not\([^)]*\),\s*\n[^{]*\{([\s\S]*?)&:hover/);
    expect(rule).toMatch(/margin-left:\s*8px\s*;/);
    expect(rule).toMatch(/border-radius:\s*var\(--admin-radius-s\)\s*;/);
    expect(rule).toMatch(/min-height:\s*36px\s*;/);
    expect(rule).not.toMatch(/border-(top|bottom)-left-radius/);
  });

  it("mobile >= 44px; không !important", () => {
    expect(source).toMatch(/max-width:\s*767px\)\s*\{[\s\S]*?height:\s*44px\s*;[\s\S]*?min-width:\s*44px\s*;/);
    expect(source).not.toContain("!important");
  });
});
