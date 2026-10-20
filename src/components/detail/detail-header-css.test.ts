import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

describe("globals.css: header trên trang chi tiết (BL-027)", () => {
  it("header đã cuộn chỉ hiện lại khi focus bàn phím, không phải focus chuột/chạm", () => {
    expect(css).toContain(".site-header[data-scrolled]:not(:has(:focus-visible))");
    expect(css).not.toMatch(/\.site-header\[data-scrolled\]:not\(:focus-within\)/);
  });

  it("--sticky-top cố định 8/16px trên trang chi tiết, không phụ thuộc data-scrolled", () => {
    const rules = [...css.matchAll(/^[ \t]*([^\s{}][^{}\n]*)\{\s*--sticky-top:\s*([^;]+);/gm)].map((match) => ({
      selector: (match[1] ?? "").trim(),
      value: (match[2] ?? "").trim(),
    }));
    const detailRules = rules.filter((rule) => rule.selector.includes("[data-detail-page]"));
    expect(detailRules.map((rule) => rule.value)).toEqual(["0.5rem", "1rem"]);
    for (const rule of detailRules) {
      expect(rule.selector).toBe("html:has([data-detail-page])");
      expect(rule.selector).not.toContain("data-scrolled");
    }
  });

  it("ẩn header bằng transform, không visibility (link còn focus được để Tab đưa header lại)", () => {
    const rule = css.slice(css.indexOf(".site-header[data-scrolled]:not(:has(:focus-visible))"));
    expect(rule.slice(0, 120)).toContain("transform: translateY(-100%)");
    expect(rule.slice(0, 200)).not.toContain("visibility");
  });
});
