import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { publicWhere } from "./public-queries";

describe("publicWhere", () => {
  const NEWS_NOW = "2026-10-28T03:00:00.000Z";
  const newsBase = [
    { status: { in: ["published"] } },
    { deletedAt: { exists: false } },
    { or: [{ publishedAt: { exists: false } }, { publishedAt: { less_than_equal: NEWS_NOW } }] },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NEWS_NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("news vi: published, chưa xoá mềm, publishedAt trống hoặc ≤ now (hẹn giờ BL-091), không đòi hasEnglish", () => {
    expect(publicWhere("news", "vi")).toEqual({ and: newsBase });
  });

  it("news en: thêm hasEnglish = true", () => {
    expect(publicWhere("news", "en")).toEqual({ and: [{ and: newsBase }, { hasEnglish: { equals: true } }] });
  });

  it("hẹn giờ CHỈ cho news: dự án / tin BĐS / tuyển dụng / cho thuê / dịch vụ / trang không có điều kiện publishedAt", () => {
    for (const slug of ["projects", "property-posts", "job-postings", "rentals", "services", "pages"]) {
      expect(JSON.stringify(publicWhere(slug, "vi"))).not.toContain("publishedAt");
    }
  });

  it("rentals: published và rented", () => {
    expect(JSON.stringify(publicWhere("rentals", "vi"))).toContain('"in":["published","rented"]');
  });

  it("property-posts: chỉ published (không có rented), en cần hasEnglish", () => {
    expect(publicWhere("property-posts", "vi")).toEqual({ and: [{ status: { in: ["published"] } }, { deletedAt: { exists: false } }] });
    expect(JSON.stringify(publicWhere("property-posts", "en"))).toContain("hasEnglish");
  });

  it("collection không có status (categories, developers): chỉ lọc xoá mềm, en vẫn đòi hasEnglish", () => {
    for (const slug of ["categories", "developers"]) {
      expect(publicWhere(slug, "vi")).toEqual({ deletedAt: { exists: false } });
      expect(publicWhere(slug, "en")).toEqual({
        and: [{ deletedAt: { exists: false } }, { hasEnglish: { equals: true } }],
      });
    }
  });
});
