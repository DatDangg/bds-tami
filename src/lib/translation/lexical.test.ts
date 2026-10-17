import { describe, expect, it } from "vitest";

import { applyTextNodes, extractTextNodes } from "./lexical";
import { TranslationError } from "./errors";
import { sampleLexical } from "./test-helpers";

describe("lexical: tách và ghép node chữ", () => {
  it("chỉ lấy chữ của text node theo thứ tự; link url, ảnh, linebreak không được gửi", () => {
    expect(extractTextNodes(sampleLexical())).toEqual(["Giới thiệu dự án", "Căn hộ ", "TAMI HOMES", "Liên hệ", "  Gần trung tâm  "]);
  });

  it("ghép lại: chỉ text đổi; heading, đậm/nghiêng, link url, list, ảnh, linebreak giữ nguyên; không sửa bản gốc", () => {
    const original = sampleLexical();
    const rebuilt = applyTextNodes(original, ["Project introduction", "Apartment ", "TAMI HOMES", "Contact", "  Near the center  "]);
    expect(extractTextNodes(rebuilt)).toEqual(["Project introduction", "Apartment ", "TAMI HOMES", "Contact", "  Near the center  "]);
    const strip = (value: unknown) => JSON.stringify(value, (key, v: unknown) => (key === "text" && typeof v === "string" ? "" : v));
    expect(strip(rebuilt)).toBe(strip(original));
    expect(extractTextNodes(original)[0]).toBe("Giới thiệu dự án");
    const link = (rebuilt.root.children as { children: { type: string; fields?: { url: string } }[] }[])[1]!.children[3]!;
    expect(link.fields?.url).toBe("https://tami.example/lien-he");
  });

  it("sai số lượng bản dịch -> invalid_output", () => {
    expect(() => applyTextNodes(sampleLexical(), ["a"])).toThrow(TranslationError);
    expect(() => applyTextNodes(sampleLexical(), ["1", "2", "3", "4", "5", "6"])).toThrow(/không hợp lệ/);
  });

  it("cây hỏng (text không phải chuỗi, children không phải mảng) -> invalid_input", () => {
    const bad = sampleLexical();
    (bad.root.children as { children: unknown }[])[0]!.children = [{ type: "text", text: 5 }];
    expect(() => extractTextNodes(bad)).toThrow(TranslationError);
    const bad2 = sampleLexical();
    (bad2.root.children as { children: unknown }[])[0]!.children = "x";
    expect(() => extractTextNodes(bad2)).toThrow(TranslationError);
  });
});
