import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { ListingCategoryTabs } from "./ListingCategoryTabs";

const tabs = [
  { key: "all", href: "/cho-thue", label: "Tất cả" },
  { key: "mat-bang", href: "/cho-thue/danh-muc/mat-bang", label: "Mặt bằng kinh doanh", current: true },
];

/** jsdom không layout: giả lập vùng cuộn 400px nhìn thấy / 1000px nội dung. */
function mockLayout({ clientWidth, scrollWidth }: { clientWidth: number; scrollWidth: number }) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute("data-tabs-scroller") ? clientWidth : 0;
  });
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute("data-tabs-scroller") ? scrollWidth : 0;
  });
}

function scroller() {
  return document.querySelector<HTMLElement>("[data-tabs-scroller]")!;
}

describe("ListingTabsScroller (qua ListingCategoryTabs)", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("vừa khung → không fade, không nút mũi tên", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 400 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(document.querySelector("[data-tabs-fade]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("tràn, ở đầu → chỉ fade + nút 'sau'; cuộn giữa → cả hai; cuộn hết → chỉ 'trước'", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(document.querySelector("[data-tabs-fade='end']")).not.toBeNull();
    expect(document.querySelector("[data-tabs-fade='start']")).toBeNull();
    expect(screen.getByRole("button", { name: "Danh mục sau" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Danh mục trước" })).toBeNull();

    act(() => {
      scroller().scrollLeft = 300;
      fireEvent.scroll(scroller());
    });
    expect(screen.getByRole("button", { name: "Danh mục trước" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Danh mục sau" })).toBeInTheDocument();

    act(() => {
      scroller().scrollLeft = 600;
      fireEvent.scroll(scroller());
    });
    expect(screen.getByRole("button", { name: "Danh mục trước" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Danh mục sau" })).toBeNull();
  });

  it("bấm nút 'sau' cuộn ~80% bề rộng nhìn thấy (smooth; reduced-motion → auto)", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    const scrollBy = vi.fn();
    scroller().scrollBy = scrollBy;
    fireEvent.click(screen.getByRole("button", { name: "Danh mục sau" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 320, behavior: "smooth" });
  });

  it("nút mũi tên chỉ hiện từ md (hidden md:inline-flex) và đủ 44px", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(screen.getByRole("button", { name: "Danh mục sau" })).toHaveClass("hidden", "md:inline-flex", "size-11");
  });

  it("tab aria-current bị khuất → cuộn ngang vào giữa vùng nhìn khi mount", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.hasAttribute("data-tabs-scroller")) return { left: 0, right: 400, width: 400 } as DOMRect;
      if (this.getAttribute("aria-current") === "page") return { left: 700, right: 900, width: 200 } as DOMRect;
      return { left: 0, right: 0, width: 0 } as DOMRect;
    });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(scroller().scrollLeft).toBe(700 - (400 - 200) / 2);
  });
});
