import { describe, expect, it } from "vitest";

import { TRANSLATABLE_COLLECTIONS } from "../../lib/translation/allowlist";
import { composeSearchText } from "./build-search-text";
import { validateVideoUrl } from "./field-validators";
import { formatRentalCode } from "./generate-code";
import { stampRentedAt } from "./stamp-rented-at";

describe("formatRentalCode", () => {
  it.each([
    [1, "CT-000001"],
    ["123", "CT-000123"],
    [999_999, "CT-999999"],
    [1_234_567, "CT-1234567"],
  ])("%j -> %s", (input, expected) => {
    expect(formatRentalCode(input)).toBe(expected);
  });
});

describe("composeSearchText", () => {
  it("nối các phần, bỏ phần rỗng, bỏ dấu, chữ thường, gộp khoảng trắng", () => {
    expect(composeSearchText(["CT-000007", "Căn hộ  Đồng Khởi", "", null, undefined, "Phường Bến Nghé, Quận 1"])).toBe(
      "ct-000007 can ho dong khoi phuong ben nghe, quan 1",
    );
  });
});

describe("stampRentedAt", () => {
  const run = (args: { status?: string; originalStatus?: string; stored?: string }) =>
    stampRentedAt({
      value: undefined,
      previousValue: args.stored,
      data: args.status ? { status: args.status } : {},
      originalDoc: args.originalStatus ? { status: args.originalStatus } : undefined,
    } as never);

  it("chuyển sang rented thì gán mốc mới", () => {
    expect(typeof run({ status: "rented", originalStatus: "published" })).toBe("string");
  });
  it("đang rented mà lưu lại thì giữ mốc cũ", () => {
    expect(run({ originalStatus: "rented", stored: "2026-01-01T00:00:00.000Z" })).toBe("2026-01-01T00:00:00.000Z");
  });
  it("không phải rented thì không có mốc", () => {
    expect(run({ status: "published", originalStatus: "rented", stored: "2026-01-01T00:00:00.000Z" })).toBeNull();
    expect(run({ status: "draft" })).toBeNull();
  });
});

describe("validateVideoUrl", () => {
  const validate = (value: string | null | undefined) => validateVideoUrl(value as never, {} as never);
  it("nhận https YouTube / TikTok (kể cả tên miền con) và giá trị trống", () => {
    for (const ok of ["https://www.youtube.com/watch?v=1", "https://youtu.be/abc", "https://vm.tiktok.com/xyz", "", null, undefined]) {
      expect(validate(ok)).toBe(true);
    }
  });
  it("từ chối http, giao thức lạ, máy chủ lạ và máy chủ chỉ giống tên", () => {
    for (const bad of ["http://youtube.com/x", "javascript:alert(1)", "https://example.com/v", "https://evilyoutube.com/v", "https://youtube.com.evil.com/v", "không phải url"]) {
      expect(validate(bad)).not.toBe(true);
    }
  });
});

describe("allowlist dịch", () => {
  it("rentals nằm trong danh sách collection được dịch (G12)", () => {
    expect(TRANSLATABLE_COLLECTIONS).toContain("rentals");
  });
});
