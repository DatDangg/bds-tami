import { afterEach, describe, expect, it, vi } from "vitest";

// Cổng 1 không có dịch vụ nào lắng nghe → kết nối bị từ chối ngay, không cần Docker.
vi.mock("@/lib/env", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...original,
    getEnv: () => ({ ...original.getEnv(), DATABASE_URL: "postgres://u:secret@127.0.0.1:1/none" }),
  };
});

const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

afterEach(() => {
  process.off("unhandledRejection", onUnhandled);
});

describe("createHealthProbes · DB down", () => {
  it("db: down, 503, không lộ thông tin kết nối và không có unhandled rejection", async () => {
    process.on("unhandledRejection", onUnhandled);
    const { createHealthProbes } = await import("./probes");
    const { runHealthChecks } = await import("./run-health-checks");
    const probes = createHealthProbes();
    const report = await runHealthChecks({ db: probes.db, redis: () => Promise.resolve(), storage: () => Promise.resolve() });

    expect(report.status).toBe("down");
    expect(report.checks.db).toBe("down");
    expect(JSON.stringify(report)).not.toMatch(/secret|127\.0\.0\.1/);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(unhandled).toEqual([]);
  });
});
