import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import en from "./messages/en.json";
import vi from "./messages/vi.json";

const lookup = (messages: unknown, path: string): unknown => path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined), messages);

describe("khoá i18n mà load-shell dùng (tiêu đề cột footer ở mọi trang công khai)", () => {
  const source = readFileSync("src/components/layout/load-shell.ts", "utf8");
  const keys = [...source.matchAll(/\bt\("([\w.]+)"\)/g)].map((match) => match[1]!);

  it("tìm thấy các khoá chữ trong nguồn (bảo đảm regex còn khớp)", () => {
    expect(keys).toContain("footer.columns.explore");
    expect(keys).toContain("footer.columns.about");
  });

  it.each([
    ["vi", vi],
    ["en", en],
  ])("mọi t(\"...\") nằm trong namespace layout có chuỗi ở %s", (_locale, messages) => {
    for (const key of keys) expect(lookup((messages as { layout: unknown }).layout, key), key).toEqual(expect.any(String));
  });
});
