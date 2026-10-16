import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createKeepAlive, REFRESH_INTERVAL_MS } from "../../src/lib/session/keepalive";

describe("session keep-alive (throttle làm mới token)", () => {
  let visible: boolean;
  const refresh = vi.fn<() => Promise<unknown>>();

  const build = () => createKeepAlive({ refresh, isVisible: () => visible, now: () => Date.now() });

  beforeEach(() => {
    vi.useFakeTimers();
    visible = true;
    refresh.mockReset();
    refresh.mockResolvedValue({ id: 1 });
  });
  afterEach(() => vi.useRealTimers());

  it("nhiều sự kiện trong 15 phút chỉ làm mới 1 lần", async () => {
    const keepAlive = build();
    for (let i = 0; i < 20; i += 1) {
      await keepAlive.notifyActivity();
      vi.advanceTimersByTime(30_000);
    }
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("làm mới lại sau khi đủ 15 phút", async () => {
    const keepAlive = build();
    await keepAlive.notifyActivity();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 1);
    await keepAlive.notifyActivity();
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await keepAlive.notifyActivity();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("không có sự kiện thì không làm mới dù thời gian trôi qua", () => {
    build();
    vi.advanceTimersByTime(8 * 60 * 60 * 1000);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("tab ẩn thì không làm mới, hiện lại và có thao tác thì làm mới", async () => {
    const keepAlive = build();
    visible = false;
    await keepAlive.notifyActivity();
    expect(refresh).not.toHaveBeenCalled();
    visible = true;
    await keepAlive.notifyActivity();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refresh trả null (lỗi/stale): vẫn bị throttle", async () => {
    refresh.mockResolvedValue(null);
    const keepAlive = build();
    await keepAlive.notifyActivity();
    await keepAlive.notifyActivity();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refresh ném lỗi: cờ inFlight được nhả, lần sau đủ 15 phút vẫn làm mới", async () => {
    refresh.mockRejectedValueOnce(new Error("offline"));
    const keepAlive = build();
    await expect(keepAlive.notifyActivity()).rejects.toThrow("offline");
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    await keepAlive.notifyActivity();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("không gọi chồng khi lần làm mới trước chưa xong", async () => {
    let release: (value: unknown) => void = () => undefined;
    refresh.mockImplementation(() => new Promise<unknown>((resolve) => (release = resolve)));
    const keepAlive = build();
    const first = keepAlive.notifyActivity();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    await keepAlive.notifyActivity();
    expect(refresh).toHaveBeenCalledTimes(1);
    release(null);
    await first;
  });
});
