import { describe, expect, it } from "vitest";
import { runHealthChecks } from "./run-health-checks";

const ok = () => Promise.resolve();
const fail = () => Promise.reject(new Error("connect ECONNREFUSED 10.0.0.5:6379 redis://user:secret@host"));
const never = () => new Promise<never>(() => {});

describe("runHealthChecks", () => {
  it("tất cả ổn → status ok", async () => {
    expect(await runHealthChecks({ db: ok, redis: ok, storage: ok })).toEqual({
      status: "ok",
      checks: { db: "up", redis: "up", storage: "up" },
    });
  });

  it("một thành phần lỗi → down, không lộ thông điệp lỗi", async () => {
    const report = await runHealthChecks({ db: ok, redis: fail, storage: ok });
    expect(report).toEqual({ status: "down", checks: { db: "up", redis: "down", storage: "up" } });
    expect(JSON.stringify(report)).not.toMatch(/ECONNREFUSED|secret|10\.0\.0\.5/);
  });

  it("probe treo quá timeout → down, các probe khác không bị ảnh hưởng", async () => {
    const started = Date.now();
    const report = await runHealthChecks({ db: ok, redis: ok, storage: never }, 50);
    expect(report.checks).toEqual({ db: "up", redis: "up", storage: "down" });
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it("probe ném lỗi đồng bộ vẫn được coi là down", async () => {
    const throwsSync = () => {
      throw new Error("boom");
    };
    const report = await runHealthChecks({ db: throwsSync, redis: ok, storage: ok });
    expect(report.checks.db).toBe("down");
  });
});
