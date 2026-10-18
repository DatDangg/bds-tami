import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { dataRetentionTask } from "./data-retention";

// `croner` là phụ thuộc của payload: nạp qua payload để kiểm đúng bộ đọc cron đang chạy lịch (như remind-unassigned-leads.test.ts).
interface CronLike {
  nextRuns(count: number, from: Date): Date[];
}
const { Cron } = createRequire(createRequire(import.meta.url).resolve("payload"))("croner") as {
  Cron: new (pattern: string, options: { timezone: string }) => CronLike;
};

describe("data-retention: lịch chạy", () => {
  const schedule = dataRetentionTask.schedule?.[0];
  const toVietnam = (date: Date) => new Date(date.getTime() + 7 * 3_600_000).toISOString().replace("T", " ").slice(0, 16);

  it("hằng tuần: 03:00 Chủ nhật giờ VN (= thứ 7 20:00 UTC)", () => {
    expect(schedule).toEqual({ cron: "0 0 20 * * 6", queue: "default" });
    const runs = new Cron(schedule!.cron, { timezone: "UTC" }).nextRuns(3, new Date("2026-10-18T00:00:00Z")).map(toVietnam);
    // 18/10/2026 là Chủ nhật; lần kế tiếp là Chủ nhật 25/10 03:00 VN, rồi 01/11, 08/11.
    expect(runs).toEqual(["2026-10-25 03:00", "2026-11-01 03:00", "2026-11-08 03:00"]);
  });

  it("nhận input dryRun (checkbox) và trả đủ bộ đếm", () => {
    expect(dataRetentionTask.inputSchema).toEqual([{ name: "dryRun", type: "checkbox" }]);
    expect(dataRetentionTask.outputSchema?.map((field) => ("name" in field ? field.name : ""))).toEqual([
      "dryRun",
      "leadsAnonymized",
      "applicationsAnonymized",
      "cvFilesDeleted",
      "orphanCvsDeleted",
      "auditLogsDeleted",
      "failedJobsDeleted",
    ]);
  });
});
