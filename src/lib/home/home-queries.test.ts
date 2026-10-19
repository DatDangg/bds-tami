import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Homepage } from "../../payload-types";

const findPublicList = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("../content/public-queries", () => ({ findPublicList }));
vi.mock("../posts/post-queries", () => ({ POST_CARD_FIELDS: { title: true } }));
const listProvinces = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("../projects/project-queries", () => ({ listProvinces }));
const listRentalCategoryOptions = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("../rentals/rental-list-queries", () => ({ listRentalCategoryOptions }));
const searchRentals = vi.hoisted(() => vi.fn<(params: { category: string; locale: string; limit: number; available: boolean }) => Promise<unknown>>());
vi.mock("../search/search-service", () => ({
  sqlExecutorOf: () => ({}),
  PostgresRentalSearch: class {
    search(params: { category: string; locale: string; limit: number; available: boolean }) {
      return searchRentals(params);
    }
  },
}));

import { FEATURED_PROJECTS_MAX, loadHomeDocs } from "./home-queries";

const NOW = new Date("2026-10-18T03:00:00.000Z");
const payload = {} as Payload;
const emptyHomepage = {} as Homepage;
const list = (ids: string[]) => ({ docs: ids.map((id) => ({ id })) });
const optionsOf = (call: unknown[]) => call[3] as { where: unknown; limit: number; sort?: unknown };
const whereOf = (call: unknown[]) => JSON.stringify(optionsOf(call).where);
const callFor = (collection: string) => findPublicList.mock.calls.find((call) => call[1] === collection);

