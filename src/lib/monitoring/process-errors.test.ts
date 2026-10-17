import { afterEach, describe, expect, it, vi } from "vitest";

const log = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: log }));

describe("installProcessErrorHandlers", () => {
  afterEach(() => {
    process.removeAllListeners("unhandledRejection");
    Reflect.deleteProperty(globalThis, Symbol.for("tami.processErrorHandlersInstalled"));
    log.error.mockClear();
  });

  it("đăng ký đúng một listener, ghi log và không làm process thoát", async () => {
    const { installProcessErrorHandlers } = await import("./process-errors");
    const before = process.listenerCount("unhandledRejection");
    installProcessErrorHandlers();
    installProcessErrorHandlers();
    expect(process.listenerCount("unhandledRejection")).toBe(before + 1);
    process.emit("unhandledRejection", new Error("db down"), Promise.resolve());
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});
