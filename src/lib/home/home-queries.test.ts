import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Homepage } from "../../payload-types";

const findPublicList = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("../content/public-queries", () => ({ findPublicList }));
vi.mock("../posts/post-queries", () => ({ POST_CARD_FIELDS: { title: true } }));

import { FEATURED_PROJECTS_MAX, loadHomeDocs } from "./home-queries";

const NOW = new Date("2026-10-18T03:00:00.000Z");
const payload = {} as Payload;
const emptyHomepage = {} as Homepage;
const list = (ids: string[]) => ({ docs: ids.map((id) => ({ id })) });
const optionsOf = (call: unknown[]) => call[3] as { where: unknown; limit: number; sort?: unknown };
const whereOf = (call: unknown[]) => JSON.stringify(optionsOf(call).where);
const callFor = (collection: string) => findPublicList.mock.calls.find((call) => call[1] === collection);

beforeEach(() => findPublicList.mockReset());

describe("loadHomeDocs", () => {
  it("chỉ truy vấn khối sẽ hiển thị; không khối nào thì không truy vấn", async () => {
    findPublicList.mockResolvedValue(list([]));
    await loadHomeDocs(payload, "vi", emptyHomepage, ["about", "ctaBanner"], NOW);
    expect(findPublicList).not.toHaveBeenCalled();
    await loadHomeDocs(payload, "vi", emptyHomepage, ["services"], NOW);
    // Dịch vụ chưa chọn mục nào → không có gì để đọc.
    expect(findPublicList).not.toHaveBeenCalled();
  });

  it("dự án chọn tay: đọc lại như khách theo id, giữ thứ tự admin chọn, tối đa 6", async () => {
    findPublicList.mockResolvedValue(list(["p3", "p1", "p2"]));
    const homepage = { featuredProjects: { projects: ["p2", "p1", { id: "p3" }, "p4", "p5", "p6", "p7"] } } as unknown as Homepage;
    const docs = await loadHomeDocs(payload, "vi", homepage, ["featuredProjects"], NOW);
    expect(docs.projects.map((doc) => doc.id)).toEqual(["p2", "p1", "p3"]);
    const call = callFor("projects");
    expect(whereOf(call ?? [])).toContain('"id":{"in":["p2","p1","p3","p4","p5","p6"]}');
    expect(optionsOf(call ?? []).limit).toBe(FEATURED_PROJECTS_MAX);
  });

  it("dự án trống: lấy isFeatured mới nhất, tối đa 6", async () => {
    findPublicList.mockResolvedValue(list(["a", "b"]));
    const docs = await loadHomeDocs(payload, "vi", { featuredProjects: { projects: [] } } as unknown as Homepage, ["featuredProjects"], NOW);
    expect(docs.projects.map((doc) => doc.id)).toEqual(["a", "b"]);
    const call = callFor("projects") ?? [];
    expect(whereOf(call)).toContain('"isFeatured":{"equals":true}');
    expect(optionsOf(call)).toMatchObject({ limit: 6, sort: ["-publishedAt", "-createdAt"] });
  });

  it("ưu đãi: cả chọn tay lẫn isFeatured đều chỉ lấy bài chưa kết thúc (offerNotEndedWhere)", async () => {
    findPublicList.mockResolvedValue(list(["o1"]));
    await loadHomeDocs(payload, "en", { featuredOffers: { posts: ["o1"] } } as unknown as Homepage, ["featuredOffers"], NOW);
    await loadHomeDocs(payload, "en", { featuredOffers: { posts: [] } } as unknown as Homepage, ["featuredOffers"], NOW);
    const offerCalls = findPublicList.mock.calls.filter((call) => call[1] === "property-posts");
    expect(offerCalls).toHaveLength(2);
    for (const call of offerCalls) {
      expect(call[2]).toBe("en");
      expect(whereOf(call)).toContain('"offer.endAt":{"greater_than_equal"');
    }
    expect(whereOf(offerCalls[1] ?? [])).toContain('"isFeatured":{"equals":true}');
  });
});
