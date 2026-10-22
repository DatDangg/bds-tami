import { describe, expect, it } from "vitest";
import type { Category, News } from "../../payload-types";
import { estimateReadMinutes, lexicalPlainText } from "./read-time";
import { categoryHref, toNewsCardData, toNewsCards, visibleCategory } from "./news-view";

const category = (overrides: Partial<Category> = {}): Category => ({
  id: "c1",
  name: "Thị trường",
  slug: "thi-truong",
  scope: "news",
  hasEnglish: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const news = (overrides: Partial<News> = {}): News => ({
  id: "n1",
  title: "Tiêu đề",
  slug: "tieu-de",
  excerpt: "Tóm tắt",
  status: "published",
  author: "a1",
  publishedAt: "2026-03-05T03:00:00.000Z",
  category: category(),
  updatedAt: "2026-03-05T03:00:00.000Z",
  createdAt: "2026-03-05T03:00:00.000Z",
  ...overrides,
});

describe("visibleCategory", () => {
  it("id chưa populate (danh mục ở thùng rác / không đọc được) → null", () => {
    expect(visibleCategory("c1", "vi")).toBeNull();
    expect(visibleCategory(null, "vi")).toBeNull();
  });

  it("vi: hiện khi có tên + slug; en: thêm điều kiện hasEnglish", () => {
    expect(visibleCategory(category(), "vi")?.name).toBe("Thị trường");
    expect(visibleCategory(category(), "en")).toBeNull();
    expect(visibleCategory(category({ hasEnglish: true, name: "Market", slug: "market" }), "en")?.name).toBe("Market");
  });

  it("thiếu tên hoặc slug → null (không hiện nhãn rỗng)", () => {
    expect(visibleCategory(category({ name: null }), "vi")).toBeNull();
    expect(visibleCategory(category({ slug: null }), "vi")).toBeNull();
  });
});

describe("toNewsCardData", () => {
  it("href công khai theo ngôn ngữ; ngày theo múi giờ VN; nhãn danh mục", () => {
    const vi = toNewsCardData(news(), "vi");
    expect(vi).toMatchObject({ href: "/tin-tuc/tieu-de", dateLabel: "05/03/2026", categoryName: "Thị trường", cover: null });
    const en = toNewsCardData(news({ slug: "title", category: category({ hasEnglish: true, name: "Market" }) }), "en");
    expect(en).toMatchObject({ href: "/en/news/title", categoryName: "Market" });
  });

  it("/en: danh mục chưa có bản EN không lộ tên", () => {
    expect(toNewsCardData(news({ slug: "title" }), "en")?.categoryName).toBeNull();
  });

  it("bài thiếu tiêu đề/slug bị bỏ khỏi danh sách thẻ", () => {
    expect(toNewsCardData(news({ title: null }), "vi")).toBeNull();
    expect(toNewsCards([news({ slug: null }), news({ id: "n2", slug: "b" })], "vi").map((card) => card.id)).toEqual(["n2"]);
  });

  it("categoryHref dùng slug theo ngôn ngữ", () => {
    expect(categoryHref(category(), "vi")).toBe("/tin-tuc/danh-muc/thi-truong");
    expect(categoryHref(category({ slug: "market" }), "en")).toBe("/en/news/category/market");
  });
});

describe("estimateReadMinutes", () => {
  const richText = (words: number) => ({
    root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: Array.from({ length: words }, () => "từ").join(" ") }] }] },
  });

  it("tối thiểu 1 phút; 200 từ/phút làm tròn lên", () => {
    expect(estimateReadMinutes(null)).toBe(1);
    expect(estimateReadMinutes(richText(10))).toBe(1);
    expect(estimateReadMinutes(richText(200))).toBe(1);
    expect(estimateReadMinutes(richText(201))).toBe(2);
    expect(estimateReadMinutes(richText(1000))).toBe(5);
  });

  it("lexicalPlainText nối chữ của mọi text node lồng nhau, bỏ qua dữ liệu sai dạng", () => {
    const nested = { root: { children: [{ type: "paragraph", children: [{ type: "text", text: "a" }, { type: "link", children: [{ type: "text", text: "b" }] }, { type: "text", text: 5 }] }, 7, null] } };
    expect(lexicalPlainText(nested)).toBe("a b");
    expect(lexicalPlainText("x")).toBe("");
  });

  it("đếm cả chữ trong khối chèn Tin tức (BL-054); khối Dự án nhắc đến / khối lạ không có chữ", () => {
    const words = (count: number) => Array.from({ length: count }, () => "chữ").join(" ");
    const content = {
      root: {
        children: [
          { type: "paragraph", children: [{ type: "text", text: words(150) }] },
          { type: "block", fields: { blockType: "statHighlights", items: [{ value: "+18%", label: words(9) }] } },
          { type: "block", fields: { blockType: "imageText", text: words(40), image: "m1", imagePosition: "left" } },
          { type: "block", fields: { blockType: "projectMention", project: "p1" } },
          { type: "block", fields: { blockType: "embed", text: words(500) } },
        ],
      },
    };
    expect(lexicalPlainText(content).split(/\s+/)).toHaveLength(200);
    expect(estimateReadMinutes(content)).toBe(1);
    const longer = structuredClone(content);
    (longer.root.children[2]!.fields as { text: string }).text = words(41);
    expect(estimateReadMinutes(longer)).toBe(2);
  });
});
