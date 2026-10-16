import { describe, expect, it } from "vitest";

import { bucketClickEvents, clickRetentionCutoff, clickStatsDay, NO_REF } from "./aggregate";

describe("clickStatsDay (ngày theo giờ Việt Nam)", () => {
  it("23:30 UTC đã sang ngày hôm sau ở Việt Nam", () => {
    expect(clickStatsDay(new Date("2026-10-15T23:30:00.000Z")).toISOString()).toBe("2026-10-16T00:00:00.000Z");
  });

  it("16:59 UTC vẫn là cùng ngày, 17:00 UTC (00:00 VN) là ngày kế", () => {
    expect(clickStatsDay(new Date("2026-10-16T16:59:59.999Z")).toISOString()).toBe("2026-10-16T00:00:00.000Z");
    expect(clickStatsDay(new Date("2026-10-16T17:00:00.000Z")).toISOString()).toBe("2026-10-17T00:00:00.000Z");
  });
});

describe("clickRetentionCutoff (90 ngày)", () => {
  it("lùi đúng 90 ngày so với thời điểm chạy", () => {
    expect(clickRetentionCutoff(new Date("2026-10-16T10:00:00.000Z")).toISOString()).toBe("2026-07-18T10:00:00.000Z");
  });
});

describe("bucketClickEvents", () => {
  const at = "2026-10-16T03:00:00.000Z";

  it("3 lượt bấm cùng ngày/loại/không gắn bản ghi gộp thành 1 dòng count 3", () => {
    const buckets = bucketClickEvents([
      { type: "zalo", createdAt: at },
      { type: "zalo", createdAt: "2026-10-16T05:00:00.000Z", refCollection: null, refId: null },
      { type: "zalo", createdAt: new Date("2026-10-16T09:00:00.000Z"), refCollection: undefined },
    ]);
    expect(buckets).toEqual([
      { date: new Date("2026-10-16T00:00:00.000Z"), type: "zalo", refCollection: NO_REF, refId: NO_REF, count: 3 },
    ]);
  });

  it("tách dòng theo loại, bản ghi tham chiếu và ngày", () => {
    const buckets = bucketClickEvents([
      { type: "zalo", createdAt: at },
      { type: "hotline", createdAt: at },
      { type: "zalo", createdAt: at, refCollection: "rentals", refId: "r1" },
      { type: "zalo", createdAt: at, refCollection: "rentals", refId: "r1" },
      { type: "zalo", createdAt: "2026-10-17T03:00:00.000Z" },
    ]);
    expect(buckets.map((b) => [b.type, b.refCollection, b.refId, b.date.toISOString().slice(0, 10), b.count])).toEqual([
      ["zalo", "", "", "2026-10-16", 1],
      ["hotline", "", "", "2026-10-16", 1],
      ["zalo", "rentals", "r1", "2026-10-16", 2],
      ["zalo", "", "", "2026-10-17", 1],
    ]);
  });

  it("danh sách rỗng không sinh dòng nào", () => {
    expect(bucketClickEvents([])).toEqual([]);
  });
});
