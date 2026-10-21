import type { BasePayload, Where } from "payload";
import { describe, expect, it, vi } from "vitest";

import { startOfVietnamDay } from "../careers/deadline";
import { jobPostingQuickFilterGroup, MAX_CATEGORY_CHIPS, resolveCollectionQuickFilterGroups } from "./collection-quick-filters";
import { currentChip, hasGroupCondition, withChip } from "./quick-filters";

const only = <T>(items: T[], index = 0): T => {
  const item = items[index];
  if (item === undefined) throw new Error(`missing item ${index}`);
  return item;
};

const fakePayload = (docs: Array<{ id: number; name: string }>) => {
  const find = vi.fn().mockResolvedValue({ docs });
  return { payload: { find } as unknown as BasePayload, find };
};

// 2026-10-21 05:00 giờ VN = 2026-10-20T22:00Z → đầu ngày VN = 2026-10-20T17:00:00.000Z
const NOW = new Date("2026-10-20T22:00:00.000Z");

describe("resolveCollectionQuickFilterGroups", () => {
  it("Dự án: Tình trạng mở bán (đủ 3 giá trị) + Trạng thái bài (Nháp/Xuất bản)", async () => {
    const groups = await resolveCollectionQuickFilterGroups({ collectionSlug: "projects", payload: fakePayload([]).payload });
    expect(groups.map((group) => group.label)).toEqual(["Tình trạng mở bán", "Trạng thái bài"]);
    expect(only(groups, 0).chips.map((chip) => chip.label)).toEqual(["Sắp mở bán", "Đang mở bán", "Đã bàn giao"]);
    expect(only(groups, 1).chips.map((chip) => chip.label)).toEqual(["Nháp", "Xuất bản"]);
  });

  it("Hồ sơ ứng tuyển: mọi trạng thái hồ sơ", async () => {
    const group = only(await resolveCollectionQuickFilterGroups({ collectionSlug: "job-applications", payload: fakePayload([]).payload }));
    expect(group.chips.map((chip) => chip.label)).toEqual(["Mới", "Đang xem xét", "Phỏng vấn", "Đã tuyển", "Từ chối"]);
  });

  it("Tin tức / Tin BĐS: danh mục lấy bằng Local API theo scope, sortOrder, quyền người xem, tối đa 12", async () => {
    const user = { id: 7 } as never;
    for (const [slug, scope] of [["news", "news"], ["property-posts", "property_post"]] as const) {
      const { payload, find } = fakePayload([{ id: 5, name: "Thị trường" }, { id: 6, name: "Pháp lý" }]);
      const groups = await resolveCollectionQuickFilterGroups({ collectionSlug: slug, payload, user });
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: "categories", where: { scope: { equals: scope } }, sort: "sortOrder", limit: MAX_CATEGORY_CHIPS, overrideAccess: false, user, locale: "vi" }));
      expect(groups.map((group) => group.label)).toEqual(["Trạng thái bài", "Danh mục"]);
      expect(only(groups, 1).chips.map((chip) => [chip.key, chip.label])).toEqual([["5", "Thị trường"], ["6", "Pháp lý"]]);
      expect(only(only(groups, 1).chips).conditions).toEqual([{ category: { equals: "5" } }]);
    }
  });

  it("danh mục rỗng → không có nhóm Danh mục; truy vấn giới hạn 12", async () => {
    const empty = await resolveCollectionQuickFilterGroups({ collectionSlug: "news", payload: fakePayload([]).payload });
    expect(empty.map((group) => group.label)).toEqual(["Trạng thái bài"]);
    const { payload, find } = fakePayload([{ id: 1, name: "D1" }]);
    await resolveCollectionQuickFilterGroups({ collectionSlug: "news", payload });
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ limit: MAX_CATEGORY_CHIPS }));
  });

  it("lỗi đọc danh mục → ghi log, bỏ nhóm Danh mục, không ném lỗi", async () => {
    const error = vi.fn();
    const payload = { find: vi.fn().mockRejectedValue(new Error("db down")), logger: { error } } as unknown as BasePayload;
    const groups = await resolveCollectionQuickFilterGroups({ collectionSlug: "news", payload });
    expect(groups.map((group) => group.label)).toEqual(["Trạng thái bài"]);
    expect(error).toHaveBeenCalledOnce();
  });

  it("collection khác (Lead, Cho thuê...) → không nhóm, không gọi Local API", async () => {
    const { payload, find } = fakePayload([]);
    expect(await resolveCollectionQuickFilterGroups({ collectionSlug: "leads", payload })).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it("Tuyển dụng dùng mốc đầu ngày giờ VN (tiêm now)", async () => {
    const group = only(await resolveCollectionQuickFilterGroups({ collectionSlug: "job-postings", payload: fakePayload([]).payload, now: NOW }));
    expect(startOfVietnamDay(NOW).toISOString()).toBe("2026-10-20T17:00:00.000Z");
    expect(only(group.chips.filter((chip) => chip.key === "open")).conditions).toEqual([{ status: { equals: "published" } }, { deadline: { greater_than_equal: "2026-10-20T17:00:00.000Z" } }]);
    expect(only(group.chips.filter((chip) => chip.key === "expired")).conditions).toEqual([{ deadline: { less_than: "2026-10-20T17:00:00.000Z" } }]);
  });
});

describe("chip nhóm mới ghép với where có sẵn", () => {
  const translationFilter: Where = { hasEnglish: { equals: "false" } };
  const search: Where = { title: { like: "abc" } };

  it("Danh mục: giữ Lọc dịch + tìm kiếm (AND), sáng đúng chip, đổi chip thay chứ không cộng dồn, bỏ chọn xoá", async () => {
    const group = only(await resolveCollectionQuickFilterGroups({ collectionSlug: "news", payload: fakePayload([{ id: 5, name: "A" }, { id: 6, name: "B" }]).payload }), 1);
    const chosen = withChip({ and: [translationFilter, search] }, group, "5");
    expect(currentChip(chosen, group)).toBe("5");
    const swapped = withChip(chosen, group, "6");
    expect(currentChip(swapped, group)).toBe("6");
    expect(JSON.stringify(swapped)).toContain("hasEnglish");
    expect(JSON.stringify(swapped)).toContain("abc");
    const cleared = withChip(swapped, group, "");
    expect(hasGroupCondition(cleared, group)).toBe(false);
    expect(JSON.stringify(cleared)).toContain("hasEnglish");
  });

  it("Tuyển dụng: Hết hạn thay cả status lẫn deadline của chip Đang tuyển", () => {
    const group = jobPostingQuickFilterGroup(NOW);
    const open = withChip(translationFilter, group, "open");
    expect(currentChip(open, group)).toBe("open");
    const expired = withChip(open, group, "expired");
    expect(currentChip(expired, group)).toBe("expired");
    expect(JSON.stringify(expired)).not.toContain("published");
    expect(JSON.stringify(expired)).toContain("hasEnglish");
    expect(currentChip(withChip(expired, group, ""), group)).toBe("");
  });

  it("Dự án: chip tình trạng mở bán và trạng thái bài độc lập nhau", async () => {
    const resolved = await resolveCollectionQuickFilterGroups({ collectionSlug: "projects", payload: fakePayload([]).payload });
    const sales = only(resolved, 0);
    const status = only(resolved, 1);
    const both = withChip(withChip(undefined, sales, "selling"), status, "published");
    expect(currentChip(both, sales)).toBe("selling");
    expect(currentChip(both, status)).toBe("published");
  });
});
