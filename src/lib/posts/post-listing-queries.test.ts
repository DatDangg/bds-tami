import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";
import type { PropertyPost } from "../../payload-types";
import { listPublicPostListing, POST_FEATURED_LIMIT, POST_PAGE_SIZE, type PostListQuery } from "./post-queries";

/** "Bây giờ" 10:00 giờ VN 18/10/2026; ưu đãi hạn 17/10 đã kết thúc, hạn 18/10 còn hiệu lực hết ngày. */
const NOW = new Date("2026-10-18T03:00:00.000Z");
const ENDED = { endAt: "2026-10-17T12:00:00.000Z" };
const ACTIVE = { endAt: "2026-10-30T12:00:00.000Z" };

const HN = { id: "p-hn", name: "Hà Nội", slug: "ha-noi", sortOrder: 1 };
const DN = { id: "p-dn", name: "Đà Nẵng", slug: "da-nang", sortOrder: 3 };
const HCM = { id: "p-hcm", name: "Hồ Chí Minh", shortName: "TP.HCM", slug: "ho-chi-minh", sortOrder: 2 };
const SALE = { id: "cat-sale", parent: null };
const SALE_CHILD = { id: "cat-sale-1", parent: "cat-sale" };
const VOUCHER = { id: "cat-voucher", parent: null };

type Row = Partial<Omit<PropertyPost, "province" | "category" | "ward">> & {
  id: string;
  title: string;
  province?: typeof HN | typeof HCM;
  ward?: { name: string };
  category?: { id: string; parent: string | null };
};

/** Thứ tự = mới nhất trước (đúng thứ tự `-publishedAt` mà truy vấn quét trả). */
const rows: Row[] = [
  { id: "1", title: "Căn hộ Sông Sài Gòn", province: HCM, category: SALE, propertyType: "apartment", priceVnd: 3_500_000_000, areaM2: 75, bedrooms: 2, bathrooms: 1, houseDirection: "SE", handoverCondition: "full" },
  { id: "2", title: "Voucher mùa thu", category: VOUCHER, offer: ACTIVE },
  { id: "3", title: "Biệt thự Tây Hồ", province: HN, ward: { name: "Tây Hồ" }, category: SALE_CHILD, propertyType: "villa", priceVnd: 20_000_000_000, areaM2: 300, bedrooms: 5, bathrooms: 6, houseDirection: "S", handoverCondition: "raw" },
  { id: "4", title: "Ưu đãi đã hết", category: VOUCHER, offer: ENDED, isFeatured: true },
  { id: "5", title: "Nhà phố Hải Châu", province: DN, category: SALE, propertyType: "townhouse", priceVnd: 8_000_000_000, areaM2: 120, bedrooms: 4, bathrooms: 2, houseDirection: "SE", handoverCondition: "basic", address: "12 Lê Lợi" },
  { id: "6", title: "Đất nền chưa có giá", province: DN, category: SALE, propertyType: "land", areaM2: 500, excerpt: "Gần biển Mỹ Khê" },
];

