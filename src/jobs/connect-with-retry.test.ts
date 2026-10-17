import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

import { connectWithRetry } from "./connect-with-retry";

describe("connectWithRetry", () => {
  it("DB sập lúc khởi động: thử lại đến khi kết nối được", async () => {
    const connect = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("ECONNREFUSED postgres://u:pw@host"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValue("payload");
    const signals = new EventEmitter();
    await expect(connectWithRetry(connect, { retryDelayMs: 1, signals })).resolves.toBe("payload");
    expect(connect).toHaveBeenCalledTimes(3);
    expect(signals.listenerCount("SIGTERM")).toBe(0);
  });

  it("SIGTERM trong lúc chờ → dừng, trả undefined (không kẹt vòng retry)", async () => {
    const connect = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("down"));
    const signals = new EventEmitter();
    const result = connectWithRetry(connect, { retryDelayMs: 60_000, signals });
    await vi.waitFor(() => expect(connect).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(signals.listenerCount("SIGTERM")).toBe(1));
    signals.emit("SIGTERM");
    await expect(result).resolves.toBeUndefined();
  });
});

describe("connectWithRetry: tín hiệu dừng đúng lúc connect", () => {
  it("SIGTERM trong lúc connect đang treo → trả undefined ngay, kết nối xong muộn được dọn", async () => {
    let finishConnect: (value: string) => void = () => {};
    const connect = vi.fn(() => new Promise<string>((resolve) => (finishConnect = resolve)));
    const disposeOnStop = vi.fn(async () => undefined);
    const signals = new EventEmitter();
    const result = connectWithRetry(connect, { signals, disposeOnStop });
    await vi.waitFor(() => expect(signals.listenerCount("SIGTERM")).toBe(1));
    signals.emit("SIGTERM");
    await expect(result).resolves.toBeUndefined();
    expect(signals.listenerCount("SIGTERM")).toBe(0);
    finishConnect("payload");
    await vi.waitFor(() => expect(disposeOnStop).toHaveBeenCalledWith("payload"));
  });

  it("connect thành công cùng lúc đã có SIGTERM → không trả kết nối, dọn nó", async () => {
    const signals = new EventEmitter();
    const disposeOnStop = vi.fn(async () => undefined);
    const connect = vi.fn(async () => {
      signals.emit("SIGTERM");
      return "payload";
    });
    await expect(connectWithRetry(connect, { signals, disposeOnStop })).resolves.toBeUndefined();
    await vi.waitFor(() => expect(disposeOnStop).toHaveBeenCalledWith("payload"));
  });
});
