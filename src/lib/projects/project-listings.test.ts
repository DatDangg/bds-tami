import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";
import { findProjectListings, PROJECT_LISTINGS_PER_GROUP } from "./project-listings";

type FindArgs = { collection: string; where?: unknown; limit?: number; locale?: string; overrideAccess?: boolean; sort?: unknown; select?: Record<string, unknown> };

function fakePayload(docsByCollection: Record<string, unknown[]> = {}) {
  const find = vi.fn(async (args: FindArgs) => {
    const docs = docsByCollection[args.collection] ?? [];
    return { docs, page: 1, limit: args.limit ?? 10, totalDocs: docs.length, totalPages: 1, hasNextPage: false, hasPrevPage: false };
  });
  return { payload: { find } as unknown as Payload, find };
}

const now = new Date("2026-10-20T00:00:00.000Z");
const call = (find: ReturnType<typeof fakePayload>["find"], collection: string) => find.mock.calls.map(([args]) => args as FindArgs).find((args) => args.collection === collection)!;
const flat = (value: unknown) => JSON.stringify(value);

describe("findProjectListings", () => {
  it("hai truy vấn song song (cho thuê + tin BĐS), mỗi nhóm ≤ 4, lọc theo dự án, chỉ công khai, như khách", async () => {
    const { payload, find } = fakePayload();
    const result = await findProjectListings(payload, "vi", "prj1", now);
    expect(result).toEqual({ rentals: [], posts: [] });
    // Nhóm rỗng thì không có truy vấn ảnh nối thêm: đúng 2 truy vấn mỗi lần dựng trang.
    expect(find).toHaveBeenCalledTimes(2);
    const rentals = call(find, "rentals");
    const posts = call(find, "property-posts");
    expect(rentals.limit).toBe(PROJECT_LISTINGS_PER_GROUP);
    expect(posts.limit).toBe(PROJECT_LISTINGS_PER_GROUP);
    expect(PROJECT_LISTINGS_PER_GROUP).toBe(4);
    expect(flat(rentals.where)).toContain('{"project":{"equals":"prj1"}}');
    expect(flat(rentals.where)).toContain('{"status":{"equals":"published"}}');
    expect(flat(rentals.where)).toContain("deletedAt");
    expect(flat(posts.where)).toContain('{"relatedProject":{"equals":"prj1"}}');
    expect(flat(posts.where)).toContain("deletedAt");
    expect(flat(posts.where)).toContain("offer");
    for (const args of [rentals, posts]) {
      expect(args.overrideAccess).toBe(false);
      expect(args.locale).toBe("vi");
      expect(args.sort).toEqual(["-publishedAt", "-createdAt"]);
    }
  });

  it("/en: chỉ tin có bản EN (hasEnglish) ở cả hai nhóm", async () => {
    const { payload, find } = fakePayload();
    await findProjectListings(payload, "en", "prj1", now);
    expect(flat(call(find, "rentals").where)).toContain('{"hasEnglish":{"equals":true}}');
    expect(flat(call(find, "property-posts").where)).toContain('{"hasEnglish":{"equals":true}}');
    expect(call(find, "rentals").locale).toBe("en");
  });

  it("vi không lọc hasEnglish; thẻ chỉ chọn trường cần (không lấy mô tả/nội dung dài)", async () => {
    const { payload, find } = fakePayload();
    await findProjectListings(payload, "vi", "prj1", now);
    expect(flat(call(find, "rentals").where)).not.toContain("hasEnglish");
    expect(call(find, "rentals").select).not.toHaveProperty("description");
    expect(call(find, "property-posts").select).not.toHaveProperty("content");
  });

  it("có tin cho thuê → ảnh thẻ lấy gộp (không theo từng tin: không N+1)", async () => {
    const rentals = [1, 2, 3, 4].map((n) => ({ id: `r${n}`, title: `Tin ${n}`, slug: `tin-${n}` }));
    const { payload, find } = fakePayload({ rentals });
    const result = await findProjectListings(payload, "vi", "prj1", now);
    expect(result.rentals).toHaveLength(4);
    // 1 danh sách cho thuê + 1 danh sách tin BĐS + 1 đọc thư viện cả 4 tin (gộp); thư viện rỗng nên không có truy vấn media.
    expect(find).toHaveBeenCalledTimes(3);
  });
});
