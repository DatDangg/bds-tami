import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Đọc token thật từ globals.css để test không lệch khỏi CSS đang chạy (tokens §9).
// Checkout Windows (core.autocrlf) ra CRLF; marker bên dưới viết theo LF.
const css = readFileSync("src/app/(frontend)/globals.css", "utf8").replace(/\r\n/g, "\n");

function declarationsOf(block: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    map.set(name!, value!.trim());
  }
  return map;
}

function blockAfter(marker: string): string {
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`Không thấy ${marker} trong globals.css`);
  return css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
}

const lightTokens = declarationsOf(blockAfter("@theme static"));
const darkOverrides = declarationsOf(blockAfter(".theme-dark-block {\n  --color-bg"));

function resolveColor(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  if (!value) throw new Error(`Thiếu token ${name}`);
  const ref = /^var\((--color-[\w-]+)\)$/.exec(value);
  return ref ? resolveColor(tokens, ref[1]!) : value;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => channelLuminance(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
}

const light = (name: string) => resolveColor(lightTokens, name);
const dark = (name: string) => resolveColor(new Map([...lightTokens, ...darkOverrides]), name);

const TEXT = 4.5; // chữ thường
const UI = 3; // chữ lớn, thành phần UI (WCAG 1.4.11)

describe("tương phản token (tokens §9)", () => {
  it("giữ đúng 4 giá trị đã sửa so với DESIGN.md", () => {
    expect(light("--color-text-muted").toLowerCase()).toBe("#6b6b6b");
    expect(light("--color-accent-display").toLowerCase()).toBe("#a07a3f");
    expect(light("--color-warning").toLowerCase()).toBe("#8a5a0a");
    expect(light("--color-input-border").toLowerCase()).toBe("#857f79");
  });

  const textPairs: Array<[string, string, string, number]> = [
    ["text/bg", "--color-text", "--color-bg", TEXT],
    ["text/surface", "--color-text", "--color-surface", TEXT],
    ["text-secondary/bg", "--color-text-secondary", "--color-bg", TEXT],
    ["text-muted/bg", "--color-text-muted", "--color-bg", TEXT],
    ["text-muted/surface", "--color-text-muted", "--color-surface", TEXT],
    ["text-muted/surface-muted", "--color-text-muted", "--color-surface-muted", TEXT],
    ["accent-text/bg", "--color-accent-text", "--color-bg", TEXT],
    ["accent-text/surface", "--color-accent-text", "--color-surface", TEXT],
    ["accent-display/bg (chữ lớn)", "--color-accent-display", "--color-bg", UI],
    ["Button primary", "--color-primary-foreground", "--color-primary", TEXT],
    ["Button primary hover", "--color-primary-foreground", "--color-primary-hover", TEXT],
    ["Button dark", "--color-on-dark", "--color-dark", TEXT],
    ["Button dark hover", "--color-on-dark", "--color-dark-deep", TEXT],
    ["Button outline hover", "--color-surface", "--color-text", TEXT],
    ["Badge primary (đầu sáng gradient vàng)", "--color-badge-foreground", "--color-primary", TEXT],
    ["Badge primary (đầu đậm gradient vàng)", "--color-badge-foreground", "--color-primary-deep", TEXT],
    ["Badge Đang bán (đầu sáng gradient xanh)", "--color-on-dark", "--color-success", TEXT],
    ["Badge Đang bán (đầu đậm gradient xanh)", "--color-on-dark", "--color-success-text", TEXT],
    ["Button secondary", "--color-accent-text", "--color-surface", TEXT],
    ["text/bg-alt", "--color-text", "--color-bg-alt", TEXT],
    ["Badge neutral", "--color-text", "--color-surface-muted", TEXT],
    ["Badge dark", "--color-on-dark", "--color-dark", TEXT],
    ["Badge muted", "--color-text-muted", "--color-surface-muted", TEXT],
    ["Badge warning", "--color-warning", "--color-warning-subtle", TEXT],
    ["Input error text", "--color-error", "--color-surface", TEXT],
    ["Select item highlighted", "--color-text", "--color-primary-soft", TEXT],
    ["Checkbox tick", "--color-primary-foreground", "--color-primary", TEXT],
  ];

  it.each(textPairs)("%s đạt ngưỡng", (_label, fg, bg, min) => {
    expect(contrast(light(fg), light(bg))).toBeGreaterThanOrEqual(min);
  });

  const uiPairs: Array<[string, string, string]> = [
    ["input-border/surface", "--color-input-border", "--color-surface"],
    ["input-border/bg", "--color-input-border", "--color-bg"],
    ["focus-ring/bg", "--color-focus-ring", "--color-bg"],
    ["focus-ring/surface", "--color-focus-ring", "--color-surface"],
  ];

  it.each(uiPairs)("%s >= 3:1 (viền/vòng focus)", (_label, fg, bg) => {
    expect(contrast(light(fg), light(bg))).toBeGreaterThanOrEqual(UI);
  });

  it("khối tối: chữ, viền input, focus ring vẫn đạt ngưỡng", () => {
    expect(contrast(dark("--color-text"), dark("--color-bg"))).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(dark("--color-text-secondary"), dark("--color-bg"))).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(dark("--color-text-muted"), dark("--color-bg"))).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(dark("--color-accent-text"), dark("--color-bg"))).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(dark("--color-input-border"), dark("--color-surface"))).toBeGreaterThanOrEqual(UI);
    expect(contrast(dark("--color-focus-ring"), dark("--color-bg"))).toBeGreaterThanOrEqual(UI);
  });
});

