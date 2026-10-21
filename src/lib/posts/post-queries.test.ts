import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PropertyPost } from "../../payload-types";

const findPublicList = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("../content/public-queries", () => ({ findPublicList, findPublicBySlug: vi.fn() }));

import { findRelatedPosts, POST_PAGE_SIZE, RELATED_POSTS_COUNT } from "./post-queries";

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

describe("findRelatedPosts: đủ 3 thẻ (S09)", () => {
  const current = { id: "cur", category: "c1" };

  it("đủ 3 bài còn hạn: chỉ lấy bài còn hạn, không truy vấn nhóm đã kết thúc", async () => {
    stubGroups({ ids: ["a1", "a2", "a3", "a4"], total: 4 }, { ids: ["e1"], total: 1 });
    const docs = await findRelatedPosts(payload, "vi", current, NOW);
    expect(docs).toEqual([doc("a1"), doc("a2"), doc("a3")]);
    expect(findPublicList).toHaveBeenCalledTimes(1);
  });

  it("còn 1-2 bài còn hạn: lấy bù bài đã kết thúc cho đủ 3, bài còn hạn đứng trước", async () => {
    stubGroups({ ids: ["a1"], total: 1 }, { ids: ["e1", "e2", "e3"], total: 3 });
    expect(await findRelatedPosts(payload, "vi", current, NOW)).toEqual([doc("a1"), doc("e1"), doc("e2")]);
  });

  it("không có bài còn hạn: lấy bài đã kết thúc; thiếu danh mục thì không có gợi ý; lọc đúng danh mục và loại bài hiện tại", async () => {
    stubGroups({ ids: [], total: 0 }, { ids: ["e1"], total: 1 });
    expect(await findRelatedPosts(payload, "vi", current, NOW)).toEqual([doc("e1")]);
    for (const call of findPublicList.mock.calls) {
      const where = JSON.stringify((call[3] as { where: unknown }).where);
      expect(where).toContain('"category":{"in":["c1"]}');
      expect(where).toContain('"id":{"not_in":["cur"]}');
    }
    findPublicList.mockClear();
    expect(await findRelatedPosts(payload, "vi", { id: "cur", category: null }, NOW)).toEqual([]);
    expect(findPublicList).not.toHaveBeenCalled();
    expect(RELATED_POSTS_COUNT).toBe(3);
  });
});
