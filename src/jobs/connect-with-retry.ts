import { logger } from "@/lib/logger";

const DEFAULT_RETRY_DELAY_MS = 5_000;

interface SignalSource {
  once: (signal: "SIGINT" | "SIGTERM", listener: () => void) => unknown;
  off: (signal: "SIGINT" | "SIGTERM", listener: () => void) => unknown;
}

export interface ConnectRetryOptions<T> {
  retryDelayMs?: number;
  signals?: SignalSource;
  /** Gọi khi kết nối xong nhưng đã nhận tín hiệu dừng (hoặc xong sau khi ta đã bỏ cuộc): caller dọn tài nguyên. */
  disposeOnStop?: (connection: T) => Promise<unknown>;
}

/**
 * Khởi tạo kết nối (Payload/DB) cho process `jobs`, thử lại đến khi thành công thay vì chết ngay khi DB đang sập
 * lúc khởi động (spec-validation layer 2, G4). Thất bại chỉ ghi tên lỗi (chuỗi kết nối có mật khẩu).
 * Nhận SIGINT/SIGTERM (kể cả lúc `connect()` đang treo) thì dừng và trả `undefined` để caller thoát sạch;
 * kết nối đã mở dở được đưa cho `disposeOnStop`.
 */
export async function connectWithRetry<T>(
  connect: () => Promise<T>,
  { retryDelayMs = DEFAULT_RETRY_DELAY_MS, signals = process, disposeOnStop }: ConnectRetryOptions<T> = {},
): Promise<T | undefined> {
  let stopRequested = false;
  let resolveStop: (value: undefined) => void = () => {};
  const stopSignal = new Promise<undefined>((resolve) => {
    resolveStop = resolve;
  });
  const requestStop = () => {
    stopRequested = true;
    resolveStop(undefined);
  };
  const disposeQuietly = (connection: T) => {
    Promise.resolve(disposeOnStop?.(connection)).catch(() => undefined);
  };

  async function attemptConnect(): Promise<{ connection: T } | undefined> {
    const pending = connect();
    const outcome = await Promise.race([pending.then((connection) => ({ connection })), stopSignal]);
    if (!outcome) {
      // Dừng khi connect còn treo: bỏ cuộc ngay, nếu nó xong muộn thì dọn.
      pending.then(disposeQuietly, () => undefined);
      return undefined;
    }
    if (stopRequested) {
      disposeQuietly(outcome.connection);
      return undefined;
    }
    return outcome;
  }

  signals.once("SIGINT", requestStop);
  signals.once("SIGTERM", requestStop);
  try {
    for (let attempt = 1; !stopRequested; attempt++) {
      try {
        return (await attemptConnect())?.connection;
      } catch (error) {
        logger.error(
          { component: "jobs", attempt, errorName: error instanceof Error ? error.name : "UnknownError" },
          "Jobs: chưa kết nối được, sẽ thử lại",
        );
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([new Promise<void>((resolve) => (timer = setTimeout(resolve, retryDelayMs))), stopSignal]);
      clearTimeout(timer);
    }
    return undefined;
  } finally {
    signals.off("SIGINT", requestStop);
    signals.off("SIGTERM", requestStop);
  }
}
