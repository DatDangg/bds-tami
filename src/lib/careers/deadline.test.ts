import { describe, expect, it } from "vitest";

import { daysUntilDeadline, deadlineDate, isPastDeadline, startOfVietnamDay, validThroughIso } from "./deadline";

// Ô chọn ngày `dayOnly` của admin lưu 12:00 UTC của ngày chọn.
const PICKER_17 = "2026-10-17T12:00:00.000Z";

describe("isPastDeadline (ngày giờ Việt Nam)", () => {
  it("còn nhận hồ sơ đến hết ngày hạn chót; quá hạn từ 00:00 ngày kế tiếp (biên 23:59 / 00:00 ICT)", () => {
    // 16:59:59.999 UTC ngày 17 = 23:59:59.999 ICT ngày 17: vẫn còn hạn.
    expect(isPastDeadline(PICKER_17, new Date("2026-10-17T16:59:59.999Z"))).toBe(false);
    // 17:00:00 UTC = 00:00 ICT ngày 18: quá hạn.
    expect(isPastDeadline(PICKER_17, new Date("2026-10-17T17:00:00.000Z"))).toBe(true);
  });

  it("đầu ngày hạn chót (00:00 ICT) và giữa ngày vẫn còn hạn", () => {
    expect(isPastDeadline(PICKER_17, new Date("2026-10-16T17:00:00.000Z"))).toBe(false);
    expect(isPastDeadline(PICKER_17, new Date("2026-10-17T03:00:00.000Z"))).toBe(false);
  });

  it("hạn do API đặt ở giờ khác 12:00Z vẫn ra đúng ngày giờ VN", () => {
    // 17:00Z ngày 16 = 00:00 ICT ngày 17 (nửa đêm giờ VN): hạn chót ngày 17, không phải ngày 16.
    expect(isPastDeadline("2026-10-16T17:00:00.000Z", new Date("2026-10-17T16:59:00.000Z"))).toBe(false);
    expect(isPastDeadline("2026-10-16T17:00:00.000Z", new Date("2026-10-17T17:00:00.000Z"))).toBe(true);
    // 00:00Z ngày 17 = 07:00 ICT ngày 17.
    expect(isPastDeadline("2026-10-17T00:00:00.000Z", new Date("2026-10-17T16:59:00.000Z"))).toBe(false);
  });

  it("hạn hỏng (không phải ngày) coi là quá hạn", () => {
    expect(isPastDeadline("khong-phai-ngay", new Date())).toBe(true);
  });
});

describe("startOfVietnamDay", () => {
  it("là 00:00 ICT của hôm nay (mốc UTC), khớp với biên của isPastDeadline", () => {
    expect(startOfVietnamDay(new Date("2026-10-17T16:59:59.999Z")).toISOString()).toBe("2026-10-16T17:00:00.000Z");
    expect(startOfVietnamDay(new Date("2026-10-17T17:00:00.000Z")).toISOString()).toBe("2026-10-17T17:00:00.000Z");
  });

  it("deadline >= startOfVietnamDay ⟺ chưa quá hạn", () => {
    const now = new Date("2026-10-17T20:00:00.000Z"); // 03:00 ICT ngày 18
    const boundary = startOfVietnamDay(now).getTime();
    for (const deadline of [PICKER_17, "2026-10-18T12:00:00.000Z", "2026-10-17T00:00:00.000Z", "2026-10-17T17:00:00.000Z"]) {
      expect(Date.parse(deadline) >= boundary).toBe(!isPastDeadline(deadline, now));
    }
  });
});

describe("daysUntilDeadline", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  it("0 trong ngày hạn chót, đếm theo lịch VN, null khi quá hạn", () => {
    expect(daysUntilDeadline(PICKER_17, now)).toBe(0);
    expect(daysUntilDeadline("2026-10-20T12:00:00.000Z", now)).toBe(3);
    expect(daysUntilDeadline("2026-10-16T12:00:00.000Z", now)).toBeNull();
    expect(daysUntilDeadline("hong", now)).toBeNull();
  });
  it("23:30 UTC đã là ngày hôm sau ở Việt Nam", () => {
    expect(daysUntilDeadline("2026-10-18T12:00:00.000Z", new Date("2026-10-17T23:30:00.000Z"))).toBe(0);
  });
});

describe("deadlineDate / validThroughIso", () => {
  it("validThrough là cuối ngày hạn chót giờ VN kèm múi giờ", () => {
    expect(deadlineDate(PICKER_17)).toBe("2026-10-17");
    expect(validThroughIso(PICKER_17)).toBe("2026-10-17T23:59:59+07:00");
    expect(validThroughIso("hong")).toBeNull();
  });
});
