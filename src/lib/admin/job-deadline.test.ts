import { describe, expect, it } from "vitest";

import { formatDeadlineVn, isJobPostingExpired } from "./job-deadline";

// 2026-10-20 23:59 giờ VN = 16:59Z; 00:00 ngày 21 giờ VN = 17:00Z.
const LAST_MINUTE = new Date("2026-10-20T16:59:00.000Z");
const NEXT_DAY = new Date("2026-10-20T17:00:00.000Z");
const PICKER_VALUE = "2026-10-20T12:00:00.000Z";

describe("isJobPostingExpired", () => {
  it("hết ngày hạn chót (giờ VN) vẫn còn hạn, 00:00 hôm sau mới quá hạn", () => {
    expect(isJobPostingExpired(PICKER_VALUE, LAST_MINUTE)).toBe(false);
    expect(isJobPostingExpired(PICKER_VALUE, NEXT_DAY)).toBe(true);
  });
  it("nửa đêm VN của ngày hạn vẫn là ngày đó", () => {
    expect(isJobPostingExpired("2026-10-19T17:00:00.000Z", LAST_MINUTE)).toBe(false);
  });
  it("chưa có hạn → không badge", () => {
    expect(isJobPostingExpired(undefined, NEXT_DAY)).toBe(false);
    expect(isJobPostingExpired(null, NEXT_DAY)).toBe(false);
    expect(isJobPostingExpired("", NEXT_DAY)).toBe(false);
  });
});

describe("formatDeadlineVn", () => {
  it("dd/MM/yyyy theo ngày VN", () => {
    expect(formatDeadlineVn(PICKER_VALUE)).toBe("20/10/2026");
    expect(formatDeadlineVn("2026-10-20T17:30:00.000Z")).toBe("21/10/2026");
  });
  it("giá trị hỏng → null", () => {
    expect(formatDeadlineVn("abc")).toBeNull();
    expect(formatDeadlineVn(undefined)).toBeNull();
  });
});
