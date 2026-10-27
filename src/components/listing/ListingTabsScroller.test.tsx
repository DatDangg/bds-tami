import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { ListingCategoryTabs } from "./ListingCategoryTabs";

const tabs = [
  { key: "all", href: "/cho-thue", label: "Tất cả" },
  { key: "mat-bang", href: "/cho-thue/danh-muc/mat-bang", label: "Mặt bằng kinh doanh", current: true },
];

/** jsdom không layout: giả lập khung ngoài 500px, vùng cuộn `clientWidth` nhìn thấy / `scrollWidth` nội dung. */
function mockLayout({ clientWidth, scrollWidth, frameWidth = 500 }: { clientWidth: number; scrollWidth: number; frameWidth?: number }) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    if (this.hasAttribute("data-tabs-frame")) return frameWidth;
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
    mockLayout({ clientWidth: 500, scrollWidth: 500 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(document.querySelector("[data-tabs-fade]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("tràn, ở đầu → fade 'sau'; cuộn giữa → cả hai fade; cuộn hết → chỉ fade 'trước'", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(document.querySelector("[data-tabs-fade='end']")).not.toBeNull();
    expect(document.querySelector("[data-tabs-fade='start']")).toBeNull();

    act(() => {
      scroller().scrollLeft = 300;
      fireEvent.scroll(scroller());
    });
    expect(document.querySelector("[data-tabs-fade='start']")).not.toBeNull();
    expect(document.querySelector("[data-tabs-fade='end']")).not.toBeNull();

    act(() => {
      scroller().scrollLeft = 600;
      fireEvent.scroll(scroller());
    });
    expect(document.querySelector("[data-tabs-fade='start']")).not.toBeNull();
    expect(document.querySelector("[data-tabs-fade='end']")).toBeNull();
  });

  it("nút mũi tên nằm trong làn NGOÀI vùng cuộn (không đè tab), fade nằm trong khung của vùng cuộn", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    for (const name of ["Danh mục trước", "Danh mục sau"]) {
      const button = screen.getByRole("button", { name });
      expect(scroller().contains(button)).toBe(false);
      expect(button.closest("[data-tabs-lane]")).not.toBeNull();
    }
    expect(scroller().parentElement).toContainElement(document.querySelector("[data-tabs-fade='end']") as HTMLElement);
  });

  it("nút ở mép vẫn mounted + aria-disabled (không mất focus), không cuộn khi bấm", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    const previous = screen.getByRole("button", { name: "Danh mục trước" });
    const next = screen.getByRole("button", { name: "Danh mục sau" });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(next).not.toHaveAttribute("aria-disabled");

    next.focus();
    act(() => {
      scroller().scrollLeft = 600;
      fireEvent.scroll(scroller());
    });
    expect(screen.getByRole("button", { name: "Danh mục sau" })).toBe(next);
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveFocus();
    expect(screen.getByRole("button", { name: "Danh mục trước" })).not.toHaveAttribute("aria-disabled");

    const scrollBy = vi.fn();
    scroller().scrollBy = scrollBy;
    fireEvent.click(next);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("nội dung chỉ tràn vùng cuộn đã thu hẹp nhưng vừa khung ngoài → không làn (tránh dao động ở bề rộng biên)", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 500, frameWidth: 500 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  describe("đẩy link focus ra ngoài fade", () => {
    function setup(currentBox: { left: number; right: number }, keyboard: boolean) {
      mockLayout({ clientWidth: 400, scrollWidth: 1000 });
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        if (this.hasAttribute("data-tabs-scroller")) return { left: 0, right: 400, width: 400 } as DOMRect;
        if (this.getAttribute("aria-current") === "page") return { ...currentBox, width: currentBox.right - currentBox.left } as DOMRect;
        return { left: 0, right: 0, width: 0 } as DOMRect;
      });
      const realMatches = HTMLElement.prototype.matches;
      vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (this: HTMLElement, selector: string) {
        return selector === ":focus-visible" ? keyboard : realMatches.call(this, selector);
      });
      renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
      scroller().scrollLeft = 100;
      return screen.getByRole("link", { name: /Mặt bằng kinh doanh/ });
    }

    it("bàn phím, link sát mép phải → cuộn để cách mép 32px", () => {
      const link = setup({ left: 380, right: 580 }, true);
      scroller().scrollLeft = 100;
      act(() => link.focus());
      expect(scroller().scrollLeft).toBe(100 + 580 - (400 - 32));
    });

    it("bàn phím, link sát mép trái → cuộn ngược để cách mép 32px", () => {
      const link = setup({ left: 10, right: 150 }, true);
      scroller().scrollLeft = 100;
      act(() => link.focus());
      expect(scroller().scrollLeft).toBe(100 - (32 - 10));
    });

    it("focus bằng chuột (không :focus-visible) → KHÔNG cuộn (click không rơi khỏi link)", () => {
      const link = setup({ left: 380, right: 580 }, false);
      scroller().scrollLeft = 100;
      act(() => link.focus());
      expect(scroller().scrollLeft).toBe(100);
    });

    it("tab rộng hơn vùng nhìn trừ fade → không cuộn (tránh giật)", () => {
      const link = setup({ left: -50, right: 450 }, true);
      scroller().scrollLeft = 100;
      act(() => link.focus());
      expect(scroller().scrollLeft).toBe(100);
    });
  });

  it("vùng cuộn có scroll-padding để link focus bằng bàn phím không nằm dưới fade", () => {
    mockLayout({ clientWidth: 400, scrollWidth: 1000 });
    renderWithIntl(<ListingCategoryTabs label="Loại hình" tabs={tabs} />);
    expect(scroller().style.scrollPaddingInline).toBe("32px");
  });

  it("bấm nút 'sau' cuộn ~80% bề rộng nhìn thấy (smooth)", () => {
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
