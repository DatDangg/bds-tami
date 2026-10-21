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

  it("thanh chọn hàng loạt phủ đủ ngang viewport: left 0, width auto, padding-inline theo gutter (BL-024)", () => {
    const body = ruleBody(listsSource(), /\.collection-list__list-selection\s*\{([^}]*)\}/);
    expect(body).toMatch(/left:\s*0\s*;/);
    expect(body).toMatch(/right:\s*0\s*;/);
    expect(body).toMatch(/width:\s*auto\s*;/);
    expect(body).toMatch(/padding-inline:\s*var\(--gutter-h\)\s*;/);
  });

  it("hàng nút trong thanh chọn hàng loạt được xuống dòng, không tràn khi có 'Chọn tất cả (N)' (BL-024)", () => {
    const body = ruleBody(listsSource(), /\.collection-list__list-selection\s*\{[^}]*\.list-selection\s*\{([^}]*)\}/);
    expect(body).toMatch(/flex-wrap:\s*wrap\s*;/);
  });

  it("ô Ngôn ngữ header theo gutter + avatar 25px, không đè 'Xem website' (BL-050)", () => {
    const body = ruleBody(source(), /\.app-header__localizer\.localizer\s*\{([^}]*)\}/);
    expect(body).toMatch(/right:\s*calc\(var\(--gutter-h\)\s*\+\s*25px\)\s*;/);
    expect(source()).toMatch(/\[dir="rtl"\]\s*&\s*\{[^}]*left:\s*calc\(var\(--gutter-h\)\s*\+\s*25px\)/);
  });

  it("mục Tổng quan rộng đủ nav (nav__wrap align-items:flex-start) (BL-050)", () => {
    const body = ruleBody(source(), /\.tami-nav-dashboard\s*\{([^}]*)\}/);
    expect(body).toMatch(/width:\s*100%\s*;/);
  });

  it("mục Tổng quan: indicator lùi đúng padding nav, không cộng độ thụt nhóm (BL-050)", () => {
    const body = ruleBody(source(), /\.tami-nav-dashboard\s*\{[^}]*\.nav__link-indicator\s*\{([^}]*)\}/);
    expect(body).toMatch(/inset-inline-start:\s*calc\(-1\s*\*\s*var\(--nav-padding-inline-start,\s*20px\)\)\s*;/);
  });

  it("không đặt overflow-x: hidden trên html/body trong style admin", () => {
    const all = [
      source(),
      listsSource(),
      readFileSync(join(__dirname, "../../app/(payload)/custom.scss"), "utf8"),
    ].join("\n");
    expect(all).not.toMatch(/(?:^|[\s,}])(?:html|body)\s*[^{}]*\{[^}]*overflow-x:\s*hidden/);
  });
});

// Bỏ comment để regex không khớp nhầm đoạn trích rule Payload trong chú thích.
function source() {
  return surfaces.replace(/\/\/.*$/gm, "");
}

function listsSource() {
  return readFileSync(join(STYLES_DIR, "_lists.scss"), "utf8").replace(/\/\/.*$/gm, "");
}
