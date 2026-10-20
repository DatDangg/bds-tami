import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";

import type { Project } from "../../payload-types";
import { listDevelopersWithPublicProjects, listPublicProjects, PROJECT_PAGE_SIZE } from "./project-queries";

interface Row {
  id: string;
  title: string;
  address?: string;
  province?: { name: string };
  ward?: { name: string };
  priceFromVnd?: number | null;
  developer?: string;
}

/** Thứ tự = mới nhất trước (đúng thứ tự `-publishedAt` mà truy vấn thật trả). */
const rows: Row[] = [
  { id: "1", title: "Crown Residence", address: "12 Lê Lợi", province: { name: "Đà Nẵng" }, ward: { name: "Hải Châu" }, priceFromVnd: 5_000_000_000, developer: "d1" },
  { id: "2", title: "Sông Sài Gòn", address: "Bến Nghé", province: { name: "Hồ Chí Minh" }, priceFromVnd: null, developer: "d2" },
  { id: "3", title: "Tây Hồ View", province: { name: "Hà Nội" }, ward: { name: "Tây Hồ" }, priceFromVnd: 2_000_000_000, developer: "d1" },
  { id: "4", title: "Biển Xanh", priceFromVnd: 9_000_000_000 },
];

interface FindArgs {
  where?: Record<string, unknown>;
  page?: number;
  limit?: number;
  sort?: unknown;
}

/** Payload giả: chỉ hiểu `id in [...]`; điều kiện khác (public, developer...) được ghi lại để assert. */
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
    expect(titles((await run(payload, { page: 1, q: "da nang" })).docs)).toEqual(["Crown Residence"]);
  });

  it("không khớp: danh sách rỗng, totalDocs 0, không lỗi", async () => {
    const { payload } = fakePayload();
    const result = await run(payload, { page: 1, q: "khong-ton-tai" });
    expect(result).toMatchObject({ docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false });
  });

  it("q chỉ gồm khoảng trắng = không lọc", async () => {
    const { payload } = fakePayload();
    expect((await run(payload, { page: 1, q: "   " })).totalDocs).toBe(4);
  });
});

describe("listPublicProjects: sắp xếp theo giá", () => {
  it("price_asc: giá tăng dần, dự án chưa có giá xếp cuối", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, sort: "price_asc" })).docs)).toEqual(["Tây Hồ View", "Crown Residence", "Biển Xanh", "Sông Sài Gòn"]);
  });

  it("price_desc: giá giảm dần, dự án chưa có giá VẪN xếp cuối", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, sort: "price_desc" })).docs)).toEqual(["Biển Xanh", "Crown Residence", "Tây Hồ View", "Sông Sài Gòn"]);
  });

  it("kết hợp q + price_desc", async () => {
    const { payload } = fakePayload();
    expect(titles((await run(payload, { page: 1, q: "o", sort: "price_desc" })).docs)).toEqual(["Crown Residence", "Tây Hồ View", "Sông Sài Gòn"]);
  });

  it("newest (hoặc bỏ trống) và không q: một truy vấn SQL phân trang như cũ, sắp -publishedAt", async () => {
    const { payload, find } = fakePayload();
    await run(payload, { page: 2 });
    expect(find).toHaveBeenCalledTimes(1);
    expect(find.mock.calls[0]?.[0]).toMatchObject({ page: 2, limit: PROJECT_PAGE_SIZE, sort: ["-publishedAt", "-createdAt"] });
  });
});

describe("listPublicProjects: developer + bộ lọc cũ + phân trang", () => {
  it("developerId đi vào điều kiện where cùng category / tỉnh / trạng thái", async () => {
    const { payload, find } = fakePayload();
    await run(payload, { page: 1, developerId: "d1", categoryIds: ["c1"], provinceId: "p1", salesStatus: "selling" });
    const where = JSON.stringify(find.mock.calls[0]?.[0].where);
    for (const part of ['"developer":{"equals":"d1"}', '"category":{"in":["c1"]}', '"province":{"equals":"p1"}', '"salesStatus":{"equals":"selling"}']) {
      expect(where).toContain(part);
    }
  });

  it("đường quét vẫn mang điều kiện lọc cũ + developer xuống truy vấn quét", async () => {
    const { payload, find } = fakePayload();
    await run(payload, { page: 1, q: "crown", developerId: "d1", provinceId: "p1" });
    const where = JSON.stringify(find.mock.calls[0]?.[0].where);
    expect(where).toContain('"developer":{"equals":"d1"}');
    expect(where).toContain('"province":{"equals":"p1"}');
  });

  it("phân trang trên kết quả đã lọc/sắp: trang 2 = phần còn lại, vượt trang = rỗng nhưng giữ tổng", async () => {
    const many: Row[] = Array.from({ length: 15 }, (_, index) => ({ id: String(index + 1), title: `Dự án ${index + 1}`, priceFromVnd: (index + 1) * 1000 }));
    const { payload } = fakePayload(many);
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
