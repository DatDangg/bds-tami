import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";

import type { Project } from "../../payload-types";
import { listDevelopersWithPublicProjects, listPublicProjects, PROJECT_FEATURED_LIMIT, PROJECT_PAGE_SIZE } from "./project-queries";

interface Row {
  id: string;
  title: string;
  address?: string;
  province?: { id: string; name: string; slug: string; sortOrder?: number };
  ward?: { name: string };
  category?: { id: string; parent?: string | null };
  salesStatus?: Project["salesStatus"];
  priceFromVnd?: number | null;
  priceTable?: Array<{ priceFrom?: number | null }>;
  developer?: string;
  productTypes?: Project["productTypes"];
  featuredAmenities?: Project["featuredAmenities"];
  isFeatured?: boolean;
}

const DN = { id: "p-dn", name: "Đà Nẵng", slug: "da-nang", sortOrder: 3 };
const HCM = { id: "p-hcm", name: "Hồ Chí Minh", slug: "ho-chi-minh", sortOrder: 2 };
const HN = { id: "p-hn", name: "Hà Nội", slug: "ha-noi", sortOrder: 1 };
const CAT_A = { id: "cat-a" };
const CAT_A_CHILD = { id: "cat-a1", parent: "cat-a" };
const CAT_B = { id: "cat-b" };

/** Thứ tự = mới nhất trước (đúng thứ tự `-publishedAt` mà truy vấn thật trả). */
const rows: Row[] = [
  { id: "1", title: "Crown Residence", address: "12 Lê Lợi", province: DN, ward: { name: "Hải Châu" }, category: CAT_A, salesStatus: "selling", priceFromVnd: 5_000_000_000, developer: "d1", productTypes: ["apartment", "villa"], featuredAmenities: ["near_school", "water_view"] },
  { id: "2", title: "Sông Sài Gòn", address: "Bến Nghé", province: HCM, category: CAT_A_CHILD, salesStatus: "upcoming", priceFromVnd: null, developer: "d2", productTypes: ["apartment"], featuredAmenities: ["near_school"] },
  { id: "3", title: "Tây Hồ View", province: HN, ward: { name: "Tây Hồ" }, category: CAT_B, salesStatus: "selling", priceFromVnd: 2_000_000_000, developer: "d1", productTypes: ["townhouse"], featuredAmenities: ["water_view"] },
  { id: "4", title: "Biển Xanh", province: DN, category: CAT_B, salesStatus: "handed_over", priceFromVnd: 9_000_000_000 },
];

interface FindArgs {
  where?: Record<string, unknown>;
  page?: number;
  limit?: number;
  sort?: unknown;
}

/** Payload giả: chỉ hiểu `id in [...]` (truy vấn lấy trường thẻ); truy vấn quét trả mọi dòng theo thứ tự sẵn có. */
function fakePayload(data: Row[] = rows) {
  const find = vi.fn(async (args: FindArgs) => {
    const clauses = (args.where as { and?: Array<Record<string, { in?: string[] }>> } | undefined)?.and ?? [];
    const idClause = clauses.find((clause) => clause.id?.in)?.id;
    const docs = idClause?.in ? data.filter((row) => idClause.in?.includes(row.id)) : data;
    const limit = args.limit ?? 10;
    const page = args.page ?? 1;
    const start = (page - 1) * limit;
    const totalPages = Math.ceil(docs.length / limit);
    return { docs: docs.slice(start, start + limit), page, limit, totalDocs: docs.length, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
  });
  return { find, payload: { find } as unknown as Payload };
}

const titles = (docs: Project[]) => docs.map((doc) => doc.title);
const run = (payload: Payload, query: Parameters<typeof listPublicProjects>[2]) => listPublicProjects(payload, "vi", query);

describe("listPublicProjects: từ khoá q (không dấu)", () => {
  it("khớp tên không dấu, không phân biệt hoa thường", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, q: "SONG SAI GON" })).docs)).toEqual(["Sông Sài Gòn"]);
    expect(titles((await run(payload, { page: 1, q: "crown" })).docs)).toEqual(["Crown Residence"]);
  });

  it("khớp địa chỉ, phường và tỉnh", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, q: "le loi" })).docs)).toEqual(["Crown Residence"]);
    expect(titles((await run(payload, { page: 1, q: "tay ho" })).docs)).toEqual(["Tây Hồ View"]);
    expect(titles((await run(payload, { page: 1, q: "da nang" })).docs)).toEqual(["Crown Residence", "Biển Xanh"]);
  });

  it("không khớp: danh sách rỗng, totalDocs 0, không lỗi", async () => {
    const { payload } = fakePayload();
    const result = await run(payload, { page: 1, q: "khong-ton-tai" });
    expect(result).toMatchObject({ docs: [], featured: [], totalDocs: 0, totalPages: 0, hasNextPage: false });
  });

  it("q chỉ gồm khoảng trắng = không lọc", async () => {
    const { payload } = fakePayload();
    expect((await run(payload, { page: 1, q: "   " })).totalDocs).toBe(4);
  });
});

