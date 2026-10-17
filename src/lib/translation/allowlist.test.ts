import { describe, expect, it } from "vitest";

import { assertTranslatable, TRANSLATABLE_COLLECTIONS } from "./allowlist";

describe("allowlist dịch", () => {
  it("cho dịch tin tức công khai (news)", () => {
    expect(TRANSLATABLE_COLLECTIONS).toContain("news");
    expect(() => assertTranslatable({ kind: "collection", slug: "news" })).not.toThrow();
  });

  it("từ chối collection nội bộ (leads)", () => {
    expect(() => assertTranslatable({ kind: "collection", slug: "leads" })).toThrow();
  });
});
