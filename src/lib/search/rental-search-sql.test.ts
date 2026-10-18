import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core";
import { describe, expect, it } from "vitest";

import { buildPublicWhere, PUBLIC_STATUSES } from "../../access";
import { rentalSearchParamsSchema } from "../../shared/types/api";
import { publicWhere } from "../content/public-queries";
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

describe("rentalWhere: phạm vi theo tỉnh, danh mục, trạng thái", () => {
  it("phường chỉ khớp TRONG tỉnh đã chọn (join provinces theo slug)", () => {
    const { sql: text, params } = render(rentalWhere(parse({ province: "ha-noi", ward: "ba-dinh" })));
    expect(text).toContain(`JOIN "provinces" p ON p."id" = w."province_id" WHERE w."slug" = `);
    expect(params).toEqual(expect.arrayContaining(["ba-dinh", "ha-noi"]));
  });

  it("ward không kèm province bị schema từ chối (slug phường chỉ duy nhất trong tỉnh)", () => {
    expect(rentalSearchParamsSchema.safeParse({ ward: "ba-dinh" }).success).toBe(false);
    expect(rentalSearchParamsSchema.safeParse({ province: "ha-noi", ward: "ba-dinh" }).success).toBe(true);
  });

  it("danh mục cha khớp theo slug cũng phải chưa xoá mềm", () => {
    const { sql: text } = render(rentalWhere(parse({ category: "can-ho" })));
    expect(text).toContain(`t."scope" = 'rental' AND t."deleted_at" IS NULL`);
  });

  it("available=true thêm điều kiện published (trang S04 không liệt kê tin đã thuê); mặc định/false thì không", () => {
    expect(render(rentalWhere(parse({}))).sql).not.toContain(`r."status" = 'published'`);
    expect(render(rentalWhere(parse({ available: "false" }))).sql).not.toContain(`r."status" = 'published'`);
    expect(render(rentalWhere(parse({ available: "true" }))).sql).toContain(`r."status" = 'published'`);
    expect(render(rentalWhere(parse({ available: true }))).sql).toContain(`r."status" = 'published'`);
    expect(rentalSearchParamsSchema.safeParse({ available: "yes" }).success).toBe(false);
  });
});

/**
 * `rental-search-sql.ts` chép tay điều kiện công khai của `buildPublicWhere`. Snapshot này ĐỎ khi `buildPublicWhere` đổi (vd thêm hẹn giờ
 * `publishedAt` FR-ADM-16): người sửa phải cập nhật `publicConditions` rồi mới cập nhật snapshot.
 */
describe("điều kiện công khai khớp buildPublicWhere", () => {
  it("snapshot buildPublicWhere(rentals) và publicWhere(rentals, vi|en)", () => {
    expect(buildPublicWhere(PUBLIC_STATUSES.rentals)).toMatchInlineSnapshot(`
      {
        "and": [
          {
            "status": {
              "in": [
                "published",
                "rented",
              ],
            },
          },
          {
            "deletedAt": {
              "exists": false,
            },
          },
        ],
      }
    `);
    expect(publicWhere("rentals", "vi")).toMatchInlineSnapshot(`
      {
        "and": [
          {
            "status": {
              "in": [
                "published",
                "rented",
              ],
            },
          },
          {
            "deletedAt": {
              "exists": false,
            },
          },
        ],
      }
    `);
    expect(publicWhere("rentals", "en")).toMatchInlineSnapshot(`
      {
        "and": [
          {
            "and": [
              {
                "status": {
                  "in": [
                    "published",
                    "rented",
                  ],
                },
              },
              {
                "deletedAt": {
                  "exists": false,
                },
              },
            ],
          },
          {
            "hasEnglish": {
              "equals": true,
            },
          },
        ],
      }
    `);
  });

  it("SQL chép tay có đúng các điều kiện đó: trạng thái công khai, chưa xoá mềm, en cần hasEnglish", () => {
    const vi = render(rentalWhere(parse({})));
    expect(vi.params).toEqual([...PUBLIC_STATUSES.rentals]);
    expect(vi.sql).toContain(`r."deleted_at" IS NULL`);
    expect(render(rentalWhere(parse({ locale: "en" }))).sql).toContain(`r."has_english" = true`);
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
