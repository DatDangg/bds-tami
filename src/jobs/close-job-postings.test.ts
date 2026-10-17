import { describe, expect, it } from "vitest";

import { closeJobPostingsTask } from "./close-job-postings";

describe("close-job-postings: lịch chạy", () => {
  it("00:10 giờ VN mỗi ngày = 17:10 UTC (container jobs chạy UTC; Payload Jobs không có múi giờ riêng cho schedule)", () => {
    expect(closeJobPostingsTask.schedule).toEqual([{ cron: "0 10 17 * * *", queue: "default" }]);
  });
});
