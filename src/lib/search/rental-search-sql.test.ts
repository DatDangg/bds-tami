import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core";
import { describe, expect, it } from "vitest";

import { rentalSearchParamsSchema } from "../../shared/types/api";
import { rentalOrderBy, rentalWhere, searchTerms } from "./rental-search-sql";

const dialect = new PgDialect();
const render = (query: Parameters<PgDialect["sqlToQuery"]>[0]) => dialect.sqlToQuery(query);
const parse = (input: Record<string, unknown>) => rentalSearchParamsSchema.parse(input);

describe("searchTerms", () => {
  it("chuẩn hoá như searchText: bỏ dấu, chữ thường, tách từ; bỏ q rỗng", () => {
    expect(searchTerms("  Căn   Hộ ĐÀ Nẵng ")).toEqual(["can", "ho", "da", "nang"]);
    expect(searchTerms(undefined)).toEqual([]);
    expect(searchTerms("   ")).toEqual([]);
  });

  it("giới hạn số từ", () => {
    expect(searchTerms("a b c d e f g h i j k")).toHaveLength(8);
  });
});

describe("rentalWhere", () => {
  it("giá trị người dùng chỉ đi qua tham số, không nằm trong chuỗi SQL", () => {
    const hostile = "'; DROP TABLE rentals; --";
    const { sql: text, params } = render(rentalWhere(parse({ q: hostile, category: hostile, province: hostile, ward: hostile })));
    expect(text).not.toContain("DROP");
    expect(text).not.toContain("--");
    expect(params).toEqual(expect.arrayContaining([hostile, "%drop%", "%rentals;%"]));
  });

  it("thoát ký tự đại diện của LIKE", () => {
    const { params } = render(rentalWhere(parse({ q: "50%_a\\b" })));
    expect(params).toContain("%50\\%\\_a\\\\b%");
  });

  it("luôn có điều kiện công khai; en thêm hasEnglish, vi thì không", () => {
    const vi = render(rentalWhere(parse({})));
    expect(vi.sql).toContain(`r."status" IN (`);
    expect(vi.sql).toContain(`r."deleted_at" IS NULL`);
    expect(vi.sql).not.toContain("has_english");
    expect(vi.params).toEqual(["published", "rented"]);
    expect(render(rentalWhere(parse({ locale: "en" }))).sql).toContain(`r."has_english" = true`);
  });

  it("bedrooms 4 là >= 4, số khác là bằng", () => {
    expect(render(rentalWhere(parse({ bedrooms: 4 }))).sql).toContain(`r."bedrooms" >= 4`);
    expect(render(rentalWhere(parse({ bedrooms: 2 }))).sql).toContain(`r."bedrooms" = $`);
  });
});

describe("rentalOrderBy", () => {
  it("mỗi kiểu sắp xếp có id chốt thứ tự; giá đặt tin không giá cuối", () => {
    expect(render(rentalOrderBy("newest", "r")).sql).toBe(`ORDER BY r."published_at" DESC NULLS LAST, r."id" DESC`);
    expect(render(rentalOrderBy("price_asc", "page")).sql).toBe(
      `ORDER BY page."price_monthly_vnd" ASC NULLS LAST, page."published_at" DESC NULLS LAST, page."id" DESC`,
    );
    expect(render(rentalOrderBy("price_desc", "r")).sql).toContain(`"price_monthly_vnd" DESC NULLS LAST`);
  });
});
