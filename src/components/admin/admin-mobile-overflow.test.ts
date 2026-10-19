// BL-023 #10: form admin không tràn ngang ở 375px — khẳng định override CSS trong SCSS nguồn.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STYLES_DIR = join(__dirname, "styles");
const surfaces = readFileSync(join(STYLES_DIR, "_surfaces.scss"), "utf8");

function ruleBody(source: string, selectorPattern: RegExp) {
  const match = selectorPattern.exec(source);
  return match ? match[1] : "";
}

describe("admin mobile overflow (375px)", () => {
  it("breadcrumb header co được: min-width 0 + overflow-x auto", () => {
    const body = ruleBody(source(), /\.app-header__step-nav-wrapper\s*\{([^}]*)\}/);
    expect(body).toMatch(/min-width:\s*0\s*;/);
    expect(body).toMatch(/overflow-x:\s*auto\s*;/);
  });

  it("vạch kẻ .payload-settings không rộng hơn khung: width auto + right theo gutter", () => {
    const body = ruleBody(
      source(),
      /\.payload-settings::before,\s*\.payload-settings::after\s*\{([^}]*)\}/,
    );
    expect(body).toMatch(/width:\s*auto\s*;/);
    expect(body).toMatch(/right:\s*calc\(var\(--gutter-h\)\s*\*\s*-1\)\s*;/);
  });

  it("không đặt overflow-x: hidden trên html/body trong style admin", () => {
    const all = [source(), readFileSync(join(__dirname, "../../app/(payload)/custom.scss"), "utf8")].join("\n");
    expect(all).not.toMatch(/(?:^|[\s,}])(?:html|body)\s*[^{}]*\{[^}]*overflow-x:\s*hidden/);
  });
});

// Bỏ comment để regex không khớp nhầm đoạn trích rule Payload trong chú thích.
function source() {
  return surfaces.replace(/\/\/.*$/gm, "");
}
