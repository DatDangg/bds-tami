import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { remindUnassignedLeadsTask } from "./remind-unassigned-leads";

// `croner` là phụ thuộc của payload (bộ đọc cron của Payload Jobs), không phải của app: nạp qua payload để kiểm đúng bộ đọc đang chạy lịch.
interface CronLike {
  nextRuns(count: number, from: Date): Date[];
}
const { Cron } = createRequire(createRequire(import.meta.url).resolve("payload"))("croner") as {
  Cron: new (pattern: string, options: { timezone: string }) => CronLike;
};

describe("remind-unassigned-leads: lịch chạy", () => {
  const schedule = remindUnassignedLeadsTask.schedule?.[0];
  const toVietnam = (date: Date) => new Date(date.getTime() + 7 * 3_600_000).toISOString().replace("T", " ").slice(0, 16);

  it("10 phút/lần, cron UTC phủ giờ làm VN, thứ 2–thứ 7", () => {
    expect(schedule).toEqual({ cron: "0 */10 1-10 * * 1-6", queue: "default" });
    // Thứ 7 24/10/2026 (VN) -> lần chạy kế tiếp sau thứ 7 17:50 là thứ 2 26/10 08:00 (bỏ Chủ nhật).
    const runs = new Cron(schedule!.cron, { timezone: "UTC" }).nextRuns(200, new Date("2026-10-24T10:49:00Z")).map(toVietnam);
    expect(runs[0]).toBe("2026-10-24 17:50");
    expect(runs[1]).toBe("2026-10-26 08:00");
    expect(runs.some((run) => run.startsWith("2026-10-25"))).toBe(false);
    expect(runs.some((run) => run.slice(11) < "08:00" || run.slice(11) > "17:50")).toBe(false);
  });
});
