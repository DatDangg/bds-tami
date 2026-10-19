// Contrast WCAG 2.2 cho token admin (BL-015 T01, design §1 + §1.6) và đối chiếu SCSS ↔ TS.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  ADMIN_COLORS,
  ADMIN_ELEVATION,
  ADMIN_RADIUS,
  ADMIN_SHADOW,
  BADGE_TONE_NAMES,
  BADGE_TONES,
  ELEVATION_STEPS,
  ELEVATION_SURFACE_STEPS,
  ELEVATION_TEXT_STEPS,
  type AdminTheme,
} from "./admin-tokens";

const THEMES: AdminTheme[] = ["light", "dark"];
const TEXT_MIN = 4.5;
const CONTROL_MIN = 3;

function channel(hex: string, offset: number) {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const clean = hex.replace("#", "");
  return 0.2126 * channel(clean, 0) + 0.7152 * channel(clean, 2) + 0.0722 * channel(clean, 4);
}

function contrastRatio(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function expectContrast(fg: string, bg: string, min: number, label: string) {
  const ratio = contrastRatio(fg, bg);
  expect(ratio, `${label}: ${fg} / ${bg} = ${ratio.toFixed(3)} (cần ≥ ${min})`).toBeGreaterThanOrEqual(min);
}

describe("contrast chữ / nền (≥ 4.5:1)", () => {
  it.each(THEMES)("%s: chữ chính, muted, subtle trên mọi nền", (theme) => {
    const c = ADMIN_COLORS[theme];
    const backgrounds = [c.canvas, c.surface, c["surface-hover"], c["nav-bg"]];
    for (const text of [c.text, c["text-muted"], c["text-subtle"]]) {
      for (const bg of backgrounds) expectContrast(text, bg, TEXT_MIN, `${theme} text`);
    }
  });

  it.each(THEMES)("%s: màu nhấn làm link, chữ trên nút, mục menu đang chọn", (theme) => {
    const c = ADMIN_COLORS[theme];
    expectContrast(c.accent, c.surface, TEXT_MIN, `${theme} link/surface`);
    expectContrast(c.accent, c.canvas, TEXT_MIN, `${theme} link/canvas`);
    expectContrast(c["on-accent"], c.accent, TEXT_MIN, `${theme} nút chính`);
    expectContrast(c["on-accent"], c["accent-hover"], TEXT_MIN, `${theme} nút chính hover`);
    expectContrast(c["accent-soft-text"], c["accent-soft"], TEXT_MIN, `${theme} menu chọn`);
  });

  it.each(THEMES)("%s: badge 6 tone", (theme) => {
    for (const tone of BADGE_TONE_NAMES) {
      const { fg, bg } = BADGE_TONES[theme][tone];
      expectContrast(fg, bg, TEXT_MIN, `${theme} badge ${tone}`);
    }
  });

  it.each(THEMES)("%s: bậc elevation Payload dùng làm chữ trên nền 0/50/100", (theme) => {
    for (const textStep of ELEVATION_TEXT_STEPS) {
      for (const surfaceStep of ELEVATION_SURFACE_STEPS) {
        expectContrast(ADMIN_ELEVATION[theme][textStep], ADMIN_ELEVATION[theme][surfaceStep], TEXT_MIN, `${theme} elevation-${textStep}/${surfaceStep}`);
      }
    }
  });
});

describe("contrast biên điều khiển (≥ 3:1)", () => {
  it.each(THEMES)("%s: viền input/select/checkbox và focus ring", (theme) => {
    const c = ADMIN_COLORS[theme];
    for (const bg of [c.surface, c.canvas]) {
      expectContrast(c["border-strong"], bg, CONTROL_MIN, `${theme} border-strong`);
      expectContrast(c.focus, bg, CONTROL_MIN, `${theme} focus`);
      expectContrast(c.accent, bg, CONTROL_MIN, `${theme} accent (viền nút chính)`);
    }
    // Bậc 350 = viền điều khiển trong thang Payload.
    expectContrast(ADMIN_ELEVATION[theme][350], ADMIN_ELEVATION[theme][0], CONTROL_MIN, `${theme} elevation-350`);
  });
});

describe("SCSS _tokens.scss trùng admin-tokens.ts", () => {
  const scss = readFileSync(new URL("./styles/_tokens.scss", import.meta.url), "utf8");
  // Khối bắt đầu ở đầu dòng (comment đầu file cũng nhắc tên selector nên không dùng indexOf trần).
  const darkStart = scss.indexOf('\nhtml[data-theme="dark"] {');
  const lightBlock = scss.slice(scss.indexOf("\n:root {"), darkStart);
  const darkBlock = scss.slice(darkStart, scss.indexOf("\n@media"));
  const blocks: Record<AdminTheme, string> = { light: lightBlock, dark: darkBlock };

  function cssValue(theme: AdminTheme, name: string) {
    const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(blocks[theme]);
    return match?.[1]?.trim().toUpperCase();
  }

  it.each(THEMES)("%s: --admin-* màu", (theme) => {
    for (const [name, value] of Object.entries(ADMIN_COLORS[theme])) {
      expect(cssValue(theme, `admin-${name}`), `--admin-${name}`).toBe(value.toUpperCase());
    }
  });

  it.each(THEMES)("%s: --admin-badge-*", (theme) => {
    for (const tone of BADGE_TONE_NAMES) {
      expect(cssValue(theme, `admin-badge-${tone}-fg`)).toBe(BADGE_TONES[theme][tone].fg.toUpperCase());
      expect(cssValue(theme, `admin-badge-${tone}-bg`)).toBe(BADGE_TONES[theme][tone].bg.toUpperCase());
    }
  });

  it.each(THEMES)("%s: --theme-elevation-* đủ 21 bậc", (theme) => {
    for (const step of ELEVATION_STEPS) {
      expect(cssValue(theme, `theme-elevation-${step}`), `elevation-${step}`).toBe(ADMIN_ELEVATION[theme][step].toUpperCase());
    }
  });

  it("radius s/m/l", () => {
    for (const [size, value] of Object.entries(ADMIN_RADIUS)) {
      expect(cssValue("light", `admin-radius-${size}`), `radius-${size}`).toBe(value.toUpperCase());
    }
  });

  it.each(THEMES)("%s: --admin-shadow-sm/md", (theme) => {
    for (const size of ["sm", "md"] as const) {
      expect(cssValue(theme, `admin-shadow-${size}`), `shadow-${size}`).toBe(ADMIN_SHADOW[theme][size].toUpperCase());
    }
  });
});

describe("_controls.scss mobile: vùng bấm checkbox 44x44", () => {
  const scss = readFileSync(new URL("./styles/_controls.scss", import.meta.url), "utf8");
  const mobile = scss.slice(scss.indexOf("@media (max-width: 767px)"));

  it("input checkbox ẩn mở 44x44 căn giữa quanh hộp 22px, label cao 44px, không !important", () => {
    expect(mobile).toMatch(/input\[type="checkbox"\]\s*\{\s*width: 44px;\s*height: 44px;\s*margin-left: -12px;\s*margin-top: -12px;/);
    expect(mobile).toMatch(/label\.field-label\s*\{\s*min-height: 44px;\s*align-items: center;/);
    expect(mobile).toMatch(/\.checkbox-input\s*\{\s*min-height: 44px;\s*align-items: stretch;/);
    expect(mobile).not.toContain("!important");
  });
});
