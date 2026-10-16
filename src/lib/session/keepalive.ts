/** Khoảng tối thiểu giữa hai lần làm mới token (PERMISSION §7). */
export const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/** `tokenExpiration` của collection staff: 8 giờ, tính tuyệt đối từ lúc cấp token. Nguồn duy nhất cho Staff.ts + test. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface KeepAliveOptions {
  /** Làm mới phiên qua `useAuth().refreshCookieAsync()` của Payload UI (tự đồng bộ timer, tab khác, và tự chuyển màn inactivity khi lỗi). */
  refresh: () => Promise<unknown>;
  isVisible: () => boolean;
  now: () => number;
  intervalMs?: number;
}

/**
 * Payload chỉ có `tokenExpiration` tuyệt đối, nên "8 giờ không hoạt động" đạt được bằng cách làm mới token
 * khi người dùng còn thao tác. Hàm này quyết định có làm mới hay không:
 * - tab ẩn: bỏ qua (không giữ phiên sống khi không ai nhìn);
 * - chưa đủ `intervalMs` từ lần thử trước (kể cả lần thất bại, để không dồn request): bỏ qua;
 * - đang có một lần làm mới chạy dở: bỏ qua.
 */
export function createKeepAlive(options: KeepAliveOptions) {
  const intervalMs = options.intervalMs ?? REFRESH_INTERVAL_MS;
  let lastAttemptAt = Number.NEGATIVE_INFINITY;
  let inFlight = false;

  async function notifyActivity(): Promise<void> {
    if (inFlight || !options.isVisible()) return;
    const now = options.now();
    if (now - lastAttemptAt < intervalMs) return;
    lastAttemptAt = now;
    inFlight = true;
    try {
      await options.refresh();
    } finally {
      inFlight = false;
    }
  }

  return { notifyActivity };
}
