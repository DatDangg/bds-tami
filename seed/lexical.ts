/** Nội dung richText (Lexical) tối giản: các đoạn văn thuần chữ. Dùng cho dữ liệu seed. */
export function paragraphsToLexical(paragraphs: readonly string[]) {
  return {
    root: {
      type: "root",
      version: 1,
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      children: paragraphs.map((text) => ({
        type: "paragraph",
        version: 1,
        direction: "ltr" as const,
        format: "" as const,
        indent: 0,
        textFormat: 0,
        children: [{ type: "text", version: 1, text, detail: 0, format: 0, mode: "normal" as const, style: "" }],
      })),
    },
  };
}
