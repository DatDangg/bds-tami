import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { NewsArticleBody, NewsArticleTags } from "./NewsArticle";
import { NewsArticleContactNote } from "./NewsArticleContactNote";
import { NewsArticleHero } from "./NewsArticleHero";

const text = (value: string) => ({ type: "text", text: value });
const paragraph = (value: string) => ({ type: "paragraph", children: [text(value)] });
const heading = (tag: string, value: string) => ({ type: "heading", tag, children: [text(value)] });
const content = (...children: unknown[]) => ({ root: { type: "root", children } });

function renderBody(data: unknown, headingIds: string[] = []) {
  return renderWithIntl(<NewsArticleBody content={data} locale="vi" tableLabel="Bảng" headingIds={headingIds} mentionedProjects={new Map()} />);
}

describe("NewsArticleBody: style riêng bài tin tức qua lớp news-prose (BL-054 / BL-062)", () => {
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

  it("bài bắt đầu bằng heading: con đầu là h2 (không đoạn nào bị coi là đoạn mở đầu)", () => {
    const { container } = renderBody(content(heading("h2", "Mở đầu"), paragraph("Đoạn sau heading")), ["mo-dau"]);
    expect((container.querySelector(".news-prose") as HTMLElement).firstElementChild?.tagName).toBe("H2");
  });
});

