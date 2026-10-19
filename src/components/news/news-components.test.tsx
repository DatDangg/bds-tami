import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { NewsCardData } from "@/lib/news/news-view";
import { NewsCard } from "./NewsCard";
import { NewsHomeBody } from "./NewsHomeBody";
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

describe("NewsListBody", () => {
  it("lưới 1/2/3/4 cột (4 ≥ xl): mọi tiêu đề thẻ là h2, vùng mang tên trang", () => {
    const { container } = renderWithIntl(<NewsListBody items={[card("5"), card("6")]} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Bài 5", "Bài 6"]);
    expect(screen.getByRole("region", { name: "Tin tức" })).toBeInTheDocument();
    expect(container.querySelector("ul")).toHaveAttribute("data-grid-max-cols", "4");
  });
});

describe("NewsHomeBody", () => {
  const home = {
    lead: card("1"),
    list: [card("2"), card("3"), card("4"), card("5")],
    rows: [
      { id: "c1", name: "Thị trường", href: "/tin-tuc/danh-muc/thi-truong", items: [card("6"), card("7")] },
      { id: "c2", name: "Đời sống", href: "/tin-tuc/danh-muc/doi-song", items: [card("8")] },
    ],
  };

  it("Tin nổi bật: 1 bài lớn + list 4 bài; mỗi danh mục một hàng có 'Xem thêm' trỏ trang danh mục; h2 khối, h3 thẻ", () => {
    renderWithIntl(<NewsHomeBody home={home} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Tin nổi bật", "Thị trường", "Đời sống"]);
    const featured = screen.getByRole("region", { name: "Tin nổi bật" });
    expect(within(featured).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Bài 1", "Bài 2", "Bài 3", "Bài 4", "Bài 5"]);
    const row = screen.getByRole("region", { name: "Thị trường" });
    expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(within(row).getByRole("link", { name: "Xem thêm tin Thị trường" })).toHaveAttribute("href", "/tin-tuc/danh-muc/thi-truong");
    expect(within(row).getByText("Xem thêm")).toBeInTheDocument();
  });

  it("Tin khác: lưới h3 sau các hàng danh mục khi có moreItems", () => {
    const { container } = renderWithIntl(<NewsHomeBody home={home} moreItems={[card("9"), card("10")]} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Tin nổi bật", "Thị trường", "Đời sống", "Tin khác"]);
    const more = screen.getByRole("region", { name: "Tin khác" });
    expect(within(more).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Bài 9", "Bài 10"]);
    expect(container.querySelector("[data-news-more] ul")).toHaveAttribute("data-grid-max-cols", "4");
  });

  it("không có bài nổi bật/danh mục: không render khối rỗng", () => {
    const { container } = renderWithIntl(<NewsHomeBody home={{ lead: null, list: [], rows: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("chỉ 1 bài nổi bật: không có cột list", () => {
    const { container } = renderWithIntl(<NewsHomeBody home={{ lead: card("1"), list: [], rows: [] }} />);
    expect(container.querySelectorAll("article")).toHaveLength(1);
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
