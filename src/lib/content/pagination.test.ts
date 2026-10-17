import { describe, expect, it } from "vitest";

import { DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE, parsePagination } from "./pagination";

describe("parsePagination", () => {
  it("thiếu tham số: trang 1, cỡ mặc định", () => {
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    expect(parsePagination(null, null, 24)).toEqual({ page: 1, limit: 24 });
  });

  it("nhận chuỗi số nguyên dương từ URL và số", () => {
    expect(parsePagination("3", "20")).toEqual({ page: 3, limit: 20 });
    expect(parsePagination(4, 8)).toEqual({ page: 4, limit: 8 });
  });

  it.each(["-1", "0", "abc", "", " 5", "2.5", "1e9", "0x10", "NaN", "Infinity", "+3", "١٢"])(
    "giá trị sai %j rơi về mặc định",
    (bad) => {
      expect(parsePagination(bad, bad)).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    },
  );

  it("số âm, 0, NaN, Infinity, số thực dạng number rơi về mặc định", () => {
    for (const bad of [-5, 0, Number.NaN, Number.POSITIVE_INFINITY, 1.5, Number.MAX_SAFE_INTEGER + 2]) {
      expect(parsePagination(bad, bad)).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    }
  });

  it("`?page=1&page=2` (mảng) không bị coi là số", () => {
    expect(parsePagination(["1", "2"], ["5", "6"])).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
  });

  it("giá trị quá lớn bị kẹp (không quét OFFSET khổng lồ, không lấy cả bảng)", () => {
    expect(parsePagination("99999999", "100000")).toEqual({ page: MAX_PAGE, limit: MAX_PAGE_SIZE });
    expect(parsePagination("9".repeat(40), "9".repeat(40))).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    expect(parsePagination(MAX_PAGE + 1, MAX_PAGE_SIZE + 1)).toEqual({ page: MAX_PAGE, limit: MAX_PAGE_SIZE });
  });
});
