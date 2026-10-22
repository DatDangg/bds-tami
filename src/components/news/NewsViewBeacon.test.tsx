import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NEWS_VIEW_DELAY_MS, NEWS_VIEWS_URL, NewsViewBeacon } from "./NewsViewBeacon";

const NEWS_ID = "5b1d7c1e-6d5f-4a43-9a5e-0c1b2a3d4e5f";

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

async function readBlob(blob: Blob): Promise<string> {
  return blob.text();
}

describe("NewsViewBeacon", () => {
  const sendBeacon = vi.fn<(url: string, data?: BodyInit | null) => boolean>(() => true);
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));

  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: sendBeacon });
    Object.defineProperty(navigator, "webdriver", { configurable: true, value: false });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    sendBeacon.mockReset().mockReturnValue(true);
    fetchMock.mockClear();
  });

  it("không render gì và không gửi ngay khi mount (không chặn render)", () => {
    const { container } = render(<NewsViewBeacon newsId={NEWS_ID} />);
    expect(container.innerHTML).toBe("");
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("gửi đúng MỘT lần bằng sendBeacon sau khoảng trễ, body JSON text/plain", async () => {
    render(<NewsViewBeacon newsId={NEWS_ID} />);
    act(() => vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS));
    expect(sendBeacon).toHaveBeenCalledOnce();
    const [url, blob] = sendBeacon.mock.calls[0]!;
    expect(url).toBe(NEWS_VIEWS_URL);
    expect((blob as Blob).type).toBe("text/plain;charset=utf-8");
    expect(JSON.parse(await readBlob(blob as Blob))).toEqual({ newsId: NEWS_ID });

    // Ẩn / hiện tab, chờ thêm: không gửi lần hai.
    act(() => {
      setVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      setVisibility("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS * 3);
    });
    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("không gửi khi navigator.webdriver (trình duyệt tự động hoá)", () => {
    Object.defineProperty(navigator, "webdriver", { configurable: true, value: true });
    render(<NewsViewBeacon newsId={NEWS_ID} />);
    act(() => vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS * 3));
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tab đang ẩn thì chờ tới khi hiện mới đếm giờ", () => {
    setVisibility("hidden");
    render(<NewsViewBeacon newsId={NEWS_ID} />);
    act(() => vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS * 3));
    expect(sendBeacon).not.toHaveBeenCalled();
    act(() => {
      setVisibility("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS);
    });
    expect(sendBeacon).toHaveBeenCalledOnce();
  });

  it("rời trang trước khoảng trễ -> không gửi", () => {
    const { unmount } = render(<NewsViewBeacon newsId={NEWS_ID} />);
    act(() => vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS - 100));
    unmount();
    act(() => vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS));
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("sendBeacon không xếp hàng được -> fallback fetch keepalive, một lần", () => {
    sendBeacon.mockReturnValue(false);
    render(<NewsViewBeacon newsId={NEWS_ID} />);
    act(() => vi.advanceTimersByTime(NEWS_VIEW_DELAY_MS));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      NEWS_VIEWS_URL,
      expect.objectContaining({ method: "POST", keepalive: true, body: JSON.stringify({ newsId: NEWS_ID }) }),
    );
  });
});