beforeEach(() => {
  findPublicList.mockReset();
  listProvinces.mockReset().mockResolvedValue([{ id: "pv1", slug: "ha-noi", name: "Hà Nội" }]);
  listRentalCategoryOptions.mockReset();
  searchRentals.mockReset();
});

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

  it("select thẻ dự án gồm salesStatus + scale (badge và số liệu) — thiếu thì thẻ lỗi i18n lúc chạy", async () => {
    findPublicList.mockResolvedValue(list(["p1"]));
    await loadHomeDocs(payload, "vi", { featuredProjects: { projects: ["p1"] } } as unknown as Homepage, ["featuredProjects"], NOW);
    await loadHomeDocs(payload, "vi", { featuredProjects: { projects: [] } } as unknown as Homepage, ["featuredProjects"], NOW);
    for (const call of findPublicList.mock.calls.filter((item) => item[1] === "projects")) {
      expect((call[3] as { select: Record<string, true> }).select).toMatchObject({ salesStatus: true, scale: true, title: true, slug: true, gallery: true, category: true, province: true });
    }
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

describe("loadHomeDocs: chip dự án ở ô tìm kiếm hero (BL-020)", () => {
  const withHero = (extra: Record<string, unknown> = {}) => ({ hero: { slides: [{ id: "s1" }] }, ...extra }) as unknown as Homepage;
  const projectCalls = () => findPublicList.mock.calls.filter((call) => call[1] === "projects");

  it("không có slide hero hoặc ô tìm kiếm tắt → không truy vấn", async () => {
    findPublicList.mockResolvedValue(list(["a"]));
    await loadHomeDocs(payload, "vi", emptyHomepage, [], NOW);
    await loadHomeDocs(payload, "vi", withHero({ heroSearch: { enabled: false } }), [], NOW);
    expect(findPublicList).not.toHaveBeenCalled();
    expect(listProvinces).not.toHaveBeenCalled();
  });

  it("có ô tìm kiếm: nạp tỉnh/thành cho tab Dự án đúng 1 lần (cùng loader với /du-an)", async () => {
    findPublicList.mockResolvedValue(list([]));
    const docs = await loadHomeDocs(payload, "vi", withHero(), [], NOW);
    expect(listProvinces).toHaveBeenCalledTimes(1);
    expect(docs.provinces.map((province) => province.slug)).toEqual(["ha-noi"]);
  });

  it("chọn tay: đọc như khách theo id, giữ thứ tự admin, tối đa 6, chỉ tên + slug", async () => {
    findPublicList.mockResolvedValue(list(["p3", "p1"]));
    const homepage = withHero({ heroSearch: { chipProjects: ["p1", { id: "p3" }, "p4", "p5", "p6", "p7", "p8"] } });
    const docs = await loadHomeDocs(payload, "en", homepage, [], NOW);
    expect(docs.chipProjects.map((doc) => doc.id)).toEqual(["p1", "p3"]);
    const call = projectCalls()[0] ?? [];
    expect(call[2]).toBe("en");
    expect(whereOf(call)).toContain('"id":{"in":["p1","p3","p4","p5","p6","p7"]}');
    expect(optionsOf(call).limit).toBe(6);
    expect((call[3] as { select: unknown }).select).toEqual({ title: true, slug: true });
  });

  it("để trống: lấy dự án isFeatured mới nhất, tối đa 6", async () => {
    findPublicList.mockResolvedValue(list(["a", "b"]));
    const docs = await loadHomeDocs(payload, "vi", withHero(), [], NOW);
    expect(docs.chipProjects.map((doc) => doc.id)).toEqual(["a", "b"]);
    const call = projectCalls()[0] ?? [];
    expect(whereOf(call)).toContain('"isFeatured":{"equals":true}');
    expect(optionsOf(call)).toMatchObject({ limit: 6, sort: ["-publishedAt", "-createdAt"] });
  });

  it("chọn tay nhưng không bản ghi nào còn công khai (đã gỡ / chưa có EN) → rơi về isFeatured", async () => {
    findPublicList.mockResolvedValueOnce(list([])).mockResolvedValueOnce(list(["f1"]));
    const docs = await loadHomeDocs(payload, "en", withHero({ heroSearch: { chipProjects: ["gone"] } }), [], NOW);
    expect(docs.chipProjects.map((doc) => doc.id)).toEqual(["f1"]);
    expect(projectCalls()).toHaveLength(2);
    expect(whereOf(projectCalls()[1] ?? [])).toContain('"isFeatured":{"equals":true}');
  });
});

describe("loadHomeDocs: khối Cho thuê (BL-020 #8)", () => {
  const rental = (id: string) => ({ id });
  const category = (slug: string) => ({ id: `c-${slug}`, name: `DM ${slug}`, slug });
  /** Mỗi danh mục có `perCategory[slug]` tin; không khai báo = rỗng. */
  const withListings = (perCategory: Record<string, string[]>) =>
    searchRentals.mockImplementation(async ({ category: slug }) => ({ items: (perCategory[slug] ?? []).map(rental), total: 0, page: 1, totalPages: 1 }));
  const rentalsPage = (categories: unknown[] = []) => ({ rentals: { categories } }) as unknown as Homepage;

  it("chọn tay: đọc danh mục như khách (scope cho thuê, giữ thứ tự admin, ≤ 4), mỗi tab 1 lần tìm kiếm ≤ 8 tin còn trống theo ngôn ngữ", async () => {
    findPublicList.mockResolvedValue({ docs: [category("b"), category("a")] });
    withListings({ a: ["1"], b: ["2", "3"] });
    const page = rentalsPage(["c-a", { id: "c-b" }, "c3", "c4", "c5"]);
    const docs = await loadHomeDocs(payload, "en", page, ["rentals"], NOW);
    expect(docs.rentalTabs.map((tab) => [tab.category.slug, tab.items.length])).toEqual([["a", 1], ["b", 2]]);
    const call = callFor("categories") ?? [];
    expect(call[2]).toBe("en");
    expect(whereOf(call)).toContain('"id":{"in":["c-a","c-b","c3","c4"]}');
    expect(whereOf(call)).toContain('"scope":{"equals":"rental"}');
    expect(searchRentals).toHaveBeenCalledTimes(2);
    expect(searchRentals.mock.calls[0]?.[0]).toMatchObject({ category: "a", locale: "en", limit: 8, available: true });
    expect(listRentalCategoryOptions).not.toHaveBeenCalled();
  });

  it("tab chọn tay không có tin bị bỏ", async () => {
    findPublicList.mockResolvedValue({ docs: [category("a"), category("b")] });
    withListings({ b: ["1"] });
    const docs = await loadHomeDocs(payload, "vi", rentalsPage(["c-a", "c-b"]), ["rentals"], NOW);
    expect(docs.rentalTabs.map((tab) => tab.category.slug)).toEqual(["b"]);
  });

  it("để trống: lấy danh mục cho thuê gốc (bỏ danh mục con) đang có tin, tối đa 4 tab", async () => {
    listRentalCategoryOptions.mockResolvedValue([
      { slug: "a", label: "A", depth: 0 },
      { slug: "a-con", label: "A con", depth: 1 },
      { slug: "b", label: "B", depth: 0 },
      { slug: "c", label: "C", depth: 0 },
      { slug: "d", label: "D", depth: 0 },
      { slug: "e", label: "E", depth: 0 },
      { slug: "f", label: "F", depth: 0 },
    ]);
    withListings({ a: ["1"], c: ["2"], d: ["3"], e: ["4"], f: ["5"] });
    const docs = await loadHomeDocs(payload, "vi", rentalsPage(), ["rentals"], NOW);
    expect(docs.rentalTabs.map((tab) => tab.category.slug)).toEqual(["a", "c", "d", "e"]);
    expect(searchRentals.mock.calls.map((call) => call[0].category)).not.toContain("a-con");
    expect(findPublicList).not.toHaveBeenCalled();
  });

  it("fallback: dò 4 danh mục đầu; đủ 4 tab có tin thì KHÔNG dò thêm, thiếu mới dò lô kế", async () => {
    const options = ["a", "b", "c", "d", "e", "f", "g"].map((slug) => ({ slug, label: slug, depth: 0 }));
    listRentalCategoryOptions.mockResolvedValue(options);
    withListings({ a: ["1"], b: ["1"], c: ["1"], d: ["1"], e: ["1"] });
    await loadHomeDocs(payload, "vi", rentalsPage(), ["rentals"], NOW);
    expect(searchRentals).toHaveBeenCalledTimes(4);
    searchRentals.mockClear();
    withListings({ a: ["1"], e: ["1"], g: ["1"] });
    const docs = await loadHomeDocs(payload, "vi", rentalsPage(), ["rentals"], NOW);
    expect(searchRentals).toHaveBeenCalledTimes(7);
    expect(docs.rentalTabs.map((tab) => tab.category.slug)).toEqual(["a", "e", "g"]);
  });

  it("chọn tay nhưng không tab nào còn tin/công khai (chưa có EN) → rơi về danh mục đang có tin", async () => {
    findPublicList.mockResolvedValue({ docs: [] });
    listRentalCategoryOptions.mockResolvedValue([{ slug: "a", label: "A", depth: 0 }]);
    withListings({ a: ["1"] });
    const docs = await loadHomeDocs(payload, "en", rentalsPage(["gone"]), ["rentals"], NOW);
    expect(docs.rentalTabs.map((tab) => tab.category.slug)).toEqual(["a"]);
  });

  it("khối không hiển thị thì không truy vấn", async () => {
    await loadHomeDocs(payload, "vi", rentalsPage(), [], NOW);
    expect(searchRentals).not.toHaveBeenCalled();
    expect(listRentalCategoryOptions).not.toHaveBeenCalled();
  });
});

describe("loadHomeDocs: khối Tin tức (BL-020 #11)", () => {
  const newsPage = (posts: unknown[] = []) => ({ news: { posts } }) as unknown as Homepage;
  const newsCalls = () => findPublicList.mock.calls.filter((call) => call[1] === "news");

  it("chọn tay: đọc như khách theo id, giữ thứ tự admin, ≤ 3, chỉ trường thẻ", async () => {
    findPublicList.mockResolvedValue(list(["n3", "n1"]));
    const docs = await loadHomeDocs(payload, "en", newsPage(["n1", { id: "n3" }, "n4", "n5"]), ["news"], NOW);
    expect(docs.news.map((doc) => doc.id)).toEqual(["n1", "n3"]);
    const call = newsCalls()[0] ?? [];
    expect(call[2]).toBe("en");
    expect(whereOf(call)).toContain('"id":{"in":["n1","n3","n4"]}');
    expect(optionsOf(call).limit).toBe(3);
    const select = (call[3] as { select: Record<string, true> }).select;
    expect(Object.keys(select).sort()).toEqual(["category", "cover", "excerpt", "publishedAt", "slug", "title"]);
  });

  it("để trống: 3 bài mới nhất, 1 truy vấn", async () => {
    findPublicList.mockResolvedValue(list(["a", "b", "c"]));
    const docs = await loadHomeDocs(payload, "vi", newsPage(), ["news"], NOW);
    expect(docs.news).toHaveLength(3);
    expect(newsCalls()).toHaveLength(1);
    expect(optionsOf(newsCalls()[0] ?? [])).toMatchObject({ limit: 3, sort: ["-publishedAt", "-createdAt"] });
  });

  it("chọn tay nhưng không bài nào còn công khai → rơi về 3 bài mới nhất", async () => {
    findPublicList.mockResolvedValueOnce(list([])).mockResolvedValueOnce(list(["latest"]));
    const docs = await loadHomeDocs(payload, "en", newsPage(["gone"]), ["news"], NOW);
    expect(docs.news.map((doc) => doc.id)).toEqual(["latest"]);
    expect(newsCalls()).toHaveLength(2);
  });

  it("khối không hiển thị thì không truy vấn", async () => {
    await loadHomeDocs(payload, "vi", newsPage(), [], NOW);
    expect(findPublicList).not.toHaveBeenCalled();
  });
});
