import { BlocksFeature, createServerFeature, FixedToolbarFeature, type FeatureProviderServer, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { Block } from "payload";

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
 * Dùng cho editor toàn cục; collection muốn chữ gợi ý riêng gọi lại với `placeholder`. `blocks` (BlocksFeature) chỉ truyền cho trường cần khối
 * (`news.content`, BL-054): chèn qua mục "Chèn khối" trên thanh công cụ cố định (`_forms.scss` thêm chữ cạnh icon khối của Payload), nút "+"
 * và tay kéo vẫn ẩn; bỏ trống = editor như cũ.
 */
export function richTextEditorOptions(placeholder: string = DEFAULT_RICH_TEXT_PLACEHOLDER, blocks: Block[] = []) {
  return {
    features: ({ defaultFeatures }: { defaultFeatures: FeatureProviderServer<unknown, unknown, unknown>[] }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      HistoryFeature(),
      ...(blocks.length > 0 ? [BlocksFeature({ blocks })] : []),
    ],
    admin: { placeholder, hideGutter: true, hideAddBlockButton: true, hideDraggableBlockElement: true, hideInsertParagraphAtEnd: true },
  } satisfies Parameters<typeof lexicalEditor>[0];
}

export function createRichTextEditor(placeholder?: string, { blocks }: { blocks?: Block[] } = {}) {
  return lexicalEditor(richTextEditorOptions(placeholder, blocks));
}
