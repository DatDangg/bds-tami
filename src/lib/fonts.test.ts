import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Đọc nguồn thay vì import: next/font/google chỉ chạy được trong build của Next.
const source = readFileSync("src/lib/fonts.ts", "utf8");
const css = readFileSync("src/app/(frontend)/globals.css", "utf8");
const document = readFileSync("src/components/layout/PublicDocument.tsx", "utf8");

describe("fonts (BL-036: một font Montserrat)", () => {
  it("nguồn font không còn font serif cũ", () => {
    expect(source).not.toMatch(/EB_Gar[a]mond|ebGar[a]mond/);
    expect(document).not.toMatch(/ebGar[a]mond|eb-gar[a]mond/i);
  });

  it("Montserrat có subset vietnamese và weight 400/500/600", () => {
    const block = /Montserrat\(\{[\s\S]*?\}\)/.exec(source)?.[0] ?? "";
    expect(block).toMatch(/subsets:\s*\[[^\]]*"vietnamese"/);
    expect(block).toMatch(/weight:\s*\["400",\s*"500",\s*"600"\]/);
  });

  it("--font-display trỏ về Montserrat, không serif", () => {
    const line = /--font-display:[^;]*;/.exec(css)?.[0] ?? "";
    expect(line).toContain("--font-montserrat");
    expect(line).not.toMatch(/Georgia|Gar[a]mond|Times/);
    expect(line).toMatch(/sans-serif/);
  });

  it.each([
    ["display", "500"],
    ["h1", "500"],
    ["h2", "500"],
    ["h2-sm", "500"],
    ["h3", "500"],
    ["h4", "600"],
    ["price", "600"],
  ])("thang chữ %s có weight mặc định %s", (name, weight) => {
    expect(css).toContain(`--text-${name}--font-weight: ${weight};`);
  });
});
