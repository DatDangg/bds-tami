import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core";
import { describe, expect, it } from "vitest";

import { rentalSearchParamsSchema } from "../../shared/types/api";
import type { SqlFragment } from "./rental-search-sql";
import { PostgresRentalSearch, RENTAL_FEATURED_LIMIT, type SqlExecutor, toFacets } from "./search-service";

const dialect = new PgDialect();
const parse = (input: Record<string, unknown>) => rentalSearchParamsSchema.parse({ available: true, ...input });

const row = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  code: `CT-${id}`,
  title: `Tin ${id}`,
  slug: `tin-${id}`,
  status: "published",
  price_monthly_vnd: "9000000",
  price_negotiable: false,
  area_m2: "40",
  bedrooms: 1,
  bathrooms: 1,
  furnishing: "full",
  province_name: "Hà Nội",
  province_slug: "ha-noi",
  ward_name: "Phường Ba Đình",
  ward_slug: "ba-dinh",
  category_name: null,
  category_slug: null,
  published_at: null,
  ...extra,
});

/** Executor giả: trả hàng theo loại truy vấn (đếm / số đếm theo chiều / nổi bật / lưới) và ghi lại SQL đã chạy. */
function fakeExecutor(data: { total: number; featuredCount: number; featured: string[]; grid: string[]; facets?: Record<string, unknown>[] }) {
  const queries: string[] = [];
  const executor: SqlExecutor = {
    async execute(query: SqlFragment) {
      const { sql } = dialect.sqlToQuery(query);
      queries.push(sql);
      if (sql.includes("GROUPING SETS")) return { rows: data.facets ?? [] };
      if (sql.includes("count(*)::int AS total")) return { rows: [{ total: data.total, featured: data.featuredCount }] };
      if (sql.includes(`NOT IN (SELECT r."id"`)) return { rows: data.grid.map((id) => row(id)) };
      return { rows: data.featured.map((id) => row(id)) };
    },
  };
  return { executor, queries };
}

describe("PostgresRentalSearch.listing (BL-052)", () => {
  it("trang 1: nổi bật riêng, lưới loại nổi bật bằng truy vấn con, total gồm nổi bật, totalPages tính trên phần còn lại", async () => {
    const { executor, queries } = fakeExecutor({ total: 30, featuredCount: 5, featured: ["f1", "f2"], grid: ["a", "b"] });
    const result = await new PostgresRentalSearch(executor).listing(parse({ page: 1, limit: 12 }));
    expect(result.featured.map((card) => card.id)).toEqual(["f1", "f2"]);
    expect(result.items.map((card) => card.id)).toEqual(["a", "b"]);
    expect(result).toMatchObject({ total: 30, page: 1, totalPages: Math.ceil(25 / 12) });
    expect(queries).toHaveLength(4);
    const grid = queries.find((sql) => sql.includes("NOT IN"))!;
    expect(grid).toContain(`r."is_featured" = true ORDER BY r."published_at" DESC NULLS LAST, r."id" DESC LIMIT $`);
    const featured = queries.find((sql) => !sql.includes("NOT IN") && sql.includes("WITH page AS"))!;
    expect(featured).toContain(`AND r."is_featured" = true ORDER BY r."published_at" DESC`);
  });

  it("trang > 1: không trả nổi bật (không truy vấn thẻ nổi bật) nhưng lưới vẫn loại chúng", async () => {
    const { executor, queries } = fakeExecutor({ total: 30, featuredCount: 5, featured: ["f1"], grid: ["m"] });
    const result = await new PostgresRentalSearch(executor).listing(parse({ page: 2, limit: 12 }));
    expect(result.featured).toEqual([]);
    expect(result.items.map((card) => card.id)).toEqual(["m"]);
    expect(queries).toHaveLength(3);
    expect(queries.some((sql) => sql.includes("NOT IN"))).toBe(true);
  });

  it("đếm nổi bật bị chặn ở trần RENTAL_FEATURED_LIMIT ngay trong SQL", async () => {
    const { executor, queries } = fakeExecutor({ total: 0, featuredCount: 0, featured: [], grid: [] });
    await new PostgresRentalSearch(executor).listing(parse({}));
    expect(queries.find((sql) => sql.includes("count(*)::int AS total"))).toContain("LEAST(count(*) FILTER (WHERE r.\"is_featured\" = true), $");
    expect(RENTAL_FEATURED_LIMIT).toBe(5);
  });

  it("thẻ có danh mục khi SQL trả tên + slug; thiếu → null", async () => {
    const { executor } = fakeExecutor({ total: 1, featuredCount: 0, featured: [], grid: [] });
    const search = new PostgresRentalSearch({
      execute: async (query) => (dialect.sqlToQuery(query).sql.includes("WITH page AS") ? { rows: [row("a", { category_name: "Căn hộ", category_slug: "can-ho" }), row("b")] } : executor.execute(query)),
    });
    const { items } = await search.search(parse({}));
    expect(items.map((card) => card.category)).toEqual([{ name: "Căn hộ", slug: "can-ho" }, null]);
  });
});

describe("toFacets", () => {
  it("hàng GROUPING SETS → số đếm tab theo danh mục cấp 1, tổng 'Tất cả', tỉnh (count theo lọc, total không lọc)", () => {
    const facets = toFacets([
      { by_root: 0, by_province: 1, root_id: "c1", province_id: null, total: 7, without_category: 4, without_province: 6 },
      { by_root: 0, by_province: 1, root_id: "c2", province_id: null, total: 3, without_category: 0, without_province: 1 },
      // Tin không có danh mục: chỉ góp vào "Tất cả".
      { by_root: 0, by_province: 1, root_id: null, province_id: null, total: 1, without_category: 1, without_province: 1 },
      { by_root: 1, by_province: 0, root_id: null, province_id: "p1", total: 8, without_category: 4, without_province: 5 },
      { by_root: 1, by_province: 0, root_id: null, province_id: "p2", total: 3, without_category: 1, without_province: 0 },
      { by_root: 1, by_province: 1, root_id: null, province_id: null, total: 11, without_category: 5, without_province: 8 },
    ]);
    expect(facets.category).toEqual({ all: 5, counts: { c1: 4, c2: 0 } });
    expect(facets.provinces).toEqual([
      { provinceId: "p1", count: 5, total: 8 },
      { provinceId: "p2", count: 0, total: 3 },
    ]);
  });

  it("không có tin → 0, không tỉnh", () => {
    expect(toFacets([{ by_root: 1, by_province: 1, root_id: null, province_id: null, total: 0, without_category: 0, without_province: 0 }])).toEqual({
      category: { all: 0, counts: {} },
      provinces: [],
    });
  });
});
