import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { BackToTop } from "./BackToTop";

const scrollTo = vi.fn();
let reduceMotion = false;
let scrollY = 0;
let pendingFrame: FrameRequestCallback | null = null;

beforeEach(() => {
  scrollY = 0;
  reduceMotion = false;
  pendingFrame = null;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    pendingFrame = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  Object.defineProperty(window, "scrollY", { get: () => scrollY, configurable: true });
  Object.defineProperty(window, "scrollTo", { value: scrollTo, configurable: true });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: reduceMotion && query.includes("reduce") }),
  });
});

afterEach(() => {
  scrollTo.mockClear();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

function scrollPageTo(y: number) {
  scrollY = y;
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    pendingFrame?.(0);
  });
}

function getButton() {
  return screen.getByRole("button", { name: "Lên đầu trang", hidden: true });
}

describe("BackToTop", () => {
  it("ban đầu ẩn (invisible), nhãn theo ngôn ngữ", () => {
    renderWithIntl(<BackToTop />, "en");
    const button = screen.getByRole("button", { name: "Back to top", hidden: true });
    expect(button).toHaveClass("invisible", "opacity-0");
    expect(button).toHaveAttribute("type", "button");
  });

  it("cuộn quá một màn hình thì hiện; về gần đầu thì ẩn lại", () => {
    renderWithIntl(<BackToTop />);
    scrollPageTo(801);
    expect(getButton()).toHaveClass("visible", "opacity-100");
    scrollPageTo(100);
    expect(getButton()).toHaveClass("invisible");
  });

  it("mount khi trang đã cuộn sâu (khôi phục vị trí) thì hiện ngay", () => {
    scrollY = 2000;
    renderWithIntl(<BackToTop />);
    expect(getButton()).toHaveClass("visible");
  });

  it("click: cuộn mượt về đầu rồi chuyển focus vào #main", async () => {
    const main = document.createElement("main");
    main.id = "main";
    main.tabIndex = -1;
    document.body.append(main);
    const user = userEvent.setup();
    renderWithIntl(<BackToTop />);
    scrollPageTo(1500);
    await user.click(getButton());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(main).toHaveFocus();
  });

  it("prefers-reduced-motion: cuộn tức thì", async () => {
    reduceMotion = true;
    const user = userEvent.setup();
    renderWithIntl(<BackToTop />);
    scrollPageTo(1500);
    await user.click(getButton());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("gỡ listener scroll/resize khi unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderWithIntl(<BackToTop />);
    unmount();
    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["scroll", "resize"]));
    remove.mockRestore();
  });
});
