import type { Payload } from "payload";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventEmitter } from "node:events";
import { runJobsWorker, startJobsRunLoop } from "./run-loop";

function fakePayload(run: () => Promise<unknown>) {
  const handleSchedules = vi.fn(async () => ({}));
  const error = vi.fn();
  const payload = { jobs: { handleSchedules, run: vi.fn(run) }, logger: { error } } as unknown as Payload;
  return { payload, handleSchedules, run: payload.jobs.run as unknown as ReturnType<typeof vi.fn>, error };
}

describe("startJobsRunLoop", () => {
  afterEach(() => vi.useRealTimers());

  it("chạy job theo chu kỳ, tắt log lỗi mặc định (chứa input job) và dừng sạch", async () => {
    vi.useFakeTimers();
    const { payload, handleSchedules, run } = fakePayload(async () => ({}));
    const loop = startJobsRunLoop(payload, 1_000);
    await vi.advanceTimersByTimeAsync(2_100);
    expect(run.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(run).toHaveBeenCalledWith({ silent: { error: true } });
    expect(handleSchedules).toHaveBeenCalled();

    await loop.stop();
    const callsAtStop = run.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(run.mock.calls.length).toBe(callsAtStop);
  });

  it("lỗi một vòng chỉ log tên lỗi (không log message) và vòng sau vẫn chạy", async () => {
    vi.useFakeTimers();
    let attempt = 0;
    const { payload, run, error } = fakePayload(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("chứa dữ liệu khách 0901234567");
      return {};
    });
    const loop = startJobsRunLoop(payload, 1_000);
    await vi.advanceTimersByTimeAsync(1_100);
    expect(run.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(error.mock.calls)).not.toContain("0901234567");
    expect(error).toHaveBeenCalledTimes(1);
    await loop.stop();
  });
});

describe("runJobsWorker", () => {
  afterEach(() => vi.useRealTimers());

  it.each(["SIGINT", "SIGTERM"] as const)("không resolve trước tín hiệu, resolve sạch sau %s và ngừng chạy job", async (signal) => {
    vi.useFakeTimers();
    const { payload, run } = fakePayload(async () => ({}));
    const signals = new EventEmitter();
    let resolved = false;
    const worker = runJobsWorker(payload, { pollIntervalMs: 1_000, signals }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(resolved).toBe(false);
    expect(run.mock.calls.length).toBeGreaterThan(5);

    signals.emit(signal);
    await worker;
    expect(resolved).toBe(true);
    const callsAtStop = run.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(run.mock.calls.length).toBe(callsAtStop);
  });

  it("chờ vòng đang chạy xong rồi mới resolve", async () => {
    vi.useFakeTimers();
    let finishRun: () => void = () => undefined;
    const { payload } = fakePayload(() => new Promise<void>((resolve) => (finishRun = resolve)));
    const signals = new EventEmitter();
    let resolved = false;
    const worker = runJobsWorker(payload, { pollIntervalMs: 1_000, signals }).then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(100);
    signals.emit("SIGTERM");
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(false);
    finishRun();
    await worker;
    expect(resolved).toBe(true);
  });
});
