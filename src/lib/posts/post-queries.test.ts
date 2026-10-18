import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PropertyPost } from "../../payload-types";

const findPublicList = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("../content/public-queries", () => ({ findPublicList, findPublicBySlug: vi.fn() }));

import { listPublicPosts, POST_PAGE_SIZE } from "./post-queries";

const NOW = new Date("2026-10-18T03:00:00.000Z");
const payload = {} as Payload;
const doc = (id: string) => ({ id }) as PropertyPost;
const result = (ids: string[], totalDocs: number) => ({
  docs: ids.map(doc),
  totalDocs,
  totalPages: totalDocs === 0 ? 0 : Math.ceil(totalDocs / POST_PAGE_SIZE),
});

/** Giả lập hai nhóm: trả theo điều kiện `offer.endAt` có trong `where` (nhóm đã kết thúc có `exists: true`). */
function stubGroups(active: { ids: string[]; total: number }, ended: { ids: string[]; total: number }) {
  findPublicList.mockImplementation(async (...args: unknown[]) => {
    const options = args[3];
    const where = JSON.stringify((options as { where: unknown }).where);
    const group = where.includes('"exists":true') ? ended : active;
    return result(group.ids, group.total);
  });
}

beforeEach(() => {
  findPublicList.mockReset();
});

describe("listPublicPosts: bài còn hạn trước, đã kết thúc sau", () => {
  it("trang 1: bài còn hạn; totalPages gồm cả hai nhóm", async () => {
    stubGroups({ ids: ["a1", "a2"], total: 2 }, { ids: ["e1"], total: 1 });
    expect(await listPublicPosts(payload, "vi", { page: 1, now: NOW })).toEqual({ docs: [doc("a1"), doc("a2")], totalPages: 2, isEmpty: false });
  });

  it("trang kế (sau hết nhóm còn hạn): bài đã kết thúc, tái dùng trang đầu của nhóm đó (không truy vấn lại)", async () => {
    stubGroups({ ids: [], total: 2 }, { ids: ["e1"], total: 1 });
    const page = await listPublicPosts(payload, "vi", { page: 2, now: NOW });
    expect(page.docs).toEqual([doc("e1")]);
    expect(findPublicList).toHaveBeenCalledTimes(2);
  });

  it("không có bài còn hạn: trang 1 là bài đã kết thúc; không có gì → trống, totalPages tối thiểu 1", async () => {
    stubGroups({ ids: [], total: 0 }, { ids: ["e1"], total: 1 });
    expect((await listPublicPosts(payload, "vi", { page: 1, now: NOW })).docs).toEqual([doc("e1")]);
    stubGroups({ ids: [], total: 0 }, { ids: [], total: 0 });
    expect(await listPublicPosts(payload, "vi", { page: 1, now: NOW })).toEqual({ docs: [], totalPages: 1, isEmpty: true });
  });

  it("trang vượt tổng → rỗng (để trang gọi notFound); loại id nổi bật và lọc danh mục ở cả hai nhóm", async () => {
    stubGroups({ ids: [], total: 1 }, { ids: [], total: 1 });
    expect((await listPublicPosts(payload, "vi", { page: 9, now: NOW, categoryIds: ["c1"], excludeIds: ["f1"] })).docs).toEqual([]);
    for (const call of findPublicList.mock.calls) {
      const where = JSON.stringify((call[3] as { where: unknown }).where);
      expect(where).toContain('"category":{"in":["c1"]}');
      expect(where).toContain('"id":{"not_in":["f1"]}');
    }
  });
});
