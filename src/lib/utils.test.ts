import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cn, FONT_SIZE_TOKENS } from "./utils";

describe("cn", () => {
  it("giữ cả token cỡ chữ và màu chữ", () => {
    expect(cn("text-button text-primary-foreground")).toBe("text-button text-primary-foreground");
    expect(cn("text-h3 text-text", "text-small text-text-secondary")).toBe("text-small text-text-secondary");
  });

  it("hai token cỡ chữ: cái sau thắng", () => {
    expect(cn("text-body", "text-small")).toBe("text-small");
    expect(cn("text-button", "text-lg")).toBe("text-lg");
  });

  it("hai màu chữ: cái sau thắng", () => {
    expect(cn("text-text", "text-on-dark")).toBe("text-on-dark");
  });

  it("danh sách token cỡ chữ khớp globals.css", () => {
    const css = readFileSync("src/app/(frontend)/globals.css", "utf8");
    const names = new Set(
      [...css.matchAll(/^\s*--text-([\w-]+):/gm)].map((m) => m[1]!).filter((n) => !n.includes("--")),
    );
    expect([...FONT_SIZE_TOKENS].sort()).toEqual([...names].sort());
  });
});
