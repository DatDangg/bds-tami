import type { Payload } from "payload";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

export interface JobsRunLoop {
  /** Dừng nhận vòng mới và chờ vòng đang chạy xong. */
  stop: () => Promise<void>;
}

/**
 * Vòng lặp của process `jobs`: định kỳ xếp job theo lịch (`schedule` của task) rồi chạy job đến hạn.
 * Không chồng vòng: vòng sau chỉ bắt đầu khi vòng trước xong. Lỗi một vòng chỉ ghi tên lỗi (không in input job) rồi đi tiếp.
 */
export function startJobsRunLoop(payload: Payload, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS): JobsRunLoop {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;
  let current: Promise<void> = Promise.resolve();

  const tick = async () => {
    try {
      await payload.jobs.handleSchedules();
      // silent.error: log lỗi mặc định của Payload in cả input job (dữ liệu khách); task tự log định danh an toàn.
      await payload.jobs.run({ silent: { error: true } });
    } catch (error) {
      payload.logger.error({ errorName: error instanceof Error ? error.name : "UnknownError" }, "Jobs: vòng chạy lỗi");
    }
    if (!stopped) timer = setTimeout(() => (current = tick()), pollIntervalMs);
  };

  current = tick();
  return {
    stop: async () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      await current;
    },
  };
}

interface SignalSource {
  once: (signal: "SIGINT" | "SIGTERM", listener: () => void) => unknown;
}

/**
 * Chạy worker đến khi nhận SIGINT/SIGTERM rồi dừng sạch (chờ vòng đang chạy xong).
 * Phải được `await` ở top-level của scripts/jobs-runner.ts: `payload run` gọi `process.exit(0)` ngay khi
 * script import xong, nên chỉ Promise treo này mới giữ process sống.
 */
export async function runJobsWorker(
  payload: Payload,
  options: { pollIntervalMs?: number; signals?: SignalSource } = {},
): Promise<void> {
  const { pollIntervalMs, signals = process } = options;
  const loop = startJobsRunLoop(payload, pollIntervalMs);
  await new Promise<void>((resolve) => {
    signals.once("SIGINT", resolve);
    signals.once("SIGTERM", resolve);
  });
  await loop.stop();
}
