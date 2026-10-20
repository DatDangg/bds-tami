import { createServerFeature, FixedToolbarFeature, type FeatureProviderServer, lexicalEditor } from "@payloadcms/richtext-lexical";

/** Chữ gợi ý mặc định khi ô soạn thảo trống (thay "Bắt đầu gõ, hoặc nhấn '/'…" của Payload). */
export const DEFAULT_RICH_TEXT_PLACEHOLDER = "Nhập nội dung tại đây…";

/** Nút Hoàn tác / Làm lại: phần giao diện nằm ở `components/admin/lexical/HistoryFeatureClient`. */
const HistoryFeature = createServerFeature({
  feature: { ClientFeature: "/components/admin/lexical/HistoryFeatureClient#HistoryFeatureClient" },
  key: "tamiHistory",
});

/**
 * Ô soạn thảo văn bản cho người không rành công nghệ (BL-042): thanh công cụ cố định luôn hiện (đậm, nghiêng, tiêu đề, danh sách,
 * liên kết, chèn ảnh, hoàn tác/làm lại), ẩn nút "+", tay kéo, lề xám và dấu "nhấn /". Định dạng dữ liệu lexical không đổi.
 * Dùng cho editor toàn cục; collection muốn chữ gợi ý riêng gọi lại với `placeholder`.
 */
export function richTextEditorOptions(placeholder: string = DEFAULT_RICH_TEXT_PLACEHOLDER) {
  return {
    features: ({ defaultFeatures }: { defaultFeatures: FeatureProviderServer<unknown, unknown, unknown>[] }) => [...defaultFeatures, FixedToolbarFeature(), HistoryFeature()],
    admin: { placeholder, hideGutter: true, hideAddBlockButton: true, hideDraggableBlockElement: true, hideInsertParagraphAtEnd: true },
  } satisfies Parameters<typeof lexicalEditor>[0];
}

export function createRichTextEditor(placeholder?: string) {
  return lexicalEditor(richTextEditorOptions(placeholder));
}
