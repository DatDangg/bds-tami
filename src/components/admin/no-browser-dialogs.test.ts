import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// BL-058: admin chỉ dùng modal/toast của Payload, không dùng hộp thoại trình duyệt ("localhost says…").
const roots = ["src/components/admin", "src/app/(payload)"];

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.(ts|tsx|js|jsx)$/.test(name) && !name.includes(".test.") ? [path] : [];
  });
}

const sources = roots.flatMap(listSources).map((file) => [file, readFileSync(file, "utf8")] as const);
const BROWSER_DIALOG = /(?<![\w.$])(?:window\s*\.\s*|globalThis\s*\.\s*)?(?:alert|confirm|prompt)\s*\(/;

describe("admin không dùng hộp thoại trình duyệt", () => {
  it("có file để quét", () => {
    expect(sources.length).toBeGreaterThan(20);
  });

  it.each(sources)("%s không gọi alert/confirm/prompt", (_file, code) => {
    expect(code).not.toMatch(BROWSER_DIALOG);
  });

  it("bộ quét bắt được cả dạng window.* và gọi trần", () => {
    expect("if (!window.confirm(x)) return;").toMatch(BROWSER_DIALOG);
    expect("alert('x')").toMatch(BROWSER_DIALOG);
    expect("const a = prompt ('x')").toMatch(BROWSER_DIALOG);
    expect("openModal(slug)").not.toMatch(BROWSER_DIALOG);
  });
});
