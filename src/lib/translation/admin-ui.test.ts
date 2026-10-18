import { describe, expect, it } from "vitest";

import { canRetranslate, currentTranslationFilter, retranslateMessage, TRANSLATION_FILTER_KEYS, TRANSLATION_FILTERS, withTranslationFilter } from "./admin-ui";

describe("bộ lọc trạng thái dịch", () => {
  it("có đủ 5 mục theo FR-ADM-18", () => {
    expect(TRANSLATION_FILTER_KEYS).toEqual(["none", "ai", "manual", "failed", "viChanged"]);
  });

  it("áp bộ lọc giữ điều kiện khác, thay điều kiện dịch cũ, và nhận lại đúng mục", () => {
    const base = { and: [{ status: { equals: "published" } }] };
    const failed = withTranslationFilter(base, "failed");
    expect(failed).toEqual({ and: [{ status: { equals: "published" } }, TRANSLATION_FILTERS.failed.condition] });
    expect(currentTranslationFilter(failed)).toBe("failed");
    const manual = withTranslationFilter(failed, "manual");
    expect(manual).toEqual({ and: [{ status: { equals: "published" } }, TRANSLATION_FILTERS.manual.condition] });
    expect(currentTranslationFilter(manual)).toBe("manual");
  });

  it("bỏ bộ lọc (rỗng) giữ điều kiện khác; where không có thì ra and rỗng", () => {
    const failed = withTranslationFilter({ status: { equals: "published" } }, "failed");
    expect(withTranslationFilter(failed, "")).toEqual({ and: [{ status: { equals: "published" } }] });
    expect(withTranslationFilter(undefined, "")).toEqual({ and: [] });
    expect(currentTranslationFilter(undefined)).toBe("");
  });

  it("bản Việt đổi sau khi sửa tay lọc theo cờ viChangedAfterManual", () => {
    expect(TRANSLATION_FILTERS.viChanged.condition).toEqual({ "translation.viChangedAfterManual": { equals: true } });
  });
});

describe("canRetranslate", () => {
  const sale = { id: "s1", role: "sale" };
  it("admin luôn thấy; sale chỉ với bài của mình và không với services/pages/global; khách không", () => {
    expect(canRetranslate({ id: "a", role: "admin" }, "pages", undefined)).toBe(true);
    expect(canRetranslate(sale, "news", "s1")).toBe(true);
    expect(canRetranslate(sale, "news", "s2")).toBe(false);
    expect(canRetranslate(sale, "news", undefined)).toBe(false);
    expect(canRetranslate(sale, "services", "s1")).toBe(false);
    expect(canRetranslate(sale, "pages", "s1")).toBe(false);
    expect(canRetranslate(sale, "globals", undefined)).toBe(false);
    expect(canRetranslate(null, "news", "s1")).toBe(false);
  });
});

describe("retranslateMessage", () => {
  it("thông báo theo mã", () => {
    expect(retranslateMessage(202, null)).toContain("xếp hàng");
    expect(retranslateMessage(429, "3600")).toContain("60 phút");
    expect(retranslateMessage(409, null)).toContain("đang tắt");
    expect(retranslateMessage(503, null)).toContain("chưa được cấu hình");
    expect(retranslateMessage(404, null)).toContain("không có quyền");
    expect(retranslateMessage(500, null)).toContain("Không thể");
  });
});
