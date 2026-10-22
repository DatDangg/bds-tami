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

describe("lexical: chữ trong khối chèn của Tin tức (BL-054)", () => {
  const statBlock = () => ({
    type: "block",
    version: 2,
    format: "",
    fields: {
      id: "blk-stat",
      blockName: "",
      blockType: "statHighlights",
      items: [
        { id: "row-1", value: "+18%", label: "Nguồn cung mới" },
        { id: "row-2", value: "35", label: "Dự án mở bán" },
      ],
    },
  });
  const projectBlock = () => ({ type: "block", version: 2, format: "", fields: { id: "blk-proj", blockName: "", blockType: "projectMention", project: "11111111-1111-4111-8111-111111111111" } });
  const imageTextBlock = () => ({
    type: "block",
    version: 2,
    format: "",
    fields: { id: "blk-img", blockName: "", blockType: "imageText", image: "22222222-2222-4222-8222-222222222222", text: "Căn hộ hướng sông\nGần trung tâm", imagePosition: "right" },
  });
  const withBlocks = () => {
    const content = sampleLexical();
    (content.root.children as unknown[]).splice(1, 0, statBlock(), projectBlock());
    (content.root.children as unknown[]).push(imageTextBlock(), { type: "block", version: 2, fields: { id: "x", blockType: "embed", html: "<iframe>", text: "KHÔNG-GỬI" } });
    return content;
  };

  it("lấy value/label của Số liệu nổi bật và text của Ảnh cạnh chữ theo thứ tự tài liệu; khối lạ, id, quan hệ, select không gửi", () => {
    expect(extractTextNodes(withBlocks())).toEqual([
      "Giới thiệu dự án",
      "+18%",
      "Nguồn cung mới",
      "35",
      "Dự án mở bán",
      "Căn hộ ",
      "TAMI HOMES",
      "Liên hệ",
      "  Gần trung tâm  ",
      "Căn hộ hướng sông\nGần trung tâm",
    ]);
  });

  it("ghép bản dịch không ra invalid_output; blockType / id / project / image / imagePosition giữ nguyên", () => {
    const original = withBlocks();
    const source = extractTextNodes(original);
    const rebuilt = applyTextNodes(original, source.map((text) => `EN:${text}`));
    expect(extractTextNodes(rebuilt)).toEqual(source.map((text) => `EN:${text}`));
    const children = rebuilt.root.children as { fields?: Record<string, unknown> }[];
    expect(children[1]!.fields).toEqual({
      id: "blk-stat",
      blockName: "",
      blockType: "statHighlights",
      items: [
        { id: "row-1", value: "EN:+18%", label: "EN:Nguồn cung mới" },
        { id: "row-2", value: "EN:35", label: "EN:Dự án mở bán" },
      ],
    });
    expect(children[2]!.fields).toEqual(projectBlock().fields);
    expect(children[7]!.fields).toEqual({ ...imageTextBlock().fields, text: "EN:Căn hộ hướng sông\nGần trung tâm" });
    expect(children[8]!.fields).toEqual({ id: "x", blockType: "embed", html: "<iframe>", text: "KHÔNG-GỬI" });
    // Bản gốc không bị sửa.
    expect(extractTextNodes(original)[1]).toBe("+18%");
  });

  it("khối dở dang (thiếu items / chữ không phải chuỗi / hàng hỏng) không ném lỗi và không gửi phần thiếu", () => {
    const content = sampleLexical();
    (content.root.children as unknown[]).push(
      { type: "block", version: 2, fields: { blockType: "statHighlights" } },
      { type: "block", version: 2, fields: { blockType: "statHighlights", items: [null, { value: 5, label: "Chỉ nhãn" }] } },
      { type: "block", version: 2, fields: { blockType: "imageText", text: null } },
      { type: "block", version: 2, fields: null },
    );
    const texts = extractTextNodes(content);
    expect(texts.slice(-1)).toEqual(["Chỉ nhãn"]);
    expect(() => applyTextNodes(content, texts)).not.toThrow();
  });

  it("đếm chữ trong khối vào trần số ô chữ", () => {
    const rows = Array.from({ length: 1_001 }, (_, index) => ({ id: `r${index}`, value: "1", label: "a" }));
    const content = { root: { type: "root", children: [{ type: "block", version: 2, fields: { blockType: "statHighlights", items: rows } }] } };
    expect(() => extractTextNodes(content)).toThrow(TranslationError);
  });
});