describe("PageBanner biến thể Ảnh: chữ trên scrim (FR-ADM-20)", () => {
  // Trường hợp xấu nhất: ảnh trắng tinh (255) dưới scrim `--color-banner-scrim` (rgb + alpha).
  function scrimOverWhite(token: string): string {
    const match = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(light(token));
    if (!match) throw new Error(`${token} không phải rgb(r g b / a)`);
    const [, r, g, b, alpha] = match;
    const blend = (channel: string) => Math.round(Number(alpha) * Number(channel) + (1 - Number(alpha)) * 255);
    return `#${[r, g, b].map((channel) => blend(channel!).toString(16).padStart(2, "0")).join("")}`;
  }

  it("h1 (--color-on-dark) trên ảnh trắng đạt 4.5:1", () => {
    expect(contrast(light("--color-on-dark"), scrimOverWhite("--color-banner-scrim"))).toBeGreaterThanOrEqual(TEXT);
  });

  it("mô tả dùng on-dark vì on-dark-muted không đạt 4.5:1 trên ảnh trắng", () => {
    // PageBanner.tsx dùng `text-on-dark` cho mô tả; on-dark-muted không đạt trên ảnh sáng nên không được dùng ở đây.
    expect(contrast(light("--color-on-dark-muted"), scrimOverWhite("--color-banner-scrim"))).toBeLessThan(TEXT);
  });

  it("không đổi --color-overlay dùng chung (hero, dialog, sheet)", () => {
    expect(light("--color-overlay")).toBe("rgb(10 12 16 / 0.55)");
  });
});

