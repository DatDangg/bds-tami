import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { CategoryListTemplate } from "./CategoryListTemplate";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example"));
afterEach(() => vi.unstubAllEnvs());

const chips = [
  { label: "Tất cả", href: "/tin-tuc" },
  { label: "Thị trường", href: "/tin-tuc/danh-muc/thi-truong", current: true },
  { label: "Đời sống", href: "/tin-tuc/danh-muc/doi-song" },
];

const baseProps = {
  title: "Thị trường",
  breadcrumb: [
    { label: "Tin tức", href: "/tin-tuc" },
    { label: "Thị trường", href: "/tin-tuc/danh-muc/thi-truong" },
  ],
  parentListHref: "/tin-tuc",
  pagination: {
    page: 2,
    totalPages: 5,
    buildHref: (page: number) => (page === 1 ? "/tin-tuc/danh-muc/thi-truong" : `/tin-tuc/danh-muc/thi-truong?page=${page}`),
  },
};

/** Hàng chip: `ul` duy nhất nằm ngoài breadcrumb (`ol`) và ngoài phân trang. */
function chipLinks(container: HTMLElement) {
  const list = [...container.querySelectorAll("ul")].find((node) => node.querySelector("li > a[href^='/tin-tuc']") && !node.closest("nav"));
  return list ? [...list.querySelectorAll("a")] : [];
}

describe("CategoryListTemplate: banner gọn + băng tìm kiếm (BL-020 P3-T02)", () => {
  const bannerImage = { url: "/api/media/file/b.jpg", alt: "", width: 1600 };

  it("mặc định (Tin tức) giữ banner cũ, không có băng đè", () => {
    const { container } = renderWithIntl(
      <CategoryListTemplate {...baseProps} bannerImage={bannerImage} isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(container.querySelector("section.h-60")).toBeNull();
    expect(container.querySelector(".-mt-12")).toBeNull();
  });

  it("compactBanner + searchBar: banner 240px, băng đè mép dưới và đứng trước breadcrumb", () => {
    const { container } = renderWithIntl(
      <CategoryListTemplate {...baseProps} bannerImage={bannerImage} compactBanner searchBar={<form aria-label="băng" />} isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(container.querySelector("section.h-60")).not.toBeNull();
    const bar = screen.getByRole("form", { name: "băng" });
    expect(bar.parentElement?.className).toContain("-mt-12");
    expect(bar.compareDocumentPosition(screen.getByRole("navigation", { name: /Breadcrumb/ })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("compactBanner không có searchBar (Tuyển dụng): chỉ banner gọn, không chừa khối băng", () => {
    const { container } = renderWithIntl(
      <CategoryListTemplate {...baseProps} bannerImage={bannerImage} compactBanner isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(container.querySelector("section.h-60")).not.toBeNull();
    expect(container.querySelector(".-mt-12")).toBeNull();
  });
});

describe("CategoryListTemplate (spec-validation L5 G18)", () => {
  it("chip danh mục là link thật, đúng một chip aria-current=page = mục đang chọn", () => {
    const { container } = renderWithIntl(
      <CategoryListTemplate {...baseProps} chips={chips} isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    const links = chipLinks(container);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(chips.map((chip) => chip.href));
    const current = links.filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Thị trường");
    expect(links.find((link) => link.textContent === "Tất cả")).not.toHaveAttribute("aria-current");
  });

  it("không có chip (hoặc mảng rỗng) thì không render hàng chip", () => {
    for (const props of [{}, { chips: [] }]) {
      const { container, unmount } = renderWithIntl(
        <CategoryListTemplate {...baseProps} {...props} isEmpty={false}>
          <p>lưới</p>
        </CategoryListTemplate>,
      );
      expect(chipLinks(container)).toHaveLength(0);
      unmount();
    }
  });

  it("trống: EmptyState có link về parentListHref, ẩn lưới và ẩn phân trang", () => {
    renderWithIntl(
      <CategoryListTemplate {...baseProps} chips={chips} isEmpty>
        <p>lưới không được hiện</p>
      </CategoryListTemplate>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có bài viết trong mục này.");
    expect(screen.getByRole("link", { name: "Về danh sách" })).toHaveAttribute("href", "/tin-tuc");
    expect(screen.queryByText("lưới không được hiện")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
  });

  it("có bài: hiện lưới + phân trang (trang hiện tại aria-current), không có EmptyState", () => {
    renderWithIntl(
      <CategoryListTemplate {...baseProps} isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(screen.getByText("lưới")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Phân trang" });
    expect(within(nav).getByText("2", { selector: '[aria-current="page"]' })).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("h1 là tiêu đề danh mục; /en không có chữ tiếng Việt do template sinh", () => {
    renderWithIntl(
      <CategoryListTemplate
        {...baseProps}
        title="Market"
        breadcrumb={[{ label: "News", href: "/en/news" }]}
        chips={[{ label: "All", href: "/en/news", current: true }]}
        isEmpty
        parentListHref="/en/news"
      >
        <p>x</p>
      </CategoryListTemplate>,
      "en",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Market" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("There are no articles in this section yet.");
    expect(screen.getByRole("link", { name: "Back to the list" })).toHaveAttribute("href", "/en/news");
    expect(document.body.textContent).not.toMatch(/[ạảãàáâậầấẩẫăắằặẳẵéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i);
  });

  it("toolbar luôn hiện (kể cả khi trống); chipsLabel bọc chip trong nav có nhãn; emptyState thay trạng thái trống mặc định", () => {
    renderWithIntl(
      <CategoryListTemplate
        {...baseProps}
        chips={chips}
        chipsLabel="Loại hình"
        toolbar={<form aria-label="Bộ lọc">lọc</form>}
        emptyState={<p role="status">Trạng thái riêng</p>}
        isEmpty
      >
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(within(screen.getByRole("navigation", { name: "Loại hình" })).getAllByRole("link")).toHaveLength(chips.length);
    expect(screen.getByRole("form", { name: "Bộ lọc" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Trạng thái riêng");
    expect(screen.queryByRole("link", { name: "Về danh sách" })).toBeNull();
  });

  it("scrollChips: hàng chip cuộn ngang < sm (không xuống dòng); mặc định vẫn flex-wrap", () => {
    const { unmount } = renderWithIntl(
      <CategoryListTemplate {...baseProps} chips={chips} scrollChips isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(screen.getByRole("link", { name: chips[0]!.label }).closest("ul")).toHaveClass("overflow-x-auto", "snap-x");
    unmount();
    renderWithIntl(
      <CategoryListTemplate {...baseProps} chips={chips} isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(screen.getByRole("link", { name: chips[0]!.label }).closest("ul")).toHaveClass("flex-wrap");
    expect(screen.getByRole("link", { name: chips[0]!.label }).closest("ul")).not.toHaveClass("overflow-x-auto");
  });

  it("không truyền toolbar/chipsLabel: giữ nguyên markup cũ (không có nav chip)", () => {
    renderWithIntl(
      <CategoryListTemplate {...baseProps} chips={chips} isEmpty={false}>
        <p>lưới</p>
      </CategoryListTemplate>,
    );
    expect(screen.queryByRole("navigation", { name: "Loại hình" })).toBeNull();
    expect(screen.queryByRole("form")).toBeNull();
  });
});
