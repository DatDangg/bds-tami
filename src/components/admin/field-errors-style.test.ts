// BL-058: lỗi hiện dưới ô + ẩn toast gom danh sách lỗi — khẳng định SCSS nguồn và đăng ký.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scss = readFileSync(join(__dirname, "styles", "_field-errors.scss"), "utf8");
const custom = readFileSync(join(__dirname, "..", "..", "app", "(payload)", "custom.scss"), "utf8");
const config = readFileSync(join(__dirname, "..", "..", "payload.config.ts"), "utf8");

describe("field errors style (BL-058)", () => {
  it("lỗi theo ô là dòng chữ tĩnh dưới ô, màu danger token, luôn hiện", () => {
    const body = /\.field-error\.tooltip\s*\{([^}]*)\}/.exec(scss)?.[1] ?? "";
    expect(body).toMatch(/display:\s*block/); // Payload ẩn `.tooltip` ở màn hẹp
    expect(body).toMatch(/position:\s*static/);
    expect(body).toMatch(/color:\s*var\(--admin-badge-danger-fg\)/);
    expect(body).toMatch(/visibility:\s*visible/);
    expect(scss).toMatch(/order:\s*2/);
  });

  it("chỉ ẩn toast mang marker lỗi theo ô; không ẩn toast thường/thành công", () => {
    expect(scss).toMatch(/\[data-sonner-toast\]:not\(\[data-field-errors-unmatched\]\):has\(\[data-testid="field-errors"\], \[data-testid="field-error"\]\)\s*\{\s*display:\s*none/);
  });

  it("partial được @use và provider được đăng ký", () => {
    expect(custom).toContain('@use "../../components/admin/styles/field-errors";');
    expect(config).toContain("/components/admin/FormErrorFocus#FormErrorFocus");
  });
});
