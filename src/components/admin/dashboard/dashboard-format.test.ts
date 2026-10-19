import { describe, expect, it } from "vitest";

import { formatToday, greetingFor, relativeTimeVi } from "./dashboard-format";

// 2026-10-19 là Thứ Hai. Giờ Việt Nam = UTC+7.
const at = (utc: string) => new Date(utc);

describe("greetingFor (Asia/Ho_Chi_Minh)", () => {
  it.each([
    ["2026-10-19T00:30:00Z", "Chào buổi sáng"], // 07:30
    ["2026-10-18T22:00:00Z", "Chào buổi sáng"], // 05:00
    ["2026-10-18T21:59:00Z", "Chào buổi tối"], // 04:59
    ["2026-10-19T04:59:00Z", "Chào buổi sáng"], // 11:59
    ["2026-10-19T05:00:00Z", "Chào buổi chiều"], // 12:00
    ["2026-10-19T10:59:00Z", "Chào buổi chiều"], // 17:59
    ["2026-10-19T11:00:00Z", "Chào buổi tối"], // 18:00
    ["2026-10-19T17:30:00Z", "Chào buổi tối"], // 00:30 ngày sau
  ])("%s -> %s", (utc, expected) => {
    expect(greetingFor(at(utc))).toBe(expected);
  });
});

describe("formatToday", () => {
  it("ngày theo múi giờ Việt Nam, dd/mm/yyyy", () => {
    expect(formatToday(at("2026-10-19T03:00:00Z"))).toBe("Thứ Hai, 19/10/2026");
    // 20:00 UTC ngày 19 đã là 03:00 ngày 20 ở Việt Nam.
    expect(formatToday(at("2026-10-19T20:00:00Z"))).toBe("Thứ Ba, 20/10/2026");
  });
});

describe("relativeTimeVi", () => {
  const now = at("2026-10-19T12:00:00Z");
  it.each([
    ["2026-10-19T11:59:40Z", "vừa xong"],
    ["2026-10-19T11:52:00Z", "8 phút trước"],
    ["2026-10-19T09:00:00Z", "3 giờ trước"],
    ["2026-10-18T09:00:00Z", "hôm qua"],
    ["2026-10-16T12:00:00Z", "3 ngày trước"],
  ])("%s -> %s", (value, expected) => {
    expect(relativeTimeVi(value, now)).toBe(expected);
  });

  it("quá 30 ngày in ngày; giá trị rỗng/sai -> rỗng", () => {
    expect(relativeTimeVi("2026-08-01T00:00:00Z", now)).toMatch(/0?1\/0?8\/2026/);
    expect(relativeTimeVi(null, now)).toBe("");
    expect(relativeTimeVi("không phải ngày", now)).toBe("");
  });
});
