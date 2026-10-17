import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { getPageItems, Pagination } from "./Pagination";

const buildHref = (page: number) => (page === 1 ? "/du-an" : `/du-an?page=${page}`);

describe("getPageItems", () => {
  it("đầu, cuối, hiện tại ±1 và dấu … cho khoảng cách > 1", () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(getPageItems(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(getPageItems(12, 12)).toEqual([1, "gap", 11, 12]);
  });

  it("khoảng trống đúng 1 trang thì hiện số trang thay vì …", () => {
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("Pagination", () => {
  it("số trang là link thật tới đúng ?page=n; trang hiện tại aria-current và không là link", () => {
    renderWithIntl(<Pagination page={6} totalPages={12} buildHref={buildHref} />);
    const nav = screen.getByRole("navigation", { name: "Phân trang" });
    expect(within(nav).getByRole("link", { name: "Trang 5" })).toHaveAttribute("href", "/du-an?page=5");
    expect(within(nav).getByRole("link", { name: "Trang 7" })).toHaveAttribute("href", "/du-an?page=7");
    expect(within(nav).getByRole("link", { name: "Trang 1" })).toHaveAttribute("href", "/du-an");
    expect(within(nav).getByRole("link", { name: "Trang 12" })).toHaveAttribute("href", "/du-an?page=12");
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).toHaveTextContent("6");
    expect(current?.tagName).toBe("SPAN");
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("Trước/Sau là link rel prev/next; mọi link >= 44px; mobile có 'Trang 6/12'", () => {
    renderWithIntl(<Pagination page={6} totalPages={12} buildHref={buildHref} />);
    const previous = screen.getByRole("link", { name: /Trước/ });
    const next = screen.getByRole("link", { name: /Sau/ });
    expect(previous).toHaveAttribute("href", "/du-an?page=5");
    expect(previous).toHaveAttribute("rel", "prev");
    expect(next).toHaveAttribute("href", "/du-an?page=7");
    expect(next).toHaveAttribute("rel", "next");
    expect(screen.getByText("Trang 6/12")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link")) expect(link).toHaveClass("min-h-11", "min-w-11");
  });

  it("trang đầu: Trước không là link; trang cuối: Sau không là link", () => {
    const first = renderWithIntl(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
    expect(screen.queryByRole("link", { name: /Trước/ })).toBeNull();
    expect(screen.getByText("Trước").closest("[aria-disabled]")).not.toBeNull();
    first.unmount();
    renderWithIntl(<Pagination page={3} totalPages={3} buildHref={buildHref} />);
    expect(screen.queryByRole("link", { name: /Sau/ })).toBeNull();
  });

  it("một trang thì không render; EN dùng nhãn tiếng Anh", () => {
    const one = renderWithIntl(<Pagination page={1} totalPages={1} buildHref={buildHref} />);
    expect(one.container).toBeEmptyDOMElement();
    one.unmount();
    renderWithIntl(<Pagination page={2} totalPages={4} buildHref={buildHref} />, "en");
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByText("Page 2/4")).toBeInTheDocument();
  });
});
