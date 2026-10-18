import { describe, expect, it } from "vitest";

import { DEDUPE_CLOSED_STATUSES, DEDUPE_WINDOW_MS, dedupeCutoff, dedupeLockKey, duplicateLeadWhere, type DedupeKey } from "./dedupe";

const NOW = new Date("2026-10-18T03:00:00.000Z");
const SOURCE_ID = "7f1c0f0e-2b0a-4c53-9d0e-2d6e1f0a9b11";
const rentalKey: DedupeKey = { phoneNormalized: "+84901234567", source: "rental", sourceId: SOURCE_ID };

describe("dedupe (BR-15)", () => {
  it("cửa sổ chống trùng đúng 7 ngày tính từ lúc gửi", () => {
    expect(DEDUPE_WINDOW_MS).toBe(7 * 24 * 3600 * 1000);
    expect(dedupeCutoff(NOW).toISOString()).toBe("2026-10-11T03:00:00.000Z");
  });

  it("điều kiện tìm trùng: SĐT chuẩn hoá + nguồn + bản ghi nguồn + còn mở + trong 7 ngày", () => {
    expect(duplicateLeadWhere(rentalKey, NOW)).toEqual({
      and: [
        { phoneNormalized: { equals: "+84901234567" } },
        { source: { equals: "rental" } },
        { status: { not_in: ["won", "lost", "spam"] } },
        { createdAt: { greater_than_equal: "2026-10-11T03:00:00.000Z" } },
        { rental: { equals: SOURCE_ID } },
      ],
    });
  });

  it("mỗi nguồn dùng đúng trường quan hệ; contact không có bản ghi nguồn", () => {
    const refOf = (key: DedupeKey) => JSON.stringify(duplicateLeadWhere(key, NOW));
    expect(refOf({ ...rentalKey, source: "property_post" })).toContain('"propertyPost":{"equals"');
    expect(refOf({ ...rentalKey, source: "project" })).toContain('"project":{"equals"');
    const contact = refOf({ phoneNormalized: rentalKey.phoneNormalized, source: "contact", sourceId: null });
    expect(contact).not.toMatch(/rental|propertyPost|"project"/);
  });

  it("won/lost/spam là vụ việc đã đóng", () => {
    expect([...DEDUPE_CLOSED_STATUSES]).toEqual(["won", "lost", "spam"]);
  });

  it("khoá advisory ổn định theo (SĐT, nguồn, bản ghi), khác nhau khi đổi bất kỳ thành phần nào, là số nguyên 64-bit và không chứa SĐT", () => {
    const key = dedupeLockKey(rentalKey);
    expect(dedupeLockKey({ ...rentalKey })).toBe(key);
    for (const other of [
      { ...rentalKey, phoneNormalized: "+84901234568" },
      { ...rentalKey, source: "project" as const },
      { ...rentalKey, sourceId: "11111111-2222-4333-8444-555555555555" },
    ]) {
      expect(dedupeLockKey(other)).not.toBe(key);
    }
    expect(key).toMatch(/^-?\d{1,19}$/);
    expect(BigInt(key)).toBeLessThanOrEqual(2n ** 63n - 1n);
    expect(key).not.toContain("84901234567");
  });
});
