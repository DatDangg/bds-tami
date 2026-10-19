import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Đọc nguồn thay vì import: next/font/google chỉ chạy được trong build của Next.
const source = readFileSync("src/lib/fonts.ts", "utf8");

describe("fonts", () => {
  it("EB Garamond tải weight 400 (heading BL-020) và 500 (thẻ tin nổi bật)", () => {
    const block = /EB_Garamond\(\{[\s\S]*?\}\)/.exec(source)?.[0] ?? "";
    expect(block).toMatch(/weight:\s*\["400",\s*"500"\]/);
  });
});
