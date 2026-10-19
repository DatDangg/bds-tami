import type { Where } from "payload";
import { describe, expect, it } from "vitest";

import { TRANSLATION_FILTERS, withTranslationFilter } from "@/lib/translation/admin-ui";

import { currentChip, type QuickFilterGroup, RENTAL_QUICK_FILTER_GROUPS, withChip } from "./quick-filters";

const [statusGroup, bedroomsGroup, priceGroup] = RENTAL_QUICK_FILTER_GROUPS as [QuickFilterGroup, QuickFilterGroup, QuickFilterGroup];
const published: Where = { status: { equals: "published" } };

// Nhóm kiểu Lead (T02): chip luôn thay `status`; riêng `new` thay thêm `assignedTo`.
const leadLike: QuickFilterGroup = {
  id: "lead",
  label: "Trạng thái",
  fields: ["status"],
  chips: [
    { key: "new", label: "Mới", replaces: ["status", "assignedTo"], conditions: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }] },
    { key: "consulting", label: "Đang tư vấn", conditions: [{ status: { in: ["contacted", "consulting"] } }] },
  ],
};

describe("withChip / currentChip", () => {
  it("where rỗng: thêm chip dạng { and }, chip sáng; bỏ chip → { and: [] }", () => {
    const next = withChip(undefined, statusGroup, "published");
    expect(next).toEqual({ and: [published] });
    expect(currentChip(next, statusGroup)).toBe("published");
    expect(withChip(next, statusGroup, "")).toEqual({ and: [] });
    expect(currentChip({ and: [] }, statusGroup)).toBe("");
    expect(currentChip(undefined, statusGroup)).toBe("");
  });

  it("giữ điều kiện khác và chip nhóm khác (AND giữa các nhóm)", () => {
    const base: Where = { and: [{ title: { like: "abc" } }] };
    const step2 = withChip(withChip(base, statusGroup, "published"), bedroomsGroup, "2");
    expect(step2).toEqual({ and: [{ title: { like: "abc" } }, published, { bedrooms: { equals: 2 } }] });
    expect(currentChip(step2, statusGroup)).toBe("published");
    expect(currentChip(step2, bedroomsGroup)).toBe("2");
    expect(currentChip(step2, priceGroup)).toBe("");
  });

  it("đổi chip trong nhóm: thay điều kiện cũ; chip giá 2 điều kiện", () => {
    const a = withChip(undefined, priceGroup, "10to20");
    expect(a).toEqual({ and: [{ priceMonthlyVnd: { greater_than_equal: 10_000_000 } }, { priceMonthlyVnd: { less_than: 20_000_000 } }] });
    expect(currentChip(a, priceGroup)).toBe("10to20");
    const b = withChip(a, priceGroup, "gt50");
    expect(b).toEqual({ and: [{ priceMonthlyVnd: { greater_than: 50_000_000 } }] });
    expect(currentChip(b, priceGroup)).toBe("gt50");
  });

  it("dạng or: ghép vào TỪNG nhánh, giữ dạng or; chỉ sáng khi mọi nhánh có chip", () => {
    const orWhere: Where = { or: [{ and: [{ title: { like: "a" } }] }, { and: [{ title: { like: "b" } }] }] };
    const next = withChip(orWhere, statusGroup, "rented");
    expect(next).toEqual({
      or: [
        { and: [{ title: { like: "a" } }, { status: { equals: "rented" } }] },
        { and: [{ title: { like: "b" } }, { status: { equals: "rented" } }] },
      ],
    });
    expect(currentChip(next, statusGroup)).toBe("rented");
    const partial: Where = { or: [{ and: [{ status: { equals: "rented" } }] }, { and: [{ title: { like: "b" } }] }] };
    expect(currentChip(partial, statusGroup)).toBe("");
    expect(withChip(next, statusGroup, "")).toEqual(orWhere);
  });

  it("kết hợp Lọc dịch: đổi chip giữ điều kiện dịch và ngược lại", () => {
    const chipFirst = withTranslationFilter(withChip(undefined, statusGroup, "draft"), "ai");
    expect(currentChip(chipFirst, statusGroup)).toBe("draft");
    const switched = withChip(chipFirst, statusGroup, "published");
    expect((switched as { and: Where[] }).and).toContainEqual(TRANSLATION_FILTERS.ai.condition);
    expect(currentChip(switched, statusGroup)).toBe("published");
    expect(currentChip(withTranslationFilter(switched, "manual"), statusGroup)).toBe("published");
  });

  it("bộ lọc tay cùng trường khác chip: chip không sáng; chọn chip thay bộ lọc tay (mọi toán tử)", () => {
    const manual: Where = { and: [{ priceMonthlyVnd: { greater_than_equal: 5_000_000 } }] };
    expect(currentChip(manual, priceGroup)).toBe("");
    expect(withChip(manual, priceGroup, "lt10")).toEqual({ and: [{ priceMonthlyVnd: { less_than: 10_000_000 } }] });
    expect(currentChip({ and: [{ priceMonthlyVnd: { less_than: 10_000_000 } }, { priceMonthlyVnd: { greater_than: 1 } }] }, priceGroup)).toBe("");
    expect(currentChip({ and: [{ status: { equals: "hidden" } }] }, statusGroup)).toBe("");
    expect(withChip(manual, priceGroup, "")).toEqual({ and: [] });
  });

  it("dạng chuỗi đọc lại từ URL (qs): số, boolean, mảng vẫn khớp", () => {
    const fromUrl: Where = { and: [{ bedrooms: { equals: "0" } }, { priceMonthlyVnd: { greater_than_equal: "10000000" } }, { priceMonthlyVnd: { less_than: "20000000" } }] };
    expect(currentChip(fromUrl, bedroomsGroup)).toBe("studio");
    expect(currentChip(fromUrl, priceGroup)).toBe("10to20");
    expect(currentChip({ and: [{ bedrooms: { greater_than_equal: "3" } }] }, bedroomsGroup)).toBe("3plus");
    expect(currentChip({ or: [{ and: [{ status: { in: ["consulting", "contacted"] } }] }] }, leadLike)).toBe("consulting");
    expect(currentChip({ and: [{ status: { in: "contacted" } }] }, leadLike)).toBe("");
    expect(currentChip({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: "false" } }] }, leadLike)).toBe("new");
  });

  it("replaces theo chip (Lead): rời chip Mới chỉ bỏ assignedTo chưa có, giữ Sale phụ trách tay", () => {
    const manualAssignee: Where = { assignedTo: { equals: "7" } };
    const fresh = withChip({ and: [manualAssignee] }, leadLike, "new");
    expect(fresh).toEqual({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }] });
    const leaveNew = withChip({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }, { title: { like: "x" } }] }, leadLike, "consulting");
    expect(leaveNew).toEqual({ and: [{ title: { like: "x" } }, { status: { in: ["contacted", "consulting"] } }] });
    const keepManual = withChip({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }, manualAssignee] }, leadLike, "consulting");
    expect(keepManual).toEqual({ and: [manualAssignee, { status: { in: ["contacted", "consulting"] } }] });
    expect(withChip(fresh, leadLike, "")).toEqual({ and: [] });
    // Có Sale phụ trách tay cùng chip Mới: chip Mới không sáng (thừa điều kiện trên trường nó thay), chip khác thì sáng.
    expect(currentChip({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }, manualAssignee] }, leadLike)).toBe("");
    expect(currentChip({ and: [{ status: { in: ["contacted", "consulting"] } }, manualAssignee] }, leadLike)).toBe("consulting");
  });
});
