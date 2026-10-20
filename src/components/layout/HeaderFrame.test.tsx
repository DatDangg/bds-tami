import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderFrame } from "./HeaderFrame";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
}

function scrollTo(value: number) {
  setScrollY(value);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    vi.runAllTimers(); // flush requestAnimationFrame (giả lập bằng timer)
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  setScrollY(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HeaderFrame", () => {
  it("là landmark banner, dính đầu trang, nằm trong luồng (không fixed → không che nội dung, không CLS)", () => {
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("site-header", "sticky", "top-0", "h-(--header-offset)");
    expect(header).not.toHaveClass("fixed");
    expect(header).not.toHaveClass("absolute");
    expect(header).not.toHaveAttribute("data-solid");
  });

  it("mặc định (đầu trang): thanh phẳng full-width, không bo/bóng hiệu lực; vùng ngoài thanh không chặn chuột", () => {
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    const header = screen.getByRole("banner");
    const content = screen.getByText("nội dung header");
    const bar = content.parentElement;
    expect(bar).not.toBeNull();
    // nội dung luôn trong khung 84rem căn giữa (cả 2 trạng thái) → không nhảy ngang khi cuộn
    expect(content).toHaveClass("mx-auto", "w-full", "max-w-[84rem]");
    expect(header).not.toHaveAttribute("data-scrolled");
    expect(header).toHaveClass("pointer-events-none", "p-0");
    expect(bar).toHaveClass("site-header-bar", "pointer-events-auto", "h-full", "max-w-full", "rounded-none", "shadow-none");
    // lớp nổi chỉ nằm sau variant data-scrolled, không có bản vô điều kiện
    expect(bar).not.toHaveClass("rounded-pill");
    expect(bar).not.toHaveClass("shadow-md");
    // radius thật (nửa chiều cao thanh nổi 64/72px), không còn 9999px
    expect(bar).not.toHaveClass("group-data-[scrolled]:rounded-pill");
    expect(bar).toHaveClass(
      "group-data-[scrolled]:rounded-[2rem]",
      "lg:group-data-[scrolled]:rounded-[2.25rem]",
      "group-data-[scrolled]:shadow-md",
      "group-data-[scrolled]:max-w-[84rem]",
    );
    expect(header).toHaveClass("data-[scrolled]:px-2", "data-[scrolled]:py-2", "lg:data-[scrolled]:px-4", "lg:data-[scrolled]:py-4");
  });

  it("header và thanh cùng thời lượng/easing chuyển; tôn trọng prefers-reduced-motion", () => {
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    const header = screen.getByRole("banner");
    const bar = screen.getByText("nội dung header").parentElement;
    for (const el of [header, bar]) {
      expect(el).toHaveClass("duration-(--duration-slow)", "ease-standard", "motion-reduce:transition-none");
      expect(el).not.toHaveClass("duration-(--duration-base)");
    }
  });

  it("cuộn xuống → data-scrolled; cuộn về đầu → phẳng lại", () => {
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    const header = screen.getByRole("banner");
    scrollTo(120);
    expect(header).toHaveAttribute("data-scrolled");
    scrollTo(2); // trong ngưỡng rung
    expect(header).not.toHaveAttribute("data-scrolled");
    scrollTo(0);
    expect(header).not.toHaveAttribute("data-scrolled");
  });

  it("đọc vị trí cuộn ngay khi mount (trang khôi phục vị trí / mở neo)", () => {
    setScrollY(500);
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    expect(screen.getByRole("banner")).toHaveAttribute("data-scrolled");
  });

  it("listener scroll là passive và được gỡ khi unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<HeaderFrame>nội dung header</HeaderFrame>);
    const call = add.mock.calls.find(([type]) => type === "scroll");
    expect(call?.[2]).toEqual({ passive: true });
    unmount();
    expect(remove.mock.calls.some(([type, handler]) => type === "scroll" && handler === call?.[1])).toBe(true);
    add.mockRestore();
    remove.mockRestore();
  });
});
