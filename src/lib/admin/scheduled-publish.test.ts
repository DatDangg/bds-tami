import { describe, expect, it } from "vitest";

import { buildScheduleNotices, formatScheduleVn, isScheduledPublish, scheduledPublishLabel } from "./scheduled-publish";

const NOW = new Date("2026-10-28T03:00:00.000Z"); // 10:00 giờ VN
const FUTURE = "2026-10-29T02:30:00.000Z"; // 09:30 ngày 29 giờ VN
const PAST = "2026-10-20T00:00:00.000Z";

describe("formatScheduleVn", () => {
  it("dd/MM/yyyy HH:mm theo giờ Việt Nam, không phụ thuộc múi giờ máy", () => {
    expect(formatScheduleVn(FUTURE)).toBe("29/10/2026 09:30");
    expect(formatScheduleVn("2026-10-28T17:00:00.000Z")).toBe("29/10/2026 00:00");
  });
  it("không đọc được → null", () => {
    for (const value of [null, undefined, "", "abc", {}]) expect(formatScheduleVn(value)).toBeNull();
  });
});

describe("isScheduledPublish / scheduledPublishLabel", () => {
  it("chỉ tin published có publishedAt > now", () => {
    expect(isScheduledPublish("published", FUTURE, NOW)).toBe(true);
    expect(isScheduledPublish("published", PAST, NOW)).toBe(false);
    expect(isScheduledPublish("published", NOW.toISOString(), NOW)).toBe(false);
    expect(isScheduledPublish("draft", FUTURE, NOW)).toBe(false);
    expect(isScheduledPublish("published", null, NOW)).toBe(false);
  });
  it("nhãn 'Đã hẹn giờ · dd/MM/yyyy HH:mm'; không hẹn giờ → null", () => {
    expect(scheduledPublishLabel("published", FUTURE, NOW)).toBe("Đã hẹn giờ · 29/10/2026 09:30");
    expect(scheduledPublishLabel("published", PAST, NOW)).toBeNull();
    expect(scheduledPublishLabel("hidden", FUTURE, NOW)).toBeNull();
  });
});

describe("buildScheduleNotices", () => {
  const base = { now: NOW, timezoneOffsetMinutes: -420, savedStatus: "published", status: "published", savedPublishedAt: PAST, value: PAST };

  it("luôn có ghi chú GMT+7; không cảnh báo múi giờ khi máy ở GMT+7", () => {
    expect(buildScheduleNotices(base)).toEqual([{ tone: "info", text: "Giờ Việt Nam (GMT+7)." }]);
  });
  it("máy không GMT+7 → cảnh báo múi giờ", () => {
    const notices = buildScheduleNotices({ ...base, timezoneOffsetMinutes: 300 });
    expect(notices.some((n) => n.tone === "warning" && n.text.includes("không ở múi giờ GMT+7"))).toBe(true);
  });
  it("tin đang hiện trên web đổi sang tương lai → cảnh báo sẽ bị ẩn tới giờ đó", () => {
    const notices = buildScheduleNotices({ ...base, value: FUTURE });
    expect(notices).toContainEqual({ tone: "warning", text: "Tin đang hiện trên web sẽ bị ẩn tới 29/10/2026 09:30 (giờ Việt Nam)." });
  });
  it("tin đã lưu published nhưng publishedAt trống (đang hiện trên web) đổi sang tương lai → cảnh báo sẽ bị ẩn", () => {
    const notices = buildScheduleNotices({ ...base, savedPublishedAt: null, value: FUTURE });
    expect(notices).toContainEqual({ tone: "warning", text: "Tin đang hiện trên web sẽ bị ẩn tới 29/10/2026 09:30 (giờ Việt Nam)." });
  });
  it("tin chưa lưu / đã hẹn giờ sẵn, đặt tương lai → chỉ báo sẽ tự hiện (không cảnh báo ẩn)", () => {
    const fresh = buildScheduleNotices({ ...base, savedStatus: undefined, savedPublishedAt: null, value: FUTURE });
    expect(fresh.some((n) => n.tone === "warning")).toBe(false);
    expect(fresh).toContainEqual({ tone: "info", text: "Tin sẽ tự hiện trên web lúc 29/10/2026 09:30 (giờ Việt Nam)." });
    const already = buildScheduleNotices({ ...base, savedPublishedAt: FUTURE, value: FUTURE });
    expect(already.some((n) => n.tone === "warning")).toBe(false);
  });
  it("bản nháp đặt tương lai → báo khi xuất bản sẽ hiện từ giờ đó", () => {
    const notices = buildScheduleNotices({ ...base, savedStatus: "draft", status: "draft", savedPublishedAt: null, value: FUTURE });
    expect(notices).toContainEqual({ tone: "info", text: "Khi xuất bản, tin sẽ hiện trên web từ 29/10/2026 09:30 (giờ Việt Nam)." });
  });
});