describe("listPublicProjects: sắp xếp theo giá hiệu lực", () => {
  it("price_asc: giá tăng dần, dự án chưa có giá xếp cuối", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, sort: "price_asc" })).docs)).toEqual(["Tây Hồ View", "Crown Residence", "Biển Xanh", "Sông Sài Gòn"]);
  });

  it("price_desc: giá giảm dần, dự án chưa có giá VẪN xếp cuối", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, sort: "price_desc" })).docs)).toEqual(["Biển Xanh", "Crown Residence", "Tây Hồ View", "Sông Sài Gòn"]);
  });

  it("giá = min priceTable[].priceFrom > 0 trước, rồi mới tới priceFromVnd", async () => {
    const data: Row[] = [
      { id: "a", title: "A", priceFromVnd: 1_000_000_000, priceTable: [{ priceFrom: 8_000_000_000 }, { priceFrom: 0 }, { priceFrom: 6_000_000_000 }] },
      { id: "b", title: "B", priceFromVnd: 7_000_000_000, priceTable: [{ priceFrom: null }] },
      { id: "c", title: "C", priceFromVnd: 0, priceTable: [] },
    ];
    const { payload } = fakePayload(data);
    expect(titles((await run(payload, { page: 1, sort: "price_asc" })).docs)).toEqual(["A", "B", "C"]);
    expect(titles((await run(payload, { page: 1, priceMin: 7 })).docs)).toEqual(["B"]);
  });

  it("kết hợp q + price_desc", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, q: "o", sort: "price_desc" })).docs)).toEqual(["Crown Residence", "Tây Hồ View", "Sông Sài Gòn"]);
  });

  it("luôn: một lượt quét (không điều kiện, mới nhất trước) + MỘT truy vấn lấy trường thẻ theo id", async () => {
    const { payload, find } = fakePayload();
    await run(payload, { page: 1 });
    expect(find).toHaveBeenCalledTimes(2);
    expect(find.mock.calls[0]?.[0]).toMatchObject({ sort: ["-publishedAt", "-createdAt"], page: 1, limit: 50 });
    expect(JSON.stringify(find.mock.calls[1]?.[0].where)).toContain('"id":{"in":["1","2","3","4"]}');
  });
});

describe("listPublicProjects: bộ lọc", () => {
  const list = async (query: Partial<Parameters<typeof listPublicProjects>[2]>) => titles((await run(fakePayload().payload, { page: 1, ...query })).docs);

  it("danh mục (+ con), nhiều tỉnh (OR), trạng thái, chủ đầu tư", async () => {
    expect(await list({ categoryIds: ["cat-a", "cat-a1"] })).toEqual(["Crown Residence", "Sông Sài Gòn"]);
    expect(await list({ provinceIds: ["p-dn", "p-hn"] })).toEqual(["Crown Residence", "Tây Hồ View", "Biển Xanh"]);
    expect(await list({ salesStatus: "selling", developerId: "d1" })).toEqual(["Crown Residence", "Tây Hồ View"]);
    expect(await list({ provinceIds: [] })).toHaveLength(4);
  });

  it("loại sản phẩm OR; tiện ích nổi bật AND", async () => {
    expect(await list({ types: ["villa", "townhouse"] })).toEqual(["Crown Residence", "Tây Hồ View"]);
    expect(await list({ features: ["near_school"] })).toEqual(["Crown Residence", "Sông Sài Gòn"]);
    expect(await list({ features: ["near_school", "water_view"] })).toEqual(["Crown Residence"]);
  });

  it("khoảng giá (tỷ, hai đầu tính cả): dự án không có giá bị loại", async () => {
    expect(await list({ priceMin: 5 })).toEqual(["Crown Residence", "Biển Xanh"]);
    expect(await list({ priceMax: 5 })).toEqual(["Crown Residence", "Tây Hồ View"]);
    expect(await list({ priceMin: 3, priceMax: 6 })).toEqual(["Crown Residence"]);
    expect(await list({ priceMin: 0 })).toEqual(["Crown Residence", "Tây Hồ View", "Biển Xanh"]);
  });
});

