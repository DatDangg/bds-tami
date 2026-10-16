import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import viMessages from "@/i18n/messages/vi.json";
import { renderWithIntl } from "../media/test-utils";
import { resetTurnstileLoaderForTests, TurnstileWidget } from "./TurnstileWidget";

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;
let observers: { callback: ObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
const api = { render: vi.fn(), reset: vi.fn(), remove: vi.fn() };

function turnstileScripts() {
  return Array.from(document.head.querySelectorAll<HTMLScriptElement>("script")).filter((script) => script.src.includes("challenges.cloudflare.com"));
}

/** jsdom không tải script ngoài: giả lập trình duyệt tải xong script và gắn `window.turnstile`. */
async function finishScriptLoad() {
  window.turnstile = api;
  await act(async () => {
    for (const script of turnstileScripts()) script.onload?.(new Event("load"));
  });
}

function intersect() {
  act(() => {
    for (const observer of observers) observer.callback([{ isIntersecting: true }]);
  });
}

beforeEach(() => {
  observers = [];
  api.render.mockReset().mockImplementation(() => "widget-1");
  api.reset.mockReset();
  api.remove.mockReset();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: ObserverCallback) {
        observers.push({ callback, observe: this.observe, disconnect: this.disconnect });
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const script of turnstileScripts()) script.remove();
  delete window.turnstile;
  resetTurnstileLoaderForTests();
});

describe("TurnstileWidget", () => {
  it("chưa tải script khi chưa vào viewport và chưa focus", () => {
    renderWithIntl(<TurnstileWidget siteKey="site" onToken={() => {}} />);
    expect(turnstileScripts()).toHaveLength(0);
  });

  it("tải script khi vào viewport rồi render explicit theo locale", async () => {
    renderWithIntl(<TurnstileWidget siteKey="site" onToken={() => {}} />, "en");
    intersect();
    expect(turnstileScripts()).toHaveLength(1);
    expect(turnstileScripts()[0]?.src).toContain("render=explicit");
    await finishScriptLoad();
    expect(api.render).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ sitekey: "site", language: "en" }));
  });

  it("tải script khi focus ô đầu tiên của form dù chưa intersect", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <form>
        <label>
          Họ tên
          <input name="fullName" />
        </label>
        <TurnstileWidget siteKey="site" onToken={() => {}} />
      </form>,
    );
    expect(turnstileScripts()).toHaveLength(0);
    await user.click(screen.getByLabelText("Họ tên"));
    expect(turnstileScripts()).toHaveLength(1);
  });

  it("nhiều widget chỉ tải script 1 lần và mỗi widget render riêng", async () => {
    renderWithIntl(
      <>
        <TurnstileWidget siteKey="site" onToken={() => {}} />
        <TurnstileWidget siteKey="site" onToken={() => {}} />
      </>,
    );
    intersect();
    await finishScriptLoad();
    expect(turnstileScripts()).toHaveLength(1);
    expect(api.render).toHaveBeenCalledTimes(2);
  });

  it("chuyển token, token hết hạn (xoá token, không reset trùng với auto-refresh) và lỗi widget về form", async () => {
    const onToken = vi.fn();
    const onUnavailable = vi.fn();
    renderWithIntl(<TurnstileWidget siteKey="site" onToken={onToken} onUnavailable={onUnavailable} />);
    intersect();
    await finishScriptLoad();
    const options = api.render.mock.calls[0]?.[1] as Record<string, (value?: string) => void>;
    const expired = options["expired-callback"] as () => void;
    const errored = options["error-callback"] as () => void;
    options.callback?.("tok-1");
    expect(onToken).toHaveBeenLastCalledWith("tok-1");
    expired();
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(api.reset).not.toHaveBeenCalled();
    errored();
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it("reset token khi resetSignal đổi", async () => {
    const withIntl = (signal: number) => (
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <TurnstileWidget siteKey="site" onToken={() => {}} resetSignal={signal} />
      </NextIntlClientProvider>
    );
    const { rerender } = render(withIntl(0));
    intersect();
    await finishScriptLoad();
    expect(api.reset).not.toHaveBeenCalled();
    rerender(withIntl(1));
    expect(api.reset).toHaveBeenCalledWith("widget-1");
  });

  it("báo không khả dụng khi script tải lỗi và cho tải lại ở lần sau", async () => {
    const onUnavailable = vi.fn();
    renderWithIntl(<TurnstileWidget siteKey="site" onToken={() => {}} onUnavailable={onUnavailable} />);
    intersect();
    await act(async () => {
      turnstileScripts()[0]?.onerror?.(new Event("error"));
    });
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it("script tải xong nhưng thiếu window.turnstile thì báo lỗi và không cache thất bại", async () => {
    const onUnavailable = vi.fn();
    renderWithIntl(<TurnstileWidget siteKey="site" onToken={() => {}} onUnavailable={onUnavailable} />);
    intersect();
    await act(async () => {
      turnstileScripts()[0]?.onload?.(new Event("load"));
    });
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(turnstileScripts()).toHaveLength(0);
    renderWithIntl(<TurnstileWidget siteKey="site" onToken={() => {}} />);
    intersect();
    expect(turnstileScripts()).toHaveLength(1);
  });

  it("unmount gỡ widget khỏi Turnstile", async () => {
    const { unmount } = renderWithIntl(<TurnstileWidget siteKey="site" onToken={() => {}} />);
    intersect();
    await finishScriptLoad();
    unmount();
    expect(api.remove).toHaveBeenCalledWith("widget-1");
  });

  it("thiếu site key thì không tải script và báo không khả dụng", () => {
    const onUnavailable = vi.fn();
    renderWithIntl(<TurnstileWidget onToken={() => {}} onUnavailable={onUnavailable} />);
    intersect();
    expect(turnstileScripts()).toHaveLength(0);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });
});