interface FindArgs {
  where?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

/** Payload giả: chỉ hiểu `id in [...]` (truy vấn lấy trường thẻ); truy vấn quét trả mọi dòng theo thứ tự sẵn có. */
function fakePayload(data: readonly Row[] = rows) {
  const warn = vi.fn();
  const find = vi.fn(async (args: FindArgs) => {
    const clauses = (args.where as { and?: Array<Record<string, { in?: string[] }>> } | undefined)?.and ?? [];
    const idClause = clauses.find((clause) => clause.id?.in)?.id;
    const docs = idClause?.in ? data.filter((row) => idClause.in?.includes(row.id)) : data;
    const limit = args.limit ?? 10;
    const page = args.page ?? 1;
    const totalPages = Math.ceil(docs.length / limit);
    return { docs: docs.slice((page - 1) * limit, page * limit), page, limit, totalDocs: docs.length, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
  });
  return { find, warn, payload: { find, logger: { warn } } as unknown as Payload };
}

const run = (query: Partial<PostListQuery>, data?: readonly Row[]) => listPublicPostListing(fakePayload(data).payload, "vi", { page: 1, now: NOW, ...query });
const ids = (docs: readonly PropertyPost[]) => docs.map((doc) => doc.id);

describe("listPublicPostListing: lọc", () => {
  it("không lọc: mọi tin, ưu đãi đã kết thúc xếp cuối (BR-06), còn lại mới nhất trước", async () => {
    const result = await run({});
    expect(ids(result.docs)).toEqual(["1", "2", "3", "5", "6", "4"]);
    expect(result).toMatchObject({ totalDocs: 6, totalPages: 1, featured: [] });
  });

  it("loại hình (OR), tỉnh (OR), hướng (OR), bàn giao (OR): tin không có giá trị đó bị loại", async () => {
    expect(ids((await run({ types: ["villa", "townhouse"] })).docs)).toEqual(["3", "5"]);
    expect(ids((await run({ provinceIds: [HN.id, DN.id] })).docs)).toEqual(["3", "5", "6"]);
    expect(ids((await run({ directions: ["SE"] })).docs)).toEqual(["1", "5"]);
    expect(ids((await run({ handovers: ["raw", "basic"] })).docs)).toEqual(["3", "5"]);
  });

  it("giá (tỷ) và diện tích (m²) hai đầu tính cả; có một đầu → tin không có giá / diện tích bị loại", async () => {
    expect(ids((await run({ priceMin: 3, priceMax: 8 })).docs)).toEqual(["1", "5"]);
    expect(ids((await run({ priceMax: 49 })).docs)).toEqual(["1", "3", "5"]);
    expect(ids((await run({ areaMin: 120 })).docs)).toEqual(["3", "5", "6"]);
    expect(ids((await run({ areaMin: 75, areaMax: 120 })).docs)).toEqual(["1", "5"]);
  });

  it("phòng ngủ: 1–3 đúng số phòng, 4 = từ 4 phòng trở lên; tin không có phòng ngủ bị loại", async () => {
    expect(ids((await run({ bedrooms: 2 })).docs)).toEqual(["1"]);
    expect(ids((await run({ bedrooms: 4 })).docs)).toEqual(["3", "5"]);
    expect((await run({ bedrooms: 1 })).totalDocs).toBe(0);
  });

  it("phòng tắm (BL-104): 1–3 đúng số phòng, 4 = từ 4 trở lên; tin bathrooms trống (NULL) bị loại", async () => {
    expect(ids((await run({ bathrooms: 1 })).docs)).toEqual(["1"]);
    expect(ids((await run({ bathrooms: 2 })).docs)).toEqual(["5"]);
    expect(ids((await run({ bathrooms: 4 })).docs)).toEqual(["3"]);
    expect((await run({ bathrooms: 3 })).totalDocs).toBe(0);
    expect(ids((await run({ bathrooms: 1, bedrooms: 2 })).docs)).toEqual(["1"]);
    expect((await run({ bathrooms: 1, bedrooms: 4 })).totalDocs).toBe(0);
  });

  it("từ khoá không dấu khớp tiêu đề, tóm tắt, địa chỉ, phường, tỉnh", async () => {
    expect(ids((await run({ q: "SONG SAI GON" })).docs)).toEqual(["1"]);
    expect(ids((await run({ q: "my khe" })).docs)).toEqual(["6"]);
    expect(ids((await run({ q: "le loi" })).docs)).toEqual(["5"]);
    expect(ids((await run({ q: "tay ho" })).docs)).toEqual(["3"]);
    expect(ids((await run({ q: "ho chi minh" })).docs)).toEqual(["1"]);
    expect((await run({ q: "   " })).totalDocs).toBe(6);
  });

  it("danh mục theo route (danh mục + con)", async () => {
    expect(ids((await run({ categoryIds: [SALE.id, SALE_CHILD.id] })).docs)).toEqual(["1", "3", "5", "6"]);
    expect(ids((await run({ categoryIds: [VOUCHER.id] })).docs)).toEqual(["2", "4"]);
  });
});

describe("listPublicPostListing: sắp xếp", () => {
  it("price_asc / price_desc: tin không có giá cuối nhóm, ưu đãi đã kết thúc vẫn cuối cùng", async () => {
    expect(ids((await run({ sort: "price_asc" })).docs)).toEqual(["1", "5", "3", "2", "6", "4"]);
    expect(ids((await run({ sort: "price_desc" })).docs)).toEqual(["3", "5", "1", "2", "6", "4"]);
  });
});

describe("listPublicPostListing: số đếm (trừ chính chiều đó)", () => {
  it("số ở mỗi chiều = khớp mọi lọc khác, bất kể giá trị đang chọn của chiều đó; mục 0 vẫn có", async () => {
    const { facets } = await run({ types: ["villa"], provinceIds: [DN.id] });
    // Loại hình: bỏ lọc loại hình, giữ tỉnh Đà Nẵng → townhouse 1, land 1, villa 0.
    expect(facets.type).toMatchObject({ all: 2, counts: { townhouse: 1, land: 1, villa: 0, apartment: 0 } });
    // Tỉnh: bỏ lọc tỉnh, giữ villa → chỉ Hà Nội 1; danh sách tỉnh vẫn đủ tỉnh có tin, sắp theo tổng không lọc.
    expect(facets.provinces).toEqual([
      { id: DN.id, slug: "da-nang", name: "Đà Nẵng", count: 0, total: 2 },
      { id: HN.id, slug: "ha-noi", name: "Hà Nội", count: 1, total: 1 },
      { id: HCM.id, slug: "ho-chi-minh", name: "TP.HCM", count: 0, total: 1 },
    ]);
    // Chiều khác giữ cả hai lọc → không có tin (villa ở Đà Nẵng).
    expect(facets.direction.all).toBe(0);
    expect(facets.handover.counts).toEqual({ raw: 0, basic: 0, full: 0 });
  });

  it("tab danh mục: tin tính vào danh mục của nó và danh mục cha; `all` bỏ lọc danh mục", async () => {
    const { facets } = await run({ categoryIds: [VOUCHER.id], priceMin: 1 });
    expect(facets.category.all).toBe(3);
    expect(facets.category.counts).toEqual({ [SALE.id]: 3, [SALE_CHILD.id]: 1 });
  });
});

describe("listPublicPostListing: nổi bật + phân trang", () => {
  const many: Row[] = Array.from({ length: 20 }, (_, index) => ({
    id: `m${index + 1}`,
    title: `Tin ${index + 1}`,
    isFeatured: index % 2 === 0,
    ...(index === 0 ? { offer: ENDED } : {}),
  }));

  it("≤ 5 tin isFeatured CÒN HIỆU LỰC mới nhất, chỉ trang 1; không lặp trong lưới ở mọi trang; totalDocs gồm nổi bật", async () => {
    const first = await run({}, many);
    // m1 nổi bật nhưng ưu đãi đã kết thúc → không lên slider.
    expect(ids(first.featured)).toEqual(["m3", "m5", "m7", "m9", "m11"]);
    expect(first.featured).toHaveLength(POST_FEATURED_LIMIT);
    expect(first.totalDocs).toBe(20);
    expect(first.totalPages).toBe(Math.ceil(15 / POST_PAGE_SIZE));
    expect(first.docs).toHaveLength(POST_PAGE_SIZE);
    const second = await run({ page: 2 }, many);
    expect(second.featured).toEqual([]);
    const grid = [...ids(first.docs), ...ids(second.docs)];
    expect(grid).toHaveLength(15);
    expect(grid.some((id) => ids(first.featured).includes(id))).toBe(false);
    // Tin ưu đãi đã kết thúc (m1) ở cuối lưới.
    expect(grid.at(-1)).toBe("m1");
  });

  it("nổi bật theo bộ lọc: tin nổi bật không khớp lọc thì không lên slider", async () => {
    const result = await run({ q: "Tin 3" }, many);
    expect(ids(result.featured)).toEqual(["m3"]);
    expect(result).toMatchObject({ docs: [], totalDocs: 1, totalPages: 0 });
  });

  it("trang vượt số trang → lưới rỗng", async () => {
    expect((await run({ page: 9 }, many)).docs).toEqual([]);
  });

  it("chạm trần quét (20 trang x 50) → log cảnh báo, không lỗi", async () => {
    const huge: Row[] = Array.from({ length: 1001 }, (_, index) => ({ id: `h${index}`, title: `H ${index}` }));
    const { payload, warn } = fakePayload(huge);
    const result = await listPublicPostListing(payload, "vi", { page: 1, now: NOW });
    expect(result.totalDocs).toBe(1000);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
