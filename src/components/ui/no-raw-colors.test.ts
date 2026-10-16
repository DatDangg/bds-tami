import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// AC: component chỉ dùng token, không có mã màu rời (hex/rgb/hsl/oklch) hay outline-none.
const dir = "src/components/ui";
const sources = readdirSync(dir)
  .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
  .map((file) => [file, readFileSync(join(dir, file), "utf8")] as const);

describe("src/components/ui dùng token", () => {
  it("có file để kiểm tra", () => {
    expect(sources.length).toBeGreaterThanOrEqual(8);
  });

  it.each(sources)("%s không có màu hard-code", (_file, code) => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(code).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/);
    expect(code).not.toMatch(/\b(bg|text|border)-\[#/);
  });

  it.each(sources)("%s không tắt outline không thay thế", (_file, code) => {
    expect(code).not.toMatch(/\boutline-none\b/);
  });
});
