import { describe, expect, it } from "vitest";

import { publicWhere } from "./public-queries";

describe("publicWhere", () => {
  it("vi: chỉ published và chưa xoá mềm, không đòi hasEnglish", () => {
    expect(publicWhere("news", "vi")).toEqual({
      and: [{ status: { in: ["published"] } }, { deletedAt: { exists: false } }],
    });
  });

  it("en: thêm hasEnglish = true", () => {
    expect(publicWhere("news", "en")).toEqual({
      and: [
        { and: [{ status: { in: ["published"] } }, { deletedAt: { exists: false } }] },
        { hasEnglish: { equals: true } },
      ],
    });
  });

  it("rentals: published và rented", () => {
    expect(JSON.stringify(publicWhere("rentals", "vi"))).toContain('"in":["published","rented"]');
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