describe("kính mờ sáng của header (BL-020)", () => {
  // Trường hợp xấu nhất của kính nửa trong suốt: nền phía sau là đen (ảnh hero tối) hoặc trắng; chỉ --color-text được dùng làm chữ trên kính: accent-text chỉ đạt ~3.0:1 khi nền sau kính là đen (task header phải đánh dấu mục đang chọn bằng gạch chân/đậm, không bằng màu accent).
  function glassOver(backdrop: number): string {
    const match = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(light("--color-glass"));
    if (!match) throw new Error("--color-glass không phải rgb(r g b / a)");
    const [, r, g, b, alpha] = match;
    const blend = (channel: string) => Math.round(Number(alpha) * Number(channel) + (1 - Number(alpha)) * backdrop);
    return `#${[r, g, b].map((channel) => blend(channel!).toString(16).padStart(2, "0")).join("")}`;
  }

  it.each([
    ["đen", 0],
    ["trắng", 255],
  ])("chữ --color-text trên kính trước nền %s đạt 4.5:1", (_label, backdrop) => {
    expect(contrast(light("--color-text"), glassOver(backdrop))).toBeGreaterThanOrEqual(TEXT);
  });

  it("kính chỉ trong @supports backdrop-filter, giảm trong suốt/không hỗ trợ → nền đặc; vòng focus của header dùng màu chữ", () => {
    const bar = css.slice(css.indexOf(".site-header-bar {"));
    const flat = bar.replace(/\s+/g, " ");
    expect(flat).toContain(".site-header-bar { background-color: var(--color-surface); }");
    expect(flat).toContain("@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .site-header-bar { background-color: var(--color-glass);");
    expect(flat).toContain("@media (prefers-reduced-transparency: reduce) { .site-header-bar { background-color: var(--color-surface);");
    expect(flat).toContain(".site-header-bar :focus-visible { outline-color: var(--color-text); }");
  });

  it("khung kính của thẻ dự án (.glass-panel) theo cùng quy tắc: nền đặc mặc định, kính trong @supports, đặc lại khi giảm trong suốt", () => {
    const flat = css.slice(css.indexOf(".glass-panel {")).replace(/\s+/g, " ");
    expect(flat).toContain(".glass-panel { background-color: var(--color-surface); }");
    expect(flat).toContain("@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .glass-panel { background-color: var(--color-glass);");
    expect(flat).toContain("@media (prefers-reduced-transparency: reduce) { .glass-panel { background-color: var(--color-surface);");
  });

  it("khai báo token kính và gradient", () => {
    expect(css).toMatch(/--blur-glass:\s*24px;/);
    expect(css).toMatch(/--gradient-gold:\s*linear-gradient\(/);
    expect(css).toMatch(/--gradient-success:\s*linear-gradient\(/);
    expect(css).toMatch(/--radius-xl:\s*20px;/);
    expect(css).toMatch(/--radius-pill:\s*9999px;/);
  });
});

describe("banner CTA trang chủ: chữ + nút trên ảnh tràn viền (BL-020 #7)", () => {
  // Trường hợp xấu nhất: ảnh trắng tinh dưới scrim `--color-banner-scrim`; chữ trắng của tiêu đề, mô tả và nút phụ (chip) đều nằm trên đó.
  const match = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(light("--color-banner-scrim"));
  if (!match) throw new Error("--color-banner-scrim không phải rgb(r g b / a)");
  const [, r, g, b, alpha] = match;
  const blend = (channel: string) => Math.round(Number(alpha) * Number(channel) + (1 - Number(alpha)) * 255);
  const overWhite = `#${[r, g, b].map((channel) => blend(channel!).toString(16).padStart(2, "0")).join("")}`;

  it("tiêu đề, mô tả và chữ nút phụ (--color-on-dark) trên ảnh trắng đạt 4.5:1", () => {
    expect(contrast(light("--color-on-dark"), overWhite)).toBeGreaterThanOrEqual(TEXT);
  });

  it("nút chính giữ nền primary + chữ primary-foreground (không phụ thuộc ảnh)", () => {
    expect(contrast(light("--color-primary-foreground"), light("--color-primary"))).toBeGreaterThanOrEqual(TEXT);
  });
});

describe("banner CTA có ảnh: vòng focus (BL-020 #7)", () => {
  it("vòng focus mặc định chỉ ~3:1 trên scrim đè ảnh trắng nên khối có ảnh dùng outline-on-dark (trắng) đạt >= 3:1 (UI)", () => {
    const [, r, g, b, alpha] = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(light("--color-banner-scrim"))!;
    const blend = (c: string) => Math.round(Number(alpha) * Number(c) + (1 - Number(alpha)) * 255);
    const overWhite = `#${[r, g, b].map((c) => blend(c!).toString(16).padStart(2, "0")).join("")}`;
    expect(contrast(light("--color-on-dark"), overWhite)).toBeGreaterThanOrEqual(3);
    expect(contrast(light("--color-focus-ring"), overWhite)).toBeLessThan(TEXT);
    const source = readFileSync("src/components/layout/CtaBanner.tsx", "utf8");
    expect(source).toContain("outline-on-dark");
    expect(source).toContain("min-h-[26rem]");
  });
});
