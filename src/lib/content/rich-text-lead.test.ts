import { describe, expect, it } from "vitest";
import { firstParagraphText, splitOverview } from "./rich-text-lead";

const text = (value: string, format = 0) => ({ type: "text", text: value, format });
const paragraph = (...children: unknown[]) => ({ type: "paragraph", children });
const p = (value: string) => paragraph(text(value));
const heading = (value: string) => ({ type: "heading", tag: "h2", children: [text(value)] });
const list = (...items: string[]) => ({ type: "list", children: items.map((item) => ({ type: "listitem", children: [text(item)] })) });
// Ảnh hợp lệ theo tiêu chí `RichText.renderUpload` (media đã populate, có url, mimeType ảnh).
const media = { id: "1", url: "/api/media/file/a.jpg", mimeType: "image/jpeg" };
const upload = { type: "upload", relationTo: "media", value: media };
const doc = (...children: unknown[]) => ({ root: { type: "root", children } });

describe("firstParagraphText", () => {
  it("lấy đoạn văn đầu có chữ, bỏ heading / list đứng trước, gộp khoảng trắng", () => {
    expect(firstParagraphText(doc(heading("Tiêu đề"), list("a", "b"), p("  Đoạn   một  "), p("Đoạn hai")))).toBe("Đoạn một");
  });

  it("chữ đậm đứng ngay trước dấu phẩy không bị chèn khoảng trắng", () => {
    expect(firstParagraphText(doc(paragraph(text("Dự án "), text("Sun Festo Town", 1), text(", nằm tại Hạ Long."))))).toBe("Dự án Sun Festo Town, nằm tại Hạ Long.");
  });

  it("link lồng + đổi định dạng giữa từ giữ nguyên từ", () => {
    const link = { type: "link", children: [text("Sun"), text("rise", 1)] };
    expect(firstParagraphText(doc(paragraph(text("Xem "), link, text(", ok"), text(" Ha"), text("Long", 2))))).toBe("Xem Sunrise, ok HaLong");
  });

  it("linebreak / tab → khoảng trắng", () => {
    expect(firstParagraphText(doc(paragraph(text("Xin"), { type: "linebreak" }, text("chào"), { type: "tab" }, text("bạn"))))).toBe("Xin chào bạn");
  });

  it("bỏ đoạn rỗng; rỗng / không có paragraph / dữ liệu lạ → null", () => {
    expect(firstParagraphText(doc(p("  "), p("Có chữ")))).toBe("Có chữ");
    expect(firstParagraphText(doc(heading("H"), list("x")))).toBeNull();
    expect(firstParagraphText(doc())).toBeNull();
    expect(firstParagraphText(null)).toBeNull();
    expect(firstParagraphText("text")).toBeNull();
  });
});

describe("splitOverview", () => {
  it("không có tóm tắt: đoạn đầu làm lead và bị bỏ khỏi phần mở rộng (không lặp)", () => {
    const { lead, rest } = splitOverview(doc(heading("H"), p("Đoạn một"), p("Đoạn hai")));
    expect(lead).toBe("Đoạn một");
    expect(JSON.stringify(rest)).not.toContain("Đoạn một");
    expect(JSON.stringify(rest)).toContain("Đoạn hai");
  });

  it("chỉ đúng đoạn dẫn → không còn gì mở rộng", () => {
    expect(splitOverview(doc(p("Chỉ một đoạn"), p("  ")))).toEqual({ lead: "Chỉ một đoạn", rest: null });
  });

  it("đoạn dẫn + ảnh → ảnh là nội dung thêm", () => {
    const { lead, rest } = splitOverview(doc(p("Đoạn"), upload));
    expect(lead).toBe("Đoạn");
    expect(rest).toEqual({ root: { type: "root", children: [upload] } });
  });

  it("có tóm tắt + richText chỉ có ảnh / bảng → vẫn có phần mở rộng; tóm tắt được chuẩn hoá", () => {
    expect(splitOverview(doc(upload), "Tóm tắt").rest).not.toBeNull();
    expect(splitOverview(doc(upload), " Tóm   tắt ").lead).toBe("Tóm tắt");
    expect(splitOverview(doc({ type: "table", children: [] }), "T").rest).not.toBeNull();
    const withSummary = splitOverview(doc(p("Đoạn đầu"), p("Đoạn sau")), "Tóm tắt");
    expect(JSON.stringify(withSummary.rest)).toContain("Đoạn đầu");
  });

  it("richText rỗng / block lạ không hiển thị → rest null", () => {
    expect(splitOverview(null, "Tóm tắt")).toEqual({ lead: "Tóm tắt", rest: null });
    expect(splitOverview(doc(p("  "), { type: "block", fields: {} }), null)).toEqual({ lead: null, rest: null });
  });

  // BL-057 n-1: upload mà `RichText` không dựng được (media đã xoá / chưa populate / không phải ảnh / collection khác)
  // không tính là nội dung thêm — tránh nút "Xem thêm" mở ra trống.
  it.each([
    ["value là id string (chưa populate)", { type: "upload", relationTo: "media", value: "1" }],
    ["media đã xoá (value null)", { type: "upload", relationTo: "media", value: null }],
    ["media không có url", { type: "upload", relationTo: "media", value: { id: "1" } }],
    ["mimeType không phải ảnh", { type: "upload", relationTo: "media", value: { ...media, mimeType: "application/pdf" } }],
    ["relationTo khác media", { type: "upload", relationTo: "private-files", value: media }],
    ["không có relationTo", { type: "upload", value: media }],
  ])("upload rỗng (%s) → rest null, cả khi có tóm tắt lẫn khi lead lấy từ richText", (_label, emptyUpload) => {
    expect(splitOverview(doc(emptyUpload), "Tóm tắt").rest).toBeNull();
    expect(splitOverview(doc(p("Đoạn"), emptyUpload))).toEqual({ lead: "Đoạn", rest: null });
  });

  it("upload hợp lệ không có mimeType vẫn tính là nội dung thêm (như RichText)", () => {
    expect(splitOverview(doc({ type: "upload", relationTo: "media", value: { id: "1", url: "/a.jpg" } }), "T").rest).not.toBeNull();
  });

  it("heading đứng trước đoạn dẫn vẫn nằm trong phần mở rộng", () => {
    const { rest } = splitOverview(doc(heading("Tiêu đề"), p("Đoạn")));
    expect(JSON.stringify(rest)).toContain("Tiêu đề");
  });
});
