import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { Media } from "@/payload-types";
import { NewsArticleBody, NewsArticleCover, NewsArticleTags } from "./NewsArticle";

const text = (value: string) => ({ type: "text", text: value });
const paragraph = (value: string) => ({ type: "paragraph", children: [text(value)] });
const heading = (tag: string, value: string) => ({ type: "heading", tag, children: [text(value)] });
const content = (...children: unknown[]) => ({ root: { type: "root", children } });

function renderBody(data: unknown, headingIds: string[] = []) {
  return renderWithIntl(<NewsArticleBody content={data} locale="vi" tableLabel="Bảng" headingIds={headingIds} mentionedProjects={new Map()} />);
}

describe("NewsArticleBody: style riêng bài tin tức qua lớp news-prose (BL-054)", () => {
  it("đoạn mở đầu = đoạn văn đầu tiên là con trực tiếp đầu tiên (đoạn rỗng bị bỏ, không lặp); h2 / trích dẫn / ul / ol là con trực tiếp để CSS áp", () => {
    const { container } = renderBody(
      content(
        { type: "paragraph", children: [text("")] },
        paragraph("Mở đầu bài"),
        heading("h2", "Nguồn cung"),
        paragraph("Đoạn hai"),
        { type: "quote", children: [text("Người mua cần pháp lý minh bạch")] },
        { type: "list", listType: "bullet", children: [{ type: "listitem", children: [text("Kết nối nhanh")] }] },
        { type: "list", listType: "number", children: [{ type: "listitem", children: [text("Bước một")] }] },
      ),
      ["nguon-cung"],
    );
    const root = container.querySelector(".news-prose") as HTMLElement;
    const first = root.firstElementChild as HTMLElement;
    expect(first.tagName).toBe("P");
    expect(first).toHaveTextContent("Mở đầu bài");
    expect(screen.getAllByText("Mở đầu bài")).toHaveLength(1);
    expect(root.querySelector(":scope > h2")).toHaveAttribute("id", "nguon-cung");
    expect(root.querySelector(":scope > h2")?.textContent).toBe("Nguồn cung");
    expect(root.querySelector(":scope > blockquote")).toHaveTextContent("Người mua cần pháp lý minh bạch");
    expect(root.querySelector(":scope > ul.list-disc > li")).toHaveTextContent("Kết nối nhanh");
    expect(root.querySelector(":scope > ol")?.className).toContain("list-decimal");
  });

  it("khối 'Số liệu nổi bật' (cũng là ul cấp gốc) KHÔNG có lớp list-disc nên không nhận dấu tích", () => {
    const { container } = renderBody(content(paragraph("Mở"), { type: "block", fields: { blockType: "statHighlights", items: [{ value: "+35%", label: "Nguồn cung" }] } }));
    const stats = container.querySelector(".news-prose > ul") as HTMLElement;
    expect(stats).toHaveTextContent("+35%");
    expect(stats.className).not.toContain("list-disc");
  });

  it("bài bắt đầu bằng heading: con đầu là h2 (không đoạn nào bị đóng khung mở đầu)", () => {
    const { container } = renderBody(content(heading("h2", "Mở đầu"), paragraph("Đoạn sau heading")), ["mo-dau"]);
    expect((container.querySelector(".news-prose") as HTMLElement).firstElementChild?.tagName).toBe("H2");
  });
});

describe("globals.css: news-prose (BL-054)", () => {
  const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

  it("h2 cấp gốc đánh số tròn bằng CSS counter, số trang trí có alt rỗng", () => {
    expect(css).toMatch(/\.news-prose\s*\{\s*counter-reset:\s*news-h2;/);
    expect(css).toMatch(/\.news-prose > h2\s*\{[^}]*counter-increment:\s*news-h2;/);
    expect(css).toContain('content: counter(news-h2, decimal-leading-zero) / "";');
  });

  it("đoạn mở đầu = p:first-child nền nhạt; trích dẫn có dấu ngoặc trang trí; ul dấu tích, ol không bị đụng", () => {
    expect(css).toMatch(/\.news-prose > p:first-child\s*\{[^}]*background-color:\s*var\(--color-primary-subtle\)/);
    expect(css).toContain(String.raw`content: "\201C" / "";`);
    // Chỉ `ul` danh sách của Lexical (`list-disc`): khối "Số liệu nổi bật" cũng là `ul` cấp gốc, không được có dấu tích.
    expect(css).toMatch(/\.news-prose > ul\.list-disc\s*\{[^}]*list-style:\s*none;/);
    expect(css).not.toMatch(/\.news-prose > ul[\s>{:,]/);
    expect(css).not.toMatch(/\.news-prose > ol\s*\{/);
  });

  it("khối news-prose chỉ dùng token màu (không mã màu rời)", () => {
    const block = css.slice(css.indexOf(".news-prose {"));
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(block).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/);
  });

  it("chỉ bài tin tức gắn lớp news-prose (trang dự án / dịch vụ / pháp lý không đổi)", () => {
    const files = readdirSync("src", { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
      .filter((file) => readFileSync(join("src", file), "utf8").includes('"news-prose"'))
      .map((file) => file.replaceAll("\\", "/"));
    expect(files).toEqual(["components/news/NewsArticle.tsx"]);
  });
});

describe("NewsArticleCover", () => {
  it("chú thích lấy từ caption; ảnh giữ alt", () => {
    renderWithIntl(<NewsArticleCover cover={{ ...fakeMedia("c"), caption: "Ảnh minh hoạ" } as unknown as Media} title="Bài" />);
    expect(screen.getByText("Ảnh minh hoạ").tagName).toBe("FIGCAPTION");
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Ảnh c");
  });

  it("không caption: chú thích = alt, ảnh alt rỗng (không đọc hai lần)", () => {
    const { container } = renderWithIntl(<NewsArticleCover cover={fakeMedia("c", "Phối cảnh") as unknown as Media} title="Bài" />);
    expect(container.querySelector("figcaption")).toHaveTextContent("Phối cảnh");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});

describe("NewsArticleTags", () => {
  it("rỗng → không render", () => {
    const { container } = renderWithIntl(<NewsArticleTags tags={[]} listPath="/tin-tuc" />);
    expect(container.innerHTML).toBe("");
  });
});
