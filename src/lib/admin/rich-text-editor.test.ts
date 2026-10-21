import { describe, expect, it } from "vitest";

import { DEFAULT_RICH_TEXT_PLACEHOLDER, richTextEditorOptions } from "./rich-text-editor";

describe("richTextEditorOptions (BL-042)", () => {
  it("ẩn nút +/tay kéo/lề xám/nút chèn đoạn cuối, chữ gợi ý tiếng Việt mặc định", () => {
    expect(richTextEditorOptions().admin).toEqual({
      placeholder: DEFAULT_RICH_TEXT_PLACEHOLDER,
      hideGutter: true,
      hideAddBlockButton: true,
      hideDraggableBlockElement: true,
      hideInsertParagraphAtEnd: true,
    });
    expect(DEFAULT_RICH_TEXT_PLACEHOLDER).toBe("Nhập nội dung tại đây…");
  });

  it("collection truyền được chữ gợi ý riêng", () => {
    expect(richTextEditorOptions("Quyết định phê duyệt 1/500 số…").admin.placeholder).toBe("Quyết định phê duyệt 1/500 số…");
  });

  it("giữ mọi feature mặc định rồi thêm thanh công cụ cố định + Hoàn tác/Làm lại", () => {
    const base = [{ key: "bold" }, { key: "italic" }] as never[];
    const keys = richTextEditorOptions()
      .features({ defaultFeatures: base })
      .map((feature: { key: string }) => feature.key);
    expect(keys).toEqual(["bold", "italic", "toolbarFixed", "tamiHistory"]);
  });
});
