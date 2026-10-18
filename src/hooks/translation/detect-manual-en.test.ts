import { describe, expect, it } from "vitest";

import type { TranslatableLeaf } from "../../lib/translation/leaves";
import { hasManualEnglishEdit } from "./detect-manual-en";

const text = (key: string, value: string): TranslatableLeaf => ({ key, path: [key.split(".")[0]!, ...key.split(".").slice(1)], kind: "text", value });
const lexical = (value: string) => ({ root: { type: "root", children: value ? [{ type: "paragraph", children: [{ type: "text", text: value }] }] : [] } });

describe("hasManualEnglishEdit", () => {
  it("không đổi gì (gửi lại nguyên văn) -> không phải sửa tay", () => {
    expect(hasManualEnglishEdit([text("title", "A")], [text("title", "A")], { title: "A" })).toBe(false);
  });

  it("trường EN chưa có (null/thiếu) mà form gửi chuỗi rỗng -> KHÔNG phải sửa tay", () => {
    expect(hasManualEnglishEdit([], [text("excerpt", "")], { excerpt: "" })).toBe(false);
    expect(hasManualEnglishEdit([text("excerpt", "")], [text("excerpt", "")], { excerpt: "" })).toBe(false);
    expect(hasManualEnglishEdit([], [text("excerpt", "   ")], { excerpt: "   " })).toBe(false);
  });

  it("nhập chữ vào trường EN trống, hoặc sửa chữ đã có -> sửa tay", () => {
    expect(hasManualEnglishEdit([], [text("excerpt", "Hello")], { excerpt: "Hello" })).toBe(true);
    expect(hasManualEnglishEdit([text("title", "A")], [text("title", "B")], { title: "B" })).toBe(true);
  });

  it("xoá trắng trường EN đã có chữ (gửi rỗng, hoặc hàng bị bỏ khỏi array) -> sửa tay", () => {
    expect(hasManualEnglishEdit([text("title", "A")], [text("title", "")], { title: "" })).toBe(true);
    expect(hasManualEnglishEdit([text("columns.r1.title", "A")], [], { columns: [] })).toBe(true);
  });

  it("PATCH một phần: trường cấp cao KHÔNG có trong dữ liệu gửi lên không bị tính là bị xoá", () => {
    expect(hasManualEnglishEdit([text("title", "A"), text("excerpt", "B")], [text("title", "A")], { title: "A" })).toBe(false);
  });

  it("richText rỗng và thiếu tương đương nhau", () => {
    const rich = (key: string, value: ReturnType<typeof lexical>): TranslatableLeaf => ({ key, path: [key], kind: "richText", value });
    expect(hasManualEnglishEdit([], [rich("content", lexical(""))], { content: lexical("") })).toBe(false);
    expect(hasManualEnglishEdit([rich("content", lexical("x"))], [rich("content", lexical(""))], { content: lexical("") })).toBe(true);
  });
});
