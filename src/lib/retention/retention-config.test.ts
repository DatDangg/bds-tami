import { describe, expect, it } from "vitest";

import { daysBefore, hoursBefore, monthsBefore } from "./retention-config";

describe("monthsBefore", () => {
  it("lùi đúng số tháng, giữ nguyên ngày giờ", () => {
    expect(monthsBefore(new Date("2026-10-18T03:04:05.006Z"), 24).toISOString()).toBe("2024-10-18T03:04:05.006Z");
    expect(monthsBefore(new Date("2026-10-18T00:00:00Z"), 12).toISOString()).toBe("2025-10-18T00:00:00.000Z");
  });

  it("qua đầu năm", () => {
    expect(monthsBefore(new Date("2026-02-10T00:00:00Z"), 3).toISOString()).toBe("2025-11-10T00:00:00.000Z");
  });

  it("ngày vượt độ dài tháng đích thì kẹp về ngày cuối tháng, không tràn sang tháng sau", () => {
    expect(monthsBefore(new Date("2026-03-31T10:00:00Z"), 1).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(monthsBefore(new Date("2028-03-31T10:00:00Z"), 1).toISOString()).toBe("2028-02-29T10:00:00.000Z");
    expect(monthsBefore(new Date("2026-02-28T00:00:00Z"), 12).toISOString()).toBe("2025-02-28T00:00:00.000Z");
    expect(monthsBefore(new Date("2028-02-29T00:00:00Z"), 12).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
});

describe("daysBefore / hoursBefore", () => {
  it("lùi đúng khoảng thời gian", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    expect(daysBefore(now, 7).toISOString()).toBe("2026-10-11T12:00:00.000Z");
    expect(hoursBefore(now, 24).toISOString()).toBe("2026-10-17T12:00:00.000Z");
  });
});
