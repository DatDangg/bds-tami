import type { ReactElement } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { NewsCardData } from "@/lib/news/news-view";
import { NewsCard } from "./NewsCard";
import { NewsListBody } from "./NewsListBody";
import { ShareButtons } from "./ShareButtons";

const card = (id: string, overrides: Partial<NewsCardData> = {}): NewsCardData => ({
  id,
  title: `Bài ${id}`,
  href: `/tin-tuc/bai-${id}`,
  excerpt: `Tóm tắt ${id}`,
  publishedAt: "2026-03-05T03:00:00.000Z",
  dateLabel: "05/03/2026",
  categoryName: "Thị trường",
  cover: fakeMedia(`anh-${id}`),
  ...overrides,
});

afterEach(() => vi.unstubAllGlobals());

describe("NewsCard", () => {
  it("cả thẻ là MỘT link (không lồng link), tiêu đề đúng cấp heading, ngày trong <time>", () => {
    const { container } = renderWithIntl(<NewsCard data={card("1")} headingLevel="h2" />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/tin-tuc/bai-1");
    expect(within(link).getByRole("heading", { level: 2, name: "Bài 1" })).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-03-05T03:00:00.000Z");
    expect(link).toHaveTextContent("Thị trường");
  });

  it("thẻ lưới (card): khung như thẻ Dự án — tên 2 dòng, ngày + mũi tên tròn, không tóm tắt; feature/row/onDark giữ phẳng", () => {
    const { container, unmount } = renderWithIntl(<NewsCard data={card("1")} headingLevel="h2" />);
    expect(screen.getByRole("link").className).toContain("rounded-xl border border-border bg-surface");
    expect(screen.getByRole("heading", { level: 2 }).className).toContain("min-h-[2lh]");
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(screen.queryByText("Tóm tắt 1")).toBeNull();
    unmount();
    const flat = renderWithIntl(<NewsCard data={card("1")} headingLevel="h3" onDark />);
    expect(flat.container.querySelector("[aria-hidden=true].rounded-full")).toBeNull();
    expect(screen.getByText("Tóm tắt 1")).toBeInTheDocument();
  });

  it("hover tiêu đề: đổi sang màu thương hiệu, không gạch chân", () => {
    renderWithIntl(<NewsCard data={card("1")} headingLevel="h2" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("group-hover:text-accent-text", "group-focus-visible:text-accent-text");
    expect(heading).not.toHaveClass("group-hover:underline");
  });

  it("ảnh là trang trí (alt rỗng, tên link đã có tiêu đề); thiếu ảnh vẫn giữ khung tỉ lệ", () => {
    const { container, rerender } = renderWithIntl(<NewsCard data={card("1")} headingLevel="h3" />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    rerender(<NewsCard data={card("1", { cover: null })} headingLevel="h3" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[style*="aspect-ratio"]')).not.toBeNull();
  });

  it("biến thể row không có excerpt; thẻ không ngày/danh mục không render phần đó", () => {
    const { container } = renderWithIntl(<NewsCard data={card("1", { dateLabel: null, publishedAt: null, categoryName: null })} variant="row" headingLevel="h2" />);
    expect(screen.queryByText("Tóm tắt 1")).toBeNull();
    expect(container.querySelector("time")).toBeNull();
    expect(screen.queryByText("Thị trường")).toBeNull();
  });
});

describe("NewsCard bề mặt thẻ", () => {
  it("thẻ lưới là thẻ trắng viền + hover:shadow-md; onDark và row giữ phẳng", () => {
    const link = (ui: ReactElement) => renderWithIntl(ui).container.querySelector("a");
    expect(link(<NewsCard data={card("1")} headingLevel="h2" />)).toHaveClass("bg-surface", "border", "hover:shadow-md", "overflow-hidden");
    const flats = [
      link(<NewsCard data={card("2")} headingLevel="h2" onDark />),
      link(<NewsCard data={card("3")} headingLevel="h2" variant="row" />),
    ];
    for (const flat of flats) {
      expect(flat).not.toHaveClass("bg-surface");
      expect(flat).not.toHaveClass("border");
    }
  });
});

describe("NewsCard feature (bài nổi bật ngang)", () => {
  it("MỘT link, ảnh trái + chữ phải ≥ lg, danh mục + tiêu đề + tóm tắt + ngày + nút 'Đọc bài' (không link lồng)", () => {
    const { container } = renderWithIntl(<NewsCard data={card("1")} variant="feature" headingLevel="h2" priority />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("lg:grid-cols-[1.3fr_1fr]", "rounded-xl", "bg-surface");
    expect(within(link).getByRole("heading", { level: 2, name: "Bài 1" })).toBeInTheDocument();
    expect(link).toHaveTextContent("Thị trường");
    expect(link).toHaveTextContent("Tóm tắt 1");
    expect(link).toHaveTextContent("Đọc bài");
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-03-05T03:00:00.000Z");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("đầu khối canh trái: không text-center / mx-auto ở khối chữ", () => {
    const { container } = renderWithIntl(<NewsCard data={card("1")} variant="feature" headingLevel="h2" />);
    expect(container.innerHTML).not.toContain("text-center");
    expect(container.querySelector("a div:last-of-type")?.className).not.toContain("mx-auto");
  });

  it("/en: nút 'Read article'", () => {
    renderWithIntl(<NewsCard data={card("1")} variant="feature" headingLevel="h2" />, "en");
    expect(screen.getByRole("link")).toHaveTextContent("Read article");
  });
});

describe("NewsListBody", () => {
  it("lưới 1/2/3 cột (3 ≥ lg): mọi tiêu đề thẻ là h2, vùng mang tên trang", () => {
    const { container } = renderWithIntl(<NewsListBody items={[card("5"), card("6")]} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Bài 5", "Bài 6"]);
    expect(screen.getByRole("region", { name: "Tin tức" })).toBeInTheDocument();
    expect(container.querySelector("ul")).toHaveAttribute("data-grid-max-cols", "3");
    expect(container.querySelector("[data-news-featured]")).toBeNull();
  });

  it("có bài nổi bật: thẻ ngang đứng trước lưới; không hàng danh mục / 'Tin khác'", () => {
    const { container } = renderWithIntl(<NewsListBody featured={card("1")} items={[card("2"), card("3")]} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Bài 1", "Bài 2", "Bài 3"]);
    const featured = container.querySelector("[data-news-featured]") as HTMLElement;
    expect(featured.querySelector("a")).toHaveAttribute("href", "/tin-tuc/bai-1");
    expect(featured.compareDocumentPosition(container.querySelector("ul") as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelector("[data-news-row], [data-news-more]")).toBeNull();
    expect(screen.queryByText("Tin khác")).toBeNull();
  });

  it("chỉ có bài nổi bật: không lưới rỗng", () => {
    const { container } = renderWithIntl(<NewsListBody featured={card("1")} items={[]} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});

describe("ShareButtons", () => {
  it("có URL: link Facebook + Zalo mở tab mới với rel noopener, URL được mã hoá", () => {
    renderWithIntl(<ShareButtons url="https://tami.example/tin-tuc/a?x=1&y=2" title="A" />);
    const facebook = screen.getByRole("link", { name: "Chia sẻ lên Facebook" });
    expect(facebook).toHaveAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://tami.example/tin-tuc/a?x=1&y=2")}`);
    expect(facebook).toHaveAttribute("target", "_blank");
    expect(facebook.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: "Chia sẻ qua Zalo" }).getAttribute("href")).toContain(encodeURIComponent("https://tami.example/tin-tuc/a?x=1&y=2"));
  });

  it("không có URL gốc: chỉ còn nút sao chép (không link chia sẻ tới URL sai)", () => {
    renderWithIntl(<ShareButtons title="A" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "Sao chép liên kết" })).toBeInTheDocument();
  });

  it("sao chép: ghi URL vào clipboard và báo qua vùng status; lỗi thì báo lỗi", async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    renderWithIntl(<ShareButtons url="https://tami.example/tin-tuc/a" title="A" />, "en");
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Link copied"));
    expect(writeText).toHaveBeenCalledWith("https://tami.example/tin-tuc/a");
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Could not copy"));
  });
});
