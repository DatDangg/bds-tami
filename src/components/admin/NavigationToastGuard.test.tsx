import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NavigationToastGuard } from "./NavigationToastGuard";

const FLAG = "adminNavigatingAway";
const flagged = () => document.documentElement.dataset[FLAG] === "true";

function fireBeforeUnload(preventDefault = false) {
  const event = new Event("beforeunload", { cancelable: true });
  if (preventDefault) event.preventDefault();
  window.dispatchEvent(event);
}

describe("NavigationToastGuard (ẩn toast giả khi trang đang rời đi)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    delete document.documentElement.dataset[FLAG];
  });

  it("render children nguyên vẹn", () => {
    const { getByText } = render(
      <NavigationToastGuard>
        <p>nội dung</p>
      </NavigationToastGuard>,
    );
    expect(getByText("nội dung")).toBeTruthy();
  });

  it("không đặt cờ khi chưa có beforeunload (lỗi mạng thật vẫn toast)", () => {
    render(<NavigationToastGuard>x</NavigationToastGuard>);
    vi.runAllTimers();
    expect(flagged()).toBe(false);
  });

  it("beforeunload đặt cờ trên <html>", () => {
    render(<NavigationToastGuard>x</NavigationToastGuard>);
    fireBeforeUnload();
    vi.runAllTimers();
    expect(flagged()).toBe(true);
  });

  it("beforeunload bị preventDefault (hộp thoại 'chưa lưu') thì không giữ cờ", () => {
    render(<NavigationToastGuard>x</NavigationToastGuard>);
    fireBeforeUnload(true);
    vi.runAllTimers();
    expect(flagged()).toBe(false);
  });

  it("listener beforeunload khác đăng ký SAU provider gọi preventDefault → cờ được gỡ sau macrotask", () => {
    render(<NavigationToastGuard>x</NavigationToastGuard>);
    const laterListener = (event: Event) => event.preventDefault();
    window.addEventListener("beforeunload", laterListener);
    try {
      fireBeforeUnload();
      expect(flagged()).toBe(true);
      vi.runAllTimers();
      expect(flagged()).toBe(false);
    } finally {
      window.removeEventListener("beforeunload", laterListener);
    }
  });

  it.each(["pageshow", "pointerdown", "keydown", "focus"])("%s gỡ cờ (điều hướng bị huỷ / trang còn sống)", (name) => {
    render(<NavigationToastGuard>x</NavigationToastGuard>);
    fireBeforeUnload();
    vi.runAllTimers();
    window.dispatchEvent(new Event(name));
    expect(flagged()).toBe(false);
  });

  it("gỡ listener và cờ khi unmount", () => {
    const { unmount } = render(<NavigationToastGuard>x</NavigationToastGuard>);
    fireBeforeUnload();
    vi.runAllTimers();
    unmount();
    expect(flagged()).toBe(false);
    fireBeforeUnload();
    vi.runAllTimers();
    expect(flagged()).toBe(false);
  });
});
