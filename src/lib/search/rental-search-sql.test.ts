import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core";
import { describe, expect, it } from "vitest";

import { buildPublicWhere, PUBLIC_STATUSES } from "../../access";
import { rentalSearchParamsSchema } from "../../shared/types/api";
import { publicWhere } from "../content/public-queries";
import { allOf, filterConditions, phraseRegex, projectOptionsQuery, rentalConditions, rentalOrderBy, rentalWhere, searchTerms, wordStartRegex } from "./rental-search-sql";

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

  it("amenities: mỗi tiện ích một EXISTS trên rentals_amenities (AND), giá trị đi qua tham số; không truyền thì không có", () => {
    const { sql: text, params } = render(rentalWhere(parse({ amenities: "pool,gym" })));
    expect(text.match(/EXISTS \(SELECT 1 FROM "rentals_amenities" ra WHERE ra\."parent_id" = r\."id" AND ra\."value" = \$\d+\)/g)).toHaveLength(2);
    expect(params).toEqual(expect.arrayContaining(["pool", "gym"]));
    expect(render(rentalWhere(parse({}))).sql).not.toContain("rentals_amenities");
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

describe("project (BL-052)", () => {
  it("lọc theo slug dự án CÔNG KHAI theo locale; giá trị chỉ đi qua tham số", () => {
    const hostile = "x'; DROP TABLE projects; --";
    const vi = render(rentalWhere(parse({ project: hostile })));
    expect(vi.sql).toContain(`r."project_id" IN (SELECT pl."_parent_id" FROM "projects_locales" pl JOIN "projects" p ON p."id" = pl."_parent_id" WHERE pl."_locale" = `);
    expect(vi.sql).toContain(`p."status" IN (`);
    expect(vi.sql).toContain(`p."deleted_at" IS NULL`);
    expect(vi.sql).not.toContain("DROP");
    expect(vi.sql).not.toContain(`p."has_english"`);
    expect(vi.params).toEqual(expect.arrayContaining([hostile, "vi", "published"]));
    expect(render(rentalWhere(parse({ project: "a", locale: "en" }))).sql).toContain(`p."has_english" = true`);
    expect(render(rentalWhere(parse({}))).sql).not.toContain("project_id");
  });

  it("ô Dự án: dự án công khai có tin còn trống, theo tên; en cần bản EN của cả dự án lẫn tin", () => {
    const vi = render(projectOptionsQuery("vi"));
    expect(vi.sql).toContain(`EXISTS (SELECT 1 FROM "rentals" r`);
    expect(vi.sql).toContain(`r."project_id" = p."id"`);
    expect(vi.sql).toContain(`r."status" = 'published'`);
    expect(vi.sql).toContain(`ORDER BY pl."title"`);
    const en = render(projectOptionsQuery("en"));
    expect(en.sql).toContain(`p."has_english" = true`);
    expect(en.sql).toContain(`r."has_english" = true`);
  });
});

describe("rentalConditions / filterConditions (số đếm BL-052)", () => {
  const sqlOf = (conditions: ReturnType<typeof filterConditions>) => render(allOf(conditions)).sql;

  it("phạm vi (công khai + còn trống) tách khỏi bộ lọc; bỏ chiều danh mục chỉ bỏ danh mục", () => {
    const conditions = rentalConditions(parse({ available: true, category: "can-ho", province: "ha-noi", ward: "ba-dinh", bedrooms: 2 }));
    expect(render(allOf(conditions.scope)).sql).toContain(`r."status" = 'published'`);
    const noCategory = sqlOf(filterConditions(conditions, "category"));
    expect(noCategory).not.toContain("categories");
    expect(noCategory).toContain("provinces");
    expect(noCategory).toContain(`r."bedrooms" = `);
  });

  it("bỏ chiều tỉnh bỏ cả phường (phường chỉ có nghĩa trong tỉnh), giữ danh mục và bộ lọc khác", () => {
    const conditions = rentalConditions(parse({ category: "can-ho", province: "ha-noi", ward: "ba-dinh", q: "studio" }));
    const noProvince = sqlOf(filterConditions(conditions, "province"));
    expect(noProvince).not.toContain("province");
    expect(noProvince).not.toContain("ward_id");
    expect(noProvince).toContain("categories");
    expect(noProvince).toContain("search_text");
  });

  it("không bộ lọc → true (dùng được trong FILTER); rentalWhere = phạm vi + mọi bộ lọc", () => {
    expect(render(allOf([])).sql).toBe("true");
    const params = parse({ category: "a", province: "b", furnishing: "full" });
    const conditions = rentalConditions(params);
    expect(render(rentalWhere(params)).sql).toBe(`WHERE ${render(allOf([...conditions.scope, ...filterConditions(conditions)])).sql}`);
  });
});

/** BL-080: `can ho` không được khớp "c**ho**" / "cần" — mỗi từ phải là ĐẦU một từ trong `search_text`. Regex chạy bằng engine JS tương đương (`[[:alnum:]]` ↔ `[a-z0-9]`). */
const toJsRegex = (pattern: string) => new RegExp(pattern.replaceAll("[^[:alnum:]]", "[^a-z0-9]"));

describe("BL-080: khớp đầu từ", () => {
  it("giữ LIKE trên search_text (index trigram) và thêm điều kiện đầu từ cho từng từ", () => {
    const { sql: text, params } = render(rentalWhere(parse({ q: "can ho" })));
    expect(text.match(/rl\."search_text" LIKE \$/g)).toHaveLength(2);
    expect(text.match(/rl\."search_text" ~ \$/g)).toHaveLength(2);
    expect(params).toEqual(expect.arrayContaining(["%can%", "%ho%", wordStartRegex("can"), wordStartRegex("ho")]));
  });

  it("'can ho' không khớp tin chỉ chứa can/cho rời rạc, khớp 'can ho vinhomes'", () => {
    const matches = (text: string) => ["can", "ho"].every((term) => toJsRegex(wordStartRegex(term)).test(text));
    expect(matches("can cho thue van phong")).toBe(false);
    expect(matches("san van phong xuan dieu cho thue can")).toBe(false);
    expect(matches("can ho vinhomes co loa")).toBe(true);
    expect(matches("studio (can ho) q1, ha noi")).toBe(true);
  });

  it("'ho' khớp 'hoang', không khớp 'cho'; mã tin ct-000012 / 'ct 000012' vẫn khớp", () => {
    expect(toJsRegex(wordStartRegex("ho")).test("hoang mai")).toBe(true);
    expect(toJsRegex(wordStartRegex("ho")).test("cho thue")).toBe(false);
    const code = "ct-000012 can ho 2pn";
    expect(toJsRegex(wordStartRegex("ct-000012")).test(code)).toBe(true);
    expect(["ct", "000012"].every((term) => toJsRegex(wordStartRegex(term)).test(code))).toBe(true);
  });

  it("thoát ký tự regex trong từ khoá", () => {
    expect(wordStartRegex("c++(a)")).toBe(String.raw`(^|[^[:alnum:]])c\+\+\(a\)`);
    expect(toJsRegex(wordStartRegex("a.b")).test("axb")).toBe(false);
    expect(() => toJsRegex(wordStartRegex("[a.*"))).not.toThrow();
  });

  it("cụm: chỉ có khi ≥ 2 từ; các từ liền nhau đúng thứ tự", () => {
    expect(phraseRegex(["can"])).toBeUndefined();
    const phrase = toJsRegex(phraseRegex(["can", "ho"]) as string);
    expect(phrase.test("can ho vinhomes")).toBe(true);
    expect(phrase.test("chung cu, can-ho 2pn")).toBe(true);
    expect(phrase.test("ho can")).toBe(false);
    expect(phrase.test("can 2 ho")).toBe(false);
  });
});

describe("BL-080: sort mặc định ưu tiên khớp nguyên cụm", () => {
  it("newest + q ≥ 2 từ: khớp cụm trước (r: biểu thức; page: cột phrase_match), rồi newest + id", () => {
    const direct = render(rentalOrderBy("newest", "r", "can ho"));
    expect(direct.sql).toBe(`ORDER BY (rl."search_text" ~ $1) DESC, r."published_at" DESC NULLS LAST, r."id" DESC`);
    expect(direct.params).toEqual([phraseRegex(["can", "ho"])]);
    expect(render(rentalOrderBy("newest", "page", "can ho")).sql).toBe(`ORDER BY page."phrase_match" DESC, page."published_at" DESC NULLS LAST, page."id" DESC`);
  });

  it("không đổi khi q rỗng / 1 từ / sort giá", () => {
    expect(render(rentalOrderBy("newest", "r", "can")).sql).toBe(`ORDER BY r."published_at" DESC NULLS LAST, r."id" DESC`);
    expect(render(rentalOrderBy("newest", "r", undefined)).sql).toBe(`ORDER BY r."published_at" DESC NULLS LAST, r."id" DESC`);
    expect(render(rentalOrderBy("price_asc", "page", "can ho")).sql).toBe(
      `ORDER BY page."price_monthly_vnd" ASC NULLS LAST, page."published_at" DESC NULLS LAST, page."id" DESC`,
    );
    expect(render(rentalOrderBy("price_desc", "r", "can ho")).sql).not.toContain("search_text");
  });

  it("đếm/facet dùng cùng điều kiện với danh sách (nằm trong `other`); không q thì không có điều kiện từ khoá", () => {
    expect(rentalConditions(parse({ q: "can ho" })).other).toHaveLength(4);
    expect(render(allOf(filterConditions(rentalConditions(parse({}))))).sql).not.toContain("search_text");
  });
});
