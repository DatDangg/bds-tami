export const HEALTH_CHECK_TIMEOUT_MS = 2_000;

export type ComponentStatus = "up" | "down";

export type HealthProbes = {
  db: () => Promise<unknown>;
  redis: () => Promise<unknown>;
  storage: () => Promise<unknown>;
};

export type HealthReport = {
  status: "ok" | "down";
  checks: Record<keyof HealthProbes, ComponentStatus>;
};

/** Một probe lỗi hoặc quá hạn đều tính là "down"; không giữ lại thông điệp lỗi (tránh lộ host/chuỗi kết nối). */
async function probeStatus(probe: () => Promise<unknown>, timeoutMs: number): Promise<ComponentStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });
  try {
    await Promise.race([probe(), timeout]);
    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

/** Chạy song song 3 probe, mỗi probe có timeout riêng nên tổng thời gian ≤ timeoutMs. */
export async function runHealthChecks(
  probes: HealthProbes,
  timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS,
): Promise<HealthReport> {
  const [db, redis, storage] = await Promise.all([
    probeStatus(probes.db, timeoutMs),
    probeStatus(probes.redis, timeoutMs),
    probeStatus(probes.storage, timeoutMs),
  ]);
  const allUp = db === "up" && redis === "up" && storage === "up";
  return { status: allUp ? "ok" : "down", checks: { db, redis, storage } };
}