describe("globals.css: news-prose (BL-054 / BL-062)", () => {
  const css = readFileSync("src/app/(frontend)/globals.css", "utf8").replaceAll("\r\n", "\n");

  it("h2 cấp gốc đánh số tròn bằng CSS counter, số trang trí có alt rỗng", () => {
    expect(css).toMatch(/\.news-prose\s*\{\s*counter-reset:\s*news-h2;/);
    expect(css).toMatch(/\.news-prose > h2\s*\{[^}]*counter-increment:\s*news-h2;/);
    expect(css).toContain('content: counter(news-h2, decimal-leading-zero) / "";');
  });

  it("đoạn mở đầu = p:first-child cỡ lead, KHÔNG khung (D3); trích dẫn có dấu ngoặc trang trí; ul dấu tích vàng nhạt, ol không bị đụng", () => {
    const lead = css.match(/\.news-prose > p:first-child\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(lead).toContain("font-size: var(--text-lead)");
    expect(lead).toContain("color: var(--color-text-secondary)");
    expect(lead).not.toMatch(/background|border|padding|margin-inline-start/);
    expect(css).toContain(String.raw`content: "\201C" / "";`);
    // Chỉ `ul` danh sách của Lexical (`list-disc`): khối "Số liệu nổi bật" cũng là `ul` cấp gốc, không được có dấu tích.
    expect(css).toMatch(/\.news-prose > ul\.list-disc\s*\{[^}]*list-style:\s*none;/);
    const tick = css.match(/\.news-prose > ul\.list-disc > li::before\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(tick).toContain("background-color: var(--color-primary-soft)");
    expect(css).not.toMatch(/\.news-prose > ul[\s>{:,]/);
    expect(css).not.toMatch(/\.news-prose > ol\s*\{/);
  });

  it("h2 cỡ --text-h3; ≥ md mọi khối sau h2 thụt cùng rãnh số 3.25rem (kể cả ul vốn bị reset margin); không thụt toàn bộ nội dung (D5)", () => {
    expect(css).toMatch(/\.news-prose > h2\s*\{[^}]*font-size:\s*var\(--text-h3\)/);
    const media = css.slice(css.indexOf("@media (min-width: 48rem) {\n  .news-prose > h2"));
    expect(media).toMatch(/\.news-prose > h2 ~ :not\(h2\),\s*\.news-prose > h2 ~ ul\.list-disc\s*\{\s*margin-inline-start:\s*3\.25rem/);
    // h2 sau h2 đầu KHÔNG bị thụt thêm: số + chữ tiêu đề cùng rãnh ở mọi mục.
    expect(media).not.toMatch(/h2 ~ \*/);
    expect(media).toMatch(/\.news-prose > h2\s*\{\s*padding-inline-start:\s*3\.25rem/);
    expect(css).not.toMatch(/\.news-prose\s*\{[^}]*padding-inline-start/);
  });

  it("ảnh chèn: bo góc; chú thích nghiêng canh giữa", () => {
    expect(css).toMatch(/\.news-prose > figure img\s*\{[^}]*border-radius:\s*var\(--radius-xl\)/);
    expect(css).toMatch(/\.news-prose > figure > figcaption\s*\{[^}]*text-align:\s*center;[^}]*font-style:\s*italic/);
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

describe("NewsArticleHero", () => {
  const props = { title: "Bài", excerpt: "Sapo", category: null, publishedAt: "2026-10-18T03:00:00.000Z", readMinutes: 6, locale: "vi" as const, shareUrl: undefined, breadcrumb: <nav aria-label="crumb" /> };

  it("có ảnh bìa: ảnh nền trang trí + scrim; một h1; tác giả thương hiệu, không tên người", () => {
    const { container } = renderWithIntl(<NewsArticleHero {...props} cover={fakeMedia("c")} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelectorAll('[class*="banner-scrim"]').length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container).toHaveTextContent("Bài viết bởi TAMI REAL ESTATE");
    expect(container).toHaveTextContent("Ngày đăng: 18/10/2026");
    expect(container).toHaveTextContent("6 phút đọc");
  });

  it("không ảnh bìa: nền tối, không scrim; không chip khi không có danh mục", () => {
    const { container } = renderWithIntl(<NewsArticleHero {...props} cover={null} />);
    expect(container.querySelector('[class*="banner-scrim"]')).toBeNull();
    expect(container.querySelector("section")?.className).toContain("bg-dark-deep");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("không ngày đăng: không dòng 'Ngày đăng'", () => {
    const { container } = renderWithIntl(<NewsArticleHero {...props} publishedAt={null} cover={null} />);
    expect(container).not.toHaveTextContent("Ngày đăng");
  });
});

describe("NewsArticleContactNote (BL-062 D7)", () => {
  it("chữ không có thương hiệu: không link; chữ rỗng → câu mặc định", () => {
    const { unmount } = renderWithIntl(<NewsArticleContactNote text="Gọi hotline nhé" contactHref="/lien-he#lead-form" />);
    expect(screen.getByRole("note")).toHaveTextContent("Gọi hotline nhé");
    expect(screen.queryByRole("link")).toBeNull();
    unmount();
    renderWithIntl(<NewsArticleContactNote text={undefined} contactHref="/lien-he#lead-form" />);
    expect(screen.getByRole("note")).toHaveTextContent("quý khách vui lòng liên hệ TAMI REAL ESTATE");
    expect(screen.getByRole("link", { name: "TAMI REAL ESTATE" })).toHaveAttribute("href", "/lien-he#lead-form");
  });

  it("chữ admin chứa HTML: hiện nguyên văn như văn bản, không dựng phần tử", () => {
    const { container } = renderWithIntl(<NewsArticleContactNote text={"<b>Đậm</b> <script>alert(1)</script>"} contactHref="/lien-he#lead-form" />);
    expect(container.querySelector("b, script")).toBeNull();
    expect(container).toHaveTextContent("<b>Đậm</b> <script>alert(1)</script>");
  });
});

describe("NewsArticleTags", () => {
  it("rỗng → không render", () => {
    const { container } = renderWithIntl(<NewsArticleTags tags={[]} listPath="/tin-tuc" />);
    expect(container.innerHTML).toBe("");
  });

  it("chip là pill KHÔNG có '#', link ?tag= mã hoá; không vạch trên", () => {
    const { container } = renderWithIntl(<NewsArticleTags tags={["Bắc Ninh"]} listPath="/tin-tuc" />);
    const link = screen.getByRole("link", { name: "Bắc Ninh" });
    expect(link.textContent).toBe("Bắc Ninh");
    expect(link).toHaveAttribute("href", `/tin-tuc?${new URLSearchParams({ tag: "Bắc Ninh" }).toString()}`);
    expect(link.className).toContain("rounded-full");
    expect(container.firstElementChild?.className).not.toContain("border-t");
  });
});