describe("listPublicProjects: số đếm theo chiều (trừ chính chiều đó)", () => {
  it("không lọc: mỗi chiều đếm trên toàn bộ; trạng thái / loại / tiện ích đủ khoá kể cả 0; danh mục con tính vào cấp 1", async () => {
    const { facets } = await run(fakePayload().payload, { page: 1 });
    expect(facets.category).toEqual({ all: 4, counts: { "cat-a": 2, "cat-b": 2 } });
    expect(facets.status).toEqual({ all: 4, counts: { upcoming: 1, selling: 2, handed_over: 1 } });
    expect(facets.developer.counts).toEqual({ d1: 2, d2: 1 });
    expect(facets.type.counts).toMatchObject({ apartment: 2, villa: 1, townhouse: 1, office: 0, land: 0 });
    expect(facets.feature.counts).toMatchObject({ near_school: 2, water_view: 2, near_metro: 0 });
  });

  it("chiều đang chọn không tự thu hẹp số của chính nó; các chiều khác bị thu hẹp", async () => {
    const { facets, totalDocs } = await run(fakePayload().payload, { page: 1, provinceIds: ["p-dn"], salesStatus: "selling" });
    expect(totalDocs).toBe(1);
    // Tỉnh: đếm theo trạng thái "selling" bất kể tỉnh đang chọn.
    expect(facets.provinces.map((item) => [item.slug, item.count])).toEqual([
      ["da-nang", 1],
      ["ha-noi", 1],
      ["ho-chi-minh", 0],
    ]);
    // Trạng thái: đếm theo tỉnh Đà Nẵng bất kể trạng thái đang chọn.
    expect(facets.status).toEqual({ all: 2, counts: { upcoming: 0, selling: 1, handed_over: 1 } });
    // Tab danh mục: khớp tỉnh + trạng thái, "Tất cả" = bỏ chiều danh mục.
    expect(facets.category).toEqual({ all: 1, counts: { "cat-a": 1 } });
    expect(facets.type.counts).toMatchObject({ apartment: 1, villa: 1, townhouse: 0 });
  });

  it("tiện ích (AND) cũng bỏ cả chiều khi đếm; loại (OR) bỏ cả chiều", async () => {
    const { facets } = await run(fakePayload().payload, { page: 1, features: ["near_school", "water_view"], types: ["townhouse"] });
    expect(facets.feature.counts).toMatchObject({ near_school: 0, water_view: 1 });
    expect(facets.type.counts).toMatchObject({ apartment: 1, villa: 1, townhouse: 0 });
  });

  it("danh sách tỉnh: chỉ tỉnh có dự án công khai, sắp theo số dự án KHÔNG lọc giảm dần (hoà: sortOrder)", async () => {
    const { facets } = await run(fakePayload().payload, { page: 1, q: "tay ho" });
    expect(facets.provinces).toEqual([
      { id: "p-dn", slug: "da-nang", name: "Đà Nẵng", count: 0, total: 2 },
      { id: "p-hn", slug: "ha-noi", name: "Hà Nội", count: 1, total: 1 },
      { id: "p-hcm", slug: "ho-chi-minh", name: "Hồ Chí Minh", count: 0, total: 1 },
    ]);
  });
});

