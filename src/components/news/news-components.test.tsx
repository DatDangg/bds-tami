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
  it("khối nổi bật: 1 bài lớn + các bài hàng; lưới bên dưới; mọi tiêu đề là h2", () => {
    renderWithIntl(<NewsListBody featured={[card("1"), card("2"), card("3"), card("4")]} items={[card("5"), card("6")]} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Bài 1", "Bài 2", "Bài 3", "Bài 4", "Bài 5", "Bài 6"]);
    expect(screen.getByRole("region", { name: "Tin nổi bật" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tin khác" })).toBeInTheDocument();
  });

  it("không có khối nổi bật (trang 2, trang danh mục): chỉ lưới, vùng mang tên trang", () => {
    renderWithIntl(<NewsListBody featured={[]} items={[card("5")]} />);
    expect(screen.queryByRole("region", { name: "Tin nổi bật" })).toBeNull();
    expect(screen.getByRole("region", { name: "Tin tức" })).toBeInTheDocument();
  });

  it("chỉ 1 bài nổi bật (ít tin): không có cột hàng, không lưới", () => {
    const { container } = renderWithIntl(<NewsListBody featured={[card("1")]} items={[]} />);
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
