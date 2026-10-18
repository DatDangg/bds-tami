import { describe, expect, it } from "vitest";

import { assertTranslatable, TRANSLATABLE_COLLECTIONS } from "./allowlist";

describe("allowlist dịch", () => {
  it("cho dịch tin tức công khai (news)", () => {
    expect(TRANSLATABLE_COLLECTIONS).toContain("news");
    expect(() => assertTranslatable({ kind: "collection", slug: "news" })).not.toThrow();
  });

  it("cho dịch global trang chủ (G12) và vẫn chặn global không có trong danh sách", () => {
    expect(() => assertTranslatable({ kind: "global", slug: "homepage" })).not.toThrow();
    expect(() => assertTranslatable({ kind: "global", slug: "leads-settings" })).toThrow();
  });

  it("từ chối collection nội bộ (leads)", () => {
    expect(() => assertTranslatable({ kind: "collection", slug: "leads" })).toThrow();
  });
});
