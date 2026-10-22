import type { ReactElement } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { NewsCardData } from "@/lib/news/news-view";
import { NewsCard } from "./NewsCard";
import { NewsFeaturedBlock } from "./NewsFeaturedBlock";
import { NewsListBody } from "./NewsListBody";
import { NewsMostRead } from "./NewsMostRead";
import { NewsTopics } from "./NewsTopics";
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

describe("NewsCard grid (thẻ lưới /tin-tuc BL-054)", () => {
  it("MỘT link thẻ trắng: badge danh mục + ngày, tiêu đề 2 dòng, tóm tắt 3 dòng, 'N phút đọc' + mũi tên trang trí", () => {
    const { container } = renderWithIntl(<NewsCard data={card("1", { readMinutes: 7 })} variant="grid" headingLevel="h3" />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("bg-surface", "border", "rounded-xl");
    expect(within(link).getByRole("heading", { level: 3, name: "Bài 1" })).toHaveClass("line-clamp-2");
    expect(screen.getByText("Tóm tắt 1")).toHaveClass("line-clamp-3");
    expect(screen.getByText("Thị trường")).toHaveClass("uppercase", "bg-primary-soft", "text-badge-foreground");
    expect(link).toHaveTextContent("7 phút đọc");
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-03-05T03:00:00.000Z");
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(container.querySelector("button")).toBeNull();
  });

  it("thiếu danh mục / ngày / số phút: không render phần đó; /en 'N min read'", () => {
    const { container, unmount } = renderWithIntl(<NewsCard data={card("1", { categoryName: null, dateLabel: null, publishedAt: null })} variant="grid" headingLevel="h2" />);
    expect(container.querySelector("time")).toBeNull();
    expect(screen.queryByText("Thị trường")).toBeNull();
    expect(screen.getByRole("link")).not.toHaveTextContent(/phút đọc/);
    unmount();
    renderWithIntl(<NewsCard data={card("1", { readMinutes: 3 })} variant="grid" headingLevel="h2" />, "en");
    expect(screen.getByRole("link")).toHaveTextContent("3 min read");
  });
});

describe("NewsFeaturedBlock", () => {
  it("bài lớn (ảnh priority, nhãn TAMI HOMES · ngày · phút đọc) + 3 bài nhỏ; mỗi bài MỘT link, tiêu đề h2", () => {
    const { container } = renderWithIntl(<NewsFeaturedBlock items={[card("1", { readMinutes: 5 }), card("2"), card("3"), card("4")]} />);
    const block = screen.getByRole("region", { name: "Bài viết nổi bật" });
    expect(within(block).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Bài 1", "Bài 2", "Bài 3", "Bài 4"]);
    const links = within(block).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/tin-tuc/bai-1", "/tin-tuc/bai-2", "/tin-tuc/bai-3", "/tin-tuc/bai-4"]);
    expect(links[0]).toHaveTextContent("TAMI HOMES");
    expect(links[0]).toHaveTextContent("5 phút đọc");
    expect(links[0]?.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelector("img[fetchpriority=high]")).not.toBeNull();
  });

  it("rỗng → không render; chỉ 1 bài → không cột phải", () => {
    const empty = renderWithIntl(<NewsFeaturedBlock items={[]} />);
    expect(empty.container.innerHTML).toBe("");
    empty.unmount();
    const { container } = renderWithIntl(<NewsFeaturedBlock items={[card("1")]} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});

describe("NewsMostRead / NewsTopics", () => {
  const item = (id: string) => ({ id, title: `Đọc ${id}`, href: `/tin-tuc/${id}`, cover: null, publishedAt: "2026-03-05T03:00:00.000Z", dateLabel: "05/03/2026" });

  it("Đọc nhiều: danh sách có thứ tự, số 01–05 chỉ trang trí, mỗi hàng MỘT link; rỗng → ẩn", () => {
    const { container, unmount } = renderWithIntl(<NewsMostRead items={["a", "b", "c"].map(item)} />);
    const section = screen.getByRole("region", { name: "Đọc nhiều" });
    expect(section.querySelector("ol")).not.toBeNull();
    expect(within(section).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/tin-tuc/a", "/tin-tuc/b", "/tin-tuc/c"]);
    expect([...container.querySelectorAll("[aria-hidden=true]")].map((node) => node.textContent)).toEqual(["01", "02", "03"]);
    unmount();
    expect(renderWithIntl(<NewsMostRead items={[]} />).container.innerHTML).toBe("");
  });

  it("Chủ đề: chip #tag là link ?tag= (mã hoá), thẻ đang lọc aria-current; rỗng → ẩn", () => {
    const { unmount } = renderWithIntl(<NewsTopics tags={["Thị trường", "Pháp lý"]} listPath="/tin-tuc" currentTag="Pháp lý" />);
    const section = screen.getByRole("region", { name: "Chủ đề" });
    const links = within(section).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["#Thị trường", `/tin-tuc?tag=${encodeURIComponent("Thị trường").replaceAll("%20", "+")}`],
      ["#Pháp lý", `/tin-tuc?tag=${encodeURIComponent("Pháp lý").replaceAll("%20", "+")}`],
    ]);
    expect(links[1]).toHaveAttribute("aria-current", "true");
    expect(links[0]).not.toHaveAttribute("aria-current");
    unmount();
    expect(renderWithIntl(<NewsTopics tags={[]} listPath="/tin-tuc" />).container.innerHTML).toBe("");
  });
});

describe("NewsListBody", () => {
  it("không lọc: khối nổi bật trước, h2 'Bài viết mới nhất' + thẻ h3 lưới 3 cột, phân trang + cột phải", () => {
    const { container } = renderWithIntl(
      <NewsListBody featured={[card("1")]} items={[card("2"), card("3")]} pagination={<nav aria-label="Phân trang" />} sidebar={<p>Cột phải</p>} />,
    );
    const featured = container.querySelector("[data-news-featured]") as HTMLElement;
    const latest = screen.getByRole("region", { name: "Bài viết mới nhất" });
    expect(featured.compareDocumentPosition(latest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(latest).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Bài 2", "Bài 3"]);
    expect(latest.querySelector("ul")).toHaveAttribute("data-grid-max-cols", "3");
    expect(within(latest).getByRole("navigation", { name: "Phân trang" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Đọc thêm" })).toHaveTextContent("Cột phải");
  });

  it("lọc: 'N bài viết phù hợp' thay tiêu đề, thẻ h2; trạng thái trống thay lưới + phân trang", () => {
    const { unmount } = renderWithIntl(<NewsListBody featured={[]} items={[card("2")]} resultLabel="1 bài viết" />);
    expect(screen.queryByRole("heading", { name: "Bài viết mới nhất" })).toBeNull();
    expect(screen.getByText("1 bài viết")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Bài 2" })).toBeInTheDocument();
    unmount();
    const { container } = renderWithIntl(<NewsListBody featured={[]} items={[]} resultLabel="0 bài viết" emptyState={<p>Trống</p>} pagination={<nav aria-label="Phân trang" />} />);
    expect(screen.getByText("Trống")).toBeInTheDocument();
    expect(container.querySelector("ul")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
  });

  it("chỉ có bài nổi bật (≤ 4 bài): không lưới rỗng, không tiêu đề 'Bài viết mới nhất'", () => {
    const { container } = renderWithIntl(<NewsListBody featured={[card("1")]} items={[]} />);
    expect(container.querySelector("ul[data-grid-max-cols]")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Bài viết mới nhất" })).toBeNull();
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

describe("ShareButtons variant=icons (hàng tác giả chi tiết tin tức, BL-054)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("nhãn 'Chia sẻ:' + nút tròn chỉ icon có tên truy cập; không có Web Share → không có nút 'thêm'", () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });
    renderWithIntl(<ShareButtons variant="icons" url="https://tami.example/tin-tuc/a" title="A" />);
    const group = screen.getByRole("group", { name: "Chia sẻ bài viết" });
    expect(group).toHaveTextContent("Chia sẻ:");
    const facebook = within(group).getByRole("link", { name: "Chia sẻ lên Facebook" });
    expect(facebook.className).toContain("rounded-full");
    expect(facebook).not.toHaveTextContent("Facebook");
    expect(within(group).getByRole("link", { name: "Chia sẻ qua Zalo" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Sao chép liên kết" })).not.toHaveTextContent("Sao chép");
    expect(within(group).queryByRole("button", { name: "Chia sẻ qua ứng dụng khác" })).toBeNull();
  });

  it("có navigator.share: nút 'thêm' gọi Web Share với tiêu đề + URL; huỷ (AbortError) không ném lỗi", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancel", "AbortError"));
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() }, share });
    renderWithIntl(<ShareButtons variant="icons" url="https://tami.example/tin-tuc/a" title="Bài A" />);
    fireEvent.click(await screen.findByRole("button", { name: "Chia sẻ qua ứng dụng khác" }));
    expect(share).toHaveBeenCalledWith({ title: "Bài A", url: "https://tami.example/tin-tuc/a" });
  });

  it("sao chép: vùng status (chỉ cho trình đọc màn hình) báo đã chép", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderWithIntl(<ShareButtons variant="icons" url="https://tami.example/tin-tuc/a" title="A" />);
    fireEvent.click(screen.getByRole("button", { name: "Sao chép liên kết" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Đã sao chép liên kết"));
    expect(screen.getByRole("status").className).toContain("sr-only");
  });
});