describe("listPublicProjects: nổi bật không lặp + phân trang", () => {
  const many = (count: number, featured: (index: number) => boolean): Row[] =>
    Array.from({ length: count }, (_, index) => ({ id: String(index + 1), title: `Dự án ${index + 1}`, priceFromVnd: (index + 1) * 1000, isFeatured: featured(index + 1) }));

  it("≤ 5 nổi bật khớp bộ lọc, mới nhất trước; không lặp trong lưới ở MỌI trang; totalDocs gồm nổi bật", async () => {
    const data = many(20, (n) => n % 3 === 0); // 3,6,9,12,15,18 nổi bật → lấy 5 mới nhất (3..15); 18 vào lưới
    const { payload } = fakePayload(data);
    const first = await run(payload, { page: 1 });
    expect(titles(first.featured)).toEqual(["Dự án 3", "Dự án 6", "Dự án 9", "Dự án 12", "Dự án 15"]);
    expect(first.featured).toHaveLength(PROJECT_FEATURED_LIMIT);
    expect(first).toMatchObject({ totalDocs: 20, totalPages: 2, hasNextPage: true });
    const second = await run(payload, { page: 2 });
    expect(second.featured).toEqual([]);
    const grid = [...titles(first.docs), ...titles(second.docs)];
    expect(grid).toHaveLength(15);
    expect(grid).toContain("Dự án 18");
    for (const title of titles(first.featured)) expect(grid).not.toContain(title);
  });

  it("nổi bật theo bộ lọc (không khớp → không nổi bật) và không theo sort giá", async () => {
    const data = many(4, (n) => n !== 2);
    const { payload } = fakePayload(data);
    const sorted = await run(payload, { page: 1, sort: "price_desc", priceMax: 0 });
    expect(sorted).toMatchObject({ totalDocs: 0, featured: [] });
    const desc = await run(payload, { page: 1, sort: "price_desc" });
    expect(titles(desc.featured)).toEqual(["Dự án 1", "Dự án 3", "Dự án 4"]);
    expect(titles(desc.docs)).toEqual(["Dự án 2"]);
  });

  it("phân trang trên phần còn lại đã lọc/sắp: trang 2 = phần còn lại, vượt trang = rỗng nhưng giữ tổng", async () => {
    const { payload } = fakePayload(many(15, () => false));
    const first = await run(payload, { page: 1, sort: "price_desc" });
    expect(first).toMatchObject({ totalDocs: 15, totalPages: 2, hasNextPage: true });
    expect(first.docs).toHaveLength(PROJECT_PAGE_SIZE);
    expect(first.docs[0]?.title).toBe("Dự án 15");
    const second = await run(payload, { page: 2, sort: "price_desc" });
    expect(titles(second.docs)).toEqual(["Dự án 3", "Dự án 2", "Dự án 1"]);
    expect(second).toMatchObject({ hasNextPage: false, hasPrevPage: true });
    expect(await run(payload, { page: 3, sort: "price_desc" })).toMatchObject({ docs: [], totalDocs: 15, totalPages: 2 });
  });
});

describe("listDevelopersWithPublicProjects", () => {
  it("chỉ truy vấn chủ đầu tư có trong dự án công khai (id duy nhất), không có dự án thì trả rỗng", async () => {
    const devs = [{ id: "d1", name: "A" }, { id: "d2", name: "B" }];
    const find = vi.fn(async (args: { collection: string; where?: unknown }) => {
      if (args.collection === "projects") {
        return { docs: rows.filter((row) => row.developer), page: 1, limit: 50, totalDocs: 3, totalPages: 1, hasNextPage: false, hasPrevPage: false };
      }
      return { docs: devs, page: 1, limit: 50, totalDocs: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false };
    });
    const payload = { find } as unknown as Payload;
    expect((await listDevelopersWithPublicProjects(payload, "vi")).map((dev) => dev.id)).toEqual(["d1", "d2"]);
    const developerCall = find.mock.calls.find(([args]) => args.collection === "developers");
    expect(JSON.stringify(developerCall?.[0].where)).toContain('"id":{"in":["d1","d2"]}');

    const none = vi.fn(async () => ({ docs: [], page: 1, limit: 50, totalDocs: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }));
    expect(await listDevelopersWithPublicProjects({ find: none } as unknown as Payload, "vi")).toEqual([]);
    expect(none).toHaveBeenCalledTimes(1);
  });
});
