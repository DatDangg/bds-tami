import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UtmCapture } from "./UtmCapture";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const STORAGE_KEY = "tami.utm";

function stored(): unknown {
  return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
}

/** Mô phỏng điều hướng: đổi URL thật của jsdom (island đọc `window.location.search`) và pathname mà `usePathname` trả về. */
function navigate(url: string) {
  window.history.replaceState(null, "", url);
  pathname.current = new URL(url, window.location.origin).pathname;
}

beforeEach(() => {
  window.sessionStorage.clear();
  navigate("/");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UtmCapture", () => {
  it("không render gì ra DOM", () => {
    const { container } = render(<UtmCapture />);
    expect(container).toBeEmptyDOMElement();
  });

  it("URL có utm_* → lưu vào sessionStorage khi mount", () => {
    navigate("/du-an?utm_source=facebook&utm_campaign=t10&foo=1");
    render(<UtmCapture />);
    expect(stored()).toEqual({ source: "facebook", campaign: "t10" });
  });

  it("URL không có utm_* → không ghi và không xoá bản đã lưu", () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ source: "zalo" }));
    navigate("/lien-he?foo=1");
    render(<UtmCapture />);
    expect(stored()).toEqual({ source: "zalo" });
  });

  it("đổi pathname (soft navigation) tới URL có UTM mới → ghi đè bản đã lưu", () => {
    navigate("/?utm_source=facebook");
    const { rerender } = render(<UtmCapture />);
    expect(stored()).toEqual({ source: "facebook" });

    navigate("/en/for-rent?utm_source=google&utm_medium=cpc");
    rerender(<UtmCapture />);
    expect(stored()).toEqual({ source: "google", medium: "cpc" });

    // Sang trang không có UTM: giữ nguyên bản mới nhất.
    navigate("/en/contact");
    rerender(<UtmCapture />);
    expect(stored()).toEqual({ source: "google", medium: "cpc" });
  });

  it("sessionStorage.setItem ném lỗi (quota/chế độ riêng tư) → không crash", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    navigate("/?utm_source=facebook");
    expect(() => render(<UtmCapture />)).not.toThrow();
  });

  it("truy cập window.sessionStorage ném lỗi (storage bị tắt) → không crash", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("disabled", "SecurityError");
      },
    });
    try {
      navigate("/?utm_source=facebook");
      expect(() => render(<UtmCapture />)).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(window, "sessionStorage", descriptor);
    }
  });
});
