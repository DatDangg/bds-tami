import { describe, expect, it } from "vitest";

import { businessMinutesBetween, isBusinessHour } from "./business-hours";

/** Giờ VN (UTC+7) -> Date. Ngày mẫu: 2026-10-19 là thứ 2, 2026-10-24 là thứ 7, 2026-10-25 là Chủ nhật. */
const vn = (day: number, hhmm: string) => new Date(`2026-10-${String(day).padStart(2, "0")}T${hhmm}:00+07:00`);

describe("businessMinutesBetween (giờ hành chính 08:00–17:30, T2–T7, giờ VN)", () => {
  it("trong giờ làm: đếm đúng số phút", () => {
    expect(businessMinutesBetween(vn(19, "09:00"), vn(19, "09:30"))).toBe(30);
    expect(businessMinutesBetween(vn(19, "08:00"), vn(19, "17:30"))).toBe(570);
  });

  it("trước 08:00: đếm từ đầu giờ làm", () => {
    expect(businessMinutesBetween(vn(19, "06:00"), vn(19, "08:10"))).toBe(10);
    expect(businessMinutesBetween(vn(19, "06:00"), vn(19, "07:59"))).toBe(0);
  });

  it("sau 17:30: không đếm, rồi đếm tiếp từ 08:00 hôm sau", () => {
    expect(businessMinutesBetween(vn(19, "17:20"), vn(19, "23:00"))).toBe(10);
    expect(businessMinutesBetween(vn(19, "18:00"), vn(19, "23:00"))).toBe(0);
    expect(businessMinutesBetween(vn(19, "17:20"), vn(20, "08:05"))).toBe(15);
  });

  it("qua đêm: chỉ tính phần còn lại của chiều hôm trước (đêm không đếm)", () => {
    expect(businessMinutesBetween(vn(19, "17:00"), vn(20, "08:00"))).toBe(30);
    expect(businessMinutesBetween(vn(19, "17:15"), vn(20, "08:00"))).toBe(15);
  });

  it("tối thứ 7 -> sáng thứ 2: bỏ Chủ nhật", () => {
    expect(businessMinutesBetween(vn(24, "20:00"), vn(26, "08:20"))).toBe(20);
    expect(businessMinutesBetween(vn(24, "17:30"), vn(26, "08:00"))).toBe(0);
  });

  it("thứ 7 là ngày làm việc", () => {
    expect(businessMinutesBetween(vn(24, "10:00"), vn(24, "10:45"))).toBe(45);
  });

  it("Chủ nhật: không đếm phút nào", () => {
    expect(businessMinutesBetween(vn(25, "00:00"), vn(25, "23:59"))).toBe(0);
    expect(businessMinutesBetween(vn(25, "10:00"), vn(26, "08:30"))).toBe(30);
  });

  it("nhiều ngày: cộng đủ từng ngày làm việc (T6 15:30 -> T2... qua T7, bỏ CN)", () => {
    // T6 23/10 15:30 -> 17:30 = 120; T7 = 570; CN = 0; T2 26/10 08:00 -> 08:30 = 30
    expect(businessMinutesBetween(vn(23, "15:30"), vn(26, "08:30"))).toBe(120 + 570 + 30);
  });

  it("to <= from: 0", () => {
    expect(businessMinutesBetween(vn(19, "10:00"), vn(19, "10:00"))).toBe(0);
    expect(businessMinutesBetween(vn(19, "11:00"), vn(19, "10:00"))).toBe(0);
  });

  it("không phụ thuộc múi giờ máy chạy: cùng mốc UTC cho cùng kết quả", () => {
    // 02:00Z = 09:00 VN thứ 2
    expect(businessMinutesBetween(new Date("2026-10-19T02:00:00Z"), new Date("2026-10-19T02:30:00Z"))).toBe(30);
  });
});

describe("isBusinessHour", () => {
  it("08:00 vào giờ làm, 17:30 hết giờ (nửa khoảng mở)", () => {
    expect(isBusinessHour(vn(19, "08:00"))).toBe(true);
    expect(isBusinessHour(vn(19, "17:29"))).toBe(true);
    expect(isBusinessHour(vn(19, "17:30"))).toBe(false);
    expect(isBusinessHour(vn(19, "07:59"))).toBe(false);
  });

  it("thứ 7 có, Chủ nhật không", () => {
    expect(isBusinessHour(vn(24, "10:00"))).toBe(true);
    expect(isBusinessHour(vn(25, "10:00"))).toBe(false);
  });
});
