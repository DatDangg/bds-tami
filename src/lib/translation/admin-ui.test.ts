import { describe, expect, it } from "vitest";
import type { Where } from "payload";

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

  describe("where dạng { or: [{ and }] } của WhereBuilder", () => {
    const status = { status: { equals: "published" } };
    const price = { price: { greater_than_equal: 50000000 } };
    const cond = (key: "failed" | "manual" | "ai") => TRANSLATION_FILTERS[key].condition;

    it("1 nhánh: chọn, đổi, bỏ mục dịch đều giữ mọi điều kiện khác", () => {
      const base = { or: [{ and: [status, price] }] };
      const failed = withTranslationFilter(base, "failed");
      expect(failed).toEqual({ or: [{ and: [status, price, cond("failed")] }] });
      expect(currentTranslationFilter(failed)).toBe("failed");
      const manual = withTranslationFilter(failed, "manual");
      expect(manual).toEqual({ or: [{ and: [status, price, cond("manual")] }] });
      expect(currentTranslationFilter(manual)).toBe("manual");
      expect(withTranslationFilter(manual, "")).toEqual({ or: [{ and: [status, price] }] });
    });

    it("nhiều nhánh: áp/đổi/bỏ trên từng nhánh, không mất nhánh", () => {
      const base = { or: [{ and: [status] }, { and: [price] }] };
      const failed = withTranslationFilter(base, "failed");
      expect(failed).toEqual({ or: [{ and: [status, cond("failed")] }, { and: [price, cond("failed")] }] });
      expect(currentTranslationFilter(failed)).toBe("failed");
      const ai = withTranslationFilter(failed, "ai");
      expect(ai).toEqual({ or: [{ and: [status, cond("ai")] }, { and: [price, cond("ai")] }] });
      expect(withTranslationFilter(ai, "")).toEqual(base);
    });

    it("chỉ nhận mục đang chọn khi mọi nhánh đều có điều kiện đó", () => {
      const partial = { or: [{ and: [status, cond("failed")] }, { and: [price] }] };
      expect(currentTranslationFilter(partial)).toBe("");
    });

    it("điều kiện phẳng không bọc and vẫn nhận ra mục", () => {
      expect(currentTranslationFilter(cond("manual"))).toBe("manual");
      expect(currentTranslationFilter({ or: [cond("ai")] })).toBe("ai");
    });
  });

  it("where lồng do bản cũ sinh ra ({ and: [{ or }, điều kiện dịch] }) giữ cụm or, chỉ thay điều kiện dịch", () => {
    const group: Where = { or: [{ and: [{ status: { equals: "published" } }, { price: { greater_than_equal: 50_000_000 } }] }] };
    const legacy: Where = { and: [group, TRANSLATION_FILTERS.ai.condition] };
    expect(currentTranslationFilter(legacy)).toBe("ai");
    expect(withTranslationFilter(legacy, "failed")).toEqual({ and: [group, TRANSLATION_FILTERS.failed.condition] });
    expect(withTranslationFilter(legacy, "")).toEqual({ and: [group] });
  });

  it("cụm lồng có điều kiện dịch lẫn điều kiện khác không bị bỏ cả cụm", () => {
    const mixed = { or: [{ status: { equals: "draft" } }, TRANSLATION_FILTERS.none.condition] };
    expect(withTranslationFilter({ and: [mixed] }, "ai")).toEqual({ and: [mixed, TRANSLATION_FILTERS.ai.condition] });
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
