import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeaderFrame } from "./HeaderFrame";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;
const instances: { callback: ObserverCallback; options: IntersectionObserverInit | undefined; disconnect: () => void }[] = [];

function installObserver() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      callback: ObserverCallback;
      options: IntersectionObserverInit | undefined;
      constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.options = options;
        instances.push(this);
      }
      observe() {}
      disconnect() {}
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  instances.length = 0;
});

function renderPage(withHero: boolean) {
  return render(
    <>
      <HeaderFrame>
        <span>nội dung header</span>
      </HeaderFrame>
      <main>{withHero && <section data-header-hero="" />}</main>
    </>,
  );
}

describe("HeaderFrame", () => {
  it("là landmark banner, dính đầu trang, mặc định chưa đặc-do-cuộn", () => {
    renderPage(false);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("site-header", "sticky", "top-0");
    expect(header).toHaveAttribute("data-solid", "false");
  });

  it("trang không có hero: không tạo observer", () => {
    installObserver();
    renderPage(false);
    expect(instances).toHaveLength(0);
  });

  it("trang có hero: hero ra khỏi vùng dưới header → data-solid=true, hero quay lại → false", () => {
    installObserver();
    renderPage(true);
    expect(instances).toHaveLength(1);
    const header = screen.getByRole("banner");
    act(() => instances[0]?.callback([{ isIntersecting: false }]));
    expect(header).toHaveAttribute("data-solid", "true");
    act(() => instances[0]?.callback([{ isIntersecting: true }]));
    expect(header).toHaveAttribute("data-solid", "false");
  });

  it("không có IntersectionObserver (trình duyệt cũ): không lỗi, giữ trạng thái trong suốt", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    renderPage(true);
    expect(screen.getByRole("banner")).toHaveAttribute("data-solid", "false");
  });
});
