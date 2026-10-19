// BL-023 #05: Lexical của Payload đặt font-family:var(--font-serif) (Georgia) → vỡ dấu tiếng Việt.
// Admin phải trỏ --font-serif về --font-body (Montserrat subset vietnamese) ở :root.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("custom.scss: font Lexical", () => {
  const scss = readFileSync(new URL("../../app/(payload)/custom.scss", import.meta.url), "utf8");
  const rootStart = scss.indexOf("\n:root {");
  const rootBlock = scss.slice(rootStart, scss.indexOf("\n}", rootStart));

  it("--font-serif trong :root trỏ về var(--font-body)", () => {
    expect(rootBlock).toMatch(/--font-serif:\s*var\(--font-body\);/);
  });
});
