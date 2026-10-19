import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { NewsBlockView } from "@/lib/home/home-view-listings";
import { HomeNews } from "./HomeNews";

const post = (n: number) => ({
  id: `n${n}`,
  title: `Bài ${n}`,
  href: `/tin-tuc/bai-${n}`,
  excerpt: `Tóm tắt ${n}`,
  publishedAt: "2026-10-01T00:00:00.000Z",
  dateLabel: "01/10/2026",
  categoryName: "Thị trường",
  cover: fakeMedia(`n${n}`),
});
const block = (overrides: Partial<NewsBlockView> = {}): NewsBlockView => ({ kind: "news", title: "Tin tức", intro: "Cập nhật thị trường", posts: [post(1), post(2), post(3)], href: "/tin-tuc", ...overrides });

describe("HomeNews", () => {
  it("khối tối có tên là tiêu đề h2; intro, 3 thẻ (h3 + link tới bài), 'Xem tất cả' → /tin-tuc", () => {
    renderWithIntl(<HomeNews block={block()} />);
    const section = screen.getByRole("region", { name: "Tin tức" });
    expect(section).toHaveClass("theme-dark-block");
    expect(within(section).getByRole("heading", { level: 2, name: "Tin tức" })).toBeInTheDocument();
    expect(within(section).getByText("Cập nhật thị trường")).toBeInTheDocument();
    expect(within(section).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Bài 1", "Bài 2", "Bài 3"]);
    expect(within(section).getByRole("link", { name: /Bài 2/ })).toHaveAttribute("href", "/tin-tuc/bai-2");
    expect(within(section).getByRole("link", { name: "Xem tất cả" })).toHaveAttribute("href", "/tin-tuc");
  });

  it("title CMS trống → chữ mặc định theo ngôn ngữ; có viền dưới tách khỏi footer tối", () => {
    renderWithIntl(<HomeNews block={block({ title: "" })} />);
    expect(screen.getByRole("heading", { level: 2, name: "Tin tức" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tin tức" })).toHaveClass("border-dark-border");
  });

  it("không có intro thì không dựng đoạn rỗng", () => {
    renderWithIntl(<HomeNews block={block({ intro: null })} />);
    expect(screen.queryByText("Cập nhật thị trường")).toBeNull();
  });

  it("EN: nhãn và link theo ngôn ngữ", () => {
    renderWithIntl(<HomeNews block={block({ href: "/en/news", posts: [{ ...post(1), href: "/en/news/bai-1" }] })} />, "en");
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/en/news");
  });
});
