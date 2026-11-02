import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { reindexRentalSearchText } from "../../src/lib/search/reindex-rental-search-text";
import { parseRentalFilters, toRentalSearchParams } from "../../src/lib/search/url-params";
import { PostgresRentalSearch, sqlExecutorOf } from "../../src/lib/search/search-service";
import { type RentalCard, rentalSearchParamsSchema } from "../../src/shared/types/api";

const baseUrl = process.env.DATABASE_URL_TEST;
const hasRedis = Boolean(process.env.REDIS_URL);

const lexical = (text: string) => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [{ type: "paragraph", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "text", version: 1, text }] }],
  },
});

/** Tên các khoá được phép có trong một `RentalCard` (API_SPEC §3.3); `address` chỉ khi `showExactAddress`. */
const CARD_KEYS = [
  "id", "code", "title", "slug", "status", "thumbnail", "priceMonthlyVnd", "priceNegotiable", "areaM2", "bedrooms", "bathrooms",
  "furnishing", "province", "ward", "category", "address", "publishedAt",
];

/** DB tạm chạy migration thật (gồm index trigram) + config thật. Redis chỉ cần cho test endpoint (rate limit). */
describe.skipIf(!baseUrl)("integration: SearchService + GET /api/public/rentals (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_search_${runId}`;
  const ips: string[] = [];
  const titles = new Map<string, string>();
  let testUrl = "";
  let payload: Payload;
  let service: PostgresRentalSearch;
  let admin: { id: string; collection: "staff" } & Record<string, unknown>;
  const imageIds: string[] = [];
  const ids: Record<string, string> = {};
  let hcmId = "";
  let hnId = "";
  let sgWardId = "";
  let baDinhWardId = "";
  let rootCategoryId = "";
  let childCategoryId = "";
  let houseCategoryId = "";
  let projectId = "";

  const search = (params: Record<string, unknown> = {}) => service.search(rentalSearchParamsSchema.parse(params));
  const titlesOf = async (params: Record<string, unknown> = {}) => (await search(params)).items.map((card) => titles.get(card.id) ?? card.title);

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  const createRental = async (key: string, title: string, data: Record<string, unknown> = {}) => {
    const doc = await payload.create({
      collection: "rentals",
      data: {
        title,
        description: lexical("Mô tả"),
        category: rootCategoryId,
        province: hcmId,
        ward: sgWardId,
        address: "12 Đường Test",
        priceMonthlyVnd: 10_000_000,
        areaM2: 40,
        status: "published",
        gallery: imageIds,
        ...data,
      } as never,
      locale: "vi",
      user: admin as never,
      overrideAccess: false,
      depth: 0,
    });
    ids[key] = doc.id;
    titles.set(doc.id, title);
    return doc;
  };

  const getHandler = (query: string, ip: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api/public/rentals?${query}`, { method: "GET", headers: { "CF-Connecting-IP": ip } }),
    });

  const newIp = () => {
    const ip = `203.0.113.${ips.length + 1}`;
    ips.push(ip);
    return ip;
  };

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const url = new URL(baseUrl!);
    url.pathname = `/${dbName}`;
    testUrl = url.toString();
    process.env.DATABASE_URL = testUrl;
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    service = new PostgresRentalSearch(sqlExecutorOf(payload));

    admin = {
      ...(await payload.create({
        collection: "staff",
        overrideAccess: true,
        data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Admin", role: ROLES.admin, active: true },
      })),
      collection: "staff",
    } as typeof admin;
    for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type, url, sizes_card_url) VALUES ($1, $2, $3) RETURNING id`, [mimeType, "/api/media/file/goc.jpg", "/api/media/file/card.jpg"]));
      imageIds.push(inserted.rows[0].id as string);
    }
    hcmId = (await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })).id;
    hnId = (await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })).id;
    sgWardId = (
      await payload.create({
        collection: "wards",
        data: { province: hcmId, code: "70101063", name: "Phường Sài Gòn", type: "phuong", slug: "sai-gon", legacyNames: [{ name: "Phường Bến Nghé, Quận 1" }] },
        overrideAccess: true,
      })
    ).id;
    baDinhWardId = (await payload.create({ collection: "wards", data: { province: hnId, code: "00004", name: "Phường Ba Đình", type: "phuong", slug: "ba-dinh" }, overrideAccess: true })).id;
    const category = (name: string, parent?: string) =>
      payload.create({ collection: "categories", data: { name, scope: "rental", ...(parent ? { parent } : {}) } as never, locale: "vi", overrideAccess: true, depth: 0 });
    rootCategoryId = (await category("Căn hộ")).id;
    childCategoryId = (await category("Căn hộ dịch vụ", rootCategoryId)).id;
    houseCategoryId = (await category("Nhà phố")).id;
    const projectCategoryId = (await payload.create({ collection: "categories", data: { name: "Dự án căn hộ", scope: "project" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id;
    projectId = (
      await payload.create({
        collection: "projects",
        data: { title: "Dự án Alpha", summary: "Tóm tắt", overview: lexical("Tổng quan"), category: projectCategoryId, province: hcmId, salesStatus: "selling" } as never,
        locale: "vi",
        user: admin as never,
        overrideAccess: false,
        depth: 0,
      })
    ).id;

    // Dữ liệu: 6 tin công khai khác nhau + các tin khách không được thấy.
    await createRental("a", "Căn hộ dịch vụ Bến Nghé", { category: childCategoryId, priceMonthlyVnd: 12_000_000, areaM2: 45, bedrooms: 1, furnishing: "full", amenities: ["pool", "gym", "elevator"] });
    await createRental("b", "Studio gần chợ", { priceMonthlyVnd: 6_000_000, areaM2: 25, bedrooms: 0, furnishing: "none", address: "5 Phố Bí Mật", showExactAddress: true, amenities: ["gym"] });
    await createRental("c", "Nhà phố Ba Đình rộng", { category: houseCategoryId, province: hnId, ward: baDinhWardId, priceMonthlyVnd: 30_000_000, areaM2: 120, bedrooms: 4, furnishing: "basic" });
    await createRental("d", "Biệt thự năm phòng ngủ", { category: houseCategoryId, priceMonthlyVnd: 55_000_000, areaM2: 300, bedrooms: 5, furnishing: "full" });
    await createRental("e", "Căn hộ thương lượng", { priceMonthlyVnd: undefined, priceNegotiable: true, areaM2: 60, bedrooms: 2 });
    const rented = await createRental("f", "Căn hộ đã cho thuê", { priceMonthlyVnd: 9_000_000, areaM2: 50, bedrooms: 2 });
    await payload.update({ collection: "rentals", id: rented.id, data: { status: "rented" }, locale: "vi", user: admin as never, overrideAccess: false, depth: 0 });
    await createRental("draft", "Tin nháp căn hộ", { status: "draft", gallery: [] });
    const hidden = await createRental("hidden", "Tin ẩn căn hộ");
    await payload.update({ collection: "rentals", id: hidden.id, data: { status: "hidden" }, locale: "vi", user: admin as never, overrideAccess: false, depth: 0 });
    const gone = await createRental("gone", "Tin xoá căn hộ");
    await payload.update({ collection: "rentals", id: gone.id, data: { deletedAt: new Date().toISOString() }, locale: "vi", user: admin as never, overrideAccess: false, depth: 0 });
    // Bản tiếng Anh cho tin a.
    await payload.update({
      collection: "rentals",
      id: ids.a!,
      data: { title: "Serviced apartment Ben Nghe", description: lexical("en"), hasEnglish: true } as never,
      locale: "en",
      overrideAccess: true,
    });
  }, 180_000);

  afterAll(async () => {
    if (hasRedis) {
      const { getRedis, closeRedis } = await import("../../src/lib/redis");
      const { ipHash } = await import("../../src/lib/security/ip-hash");
      if (ips.length > 0) await getRedis().del(...ips.map((ip) => `rl:rentals:${ipHash(ip)}`));
      await closeRedis();
    }
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  describe("hạ tầng", () => {
    it("migration tạo extension pg_trgm và index GIN trigram trên rentals_locales.search_text", async () => {
      const result = await withDatabase((client) =>
        client.query(`SELECT (SELECT count(*)::int FROM pg_extension WHERE extname = 'pg_trgm') AS ext, (SELECT indexdef FROM pg_indexes WHERE indexname = 'rentals_locales_search_text_trgm_idx') AS def`),
      );
      expect(result.rows[0].ext).toBe(1);
      expect(result.rows[0].def).toMatch(/USING gin \(search_text gin_trgm_ops\)/);
    });
  });

  describe("công khai", () => {
    it("chỉ published + rented chưa xoá mềm; cùng tập với findPublicList (vi và en)", async () => {
      const { findPublicList } = await import("../../src/lib/content/public-queries");
      for (const locale of ["vi", "en"] as const) {
        const viaService = (await search({ locale, limit: 48 })).items.map((card) => card.id).sort();
        const viaPayload = (await findPublicList<{ id: string }>(payload, "rentals", locale, { limit: 50, depth: 0 })).docs.map((doc) => doc.id).sort();
        expect(viaService).toEqual(viaPayload);
      }
      const all = await titlesOf({ limit: 48 });
      expect(all).toHaveLength(6);
      for (const unseen of ["Tin nháp căn hộ", "Tin ẩn căn hộ", "Tin xoá căn hộ"]) expect(all).not.toContain(unseen);
      expect(all).toContain("Căn hộ đã cho thuê");
    });

    it("/en chỉ có tin hasEnglish và dùng chữ tiếng Anh", async () => {
      const result = await search({ locale: "en" });
      expect(result.total).toBe(1);
      expect(result.items[0]).toMatchObject({ title: "Serviced apartment Ben Nghe", slug: "serviced-apartment-ben-nghe" });
    });
  });

  describe("từ khoá", () => {
    it("gõ có dấu, không dấu, hoa/thường đều ra cùng kết quả", async () => {
      const withAccent = await titlesOf({ q: "Căn hộ dịch vụ" });
      expect(withAccent).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ q: "can ho dich vu" })).toEqual(withAccent);
      expect(await titlesOf({ q: "CAN HO DICH VU" })).toEqual(withAccent);
      expect(await titlesOf({ q: "  dịch   VỤ " })).toEqual(withAccent);
    });

    it("khớp tên cũ của phường, mã tin và từ trong địa chỉ; nhiều từ là AND", async () => {
      expect(await titlesOf({ q: "quan 1", limit: 48 })).toHaveLength(5);
      const code = (await payload.findByID({ collection: "rentals", id: ids.b!, depth: 0, overrideAccess: true })).code;
      expect(await titlesOf({ q: code.toLowerCase() })).toEqual(["Studio gần chợ"]);
      expect(await titlesOf({ q: "bi mat" })).toEqual(["Studio gần chợ"]);
      expect(await titlesOf({ q: "can ho khong ton tai" })).toEqual([]);
    });

    it("BL-103: ≥ 2 từ phải liền nhau đúng thứ tự (cụm), đếm tổng khớp danh sách; 1 từ giữ khớp đầu từ", async () => {
      // Tin c "Nhà phố Ba Đình rộng": "ba rong" / "pho dinh" từng khớp vì AND từng từ rời rạc.
      expect(await titlesOf({ q: "ba dinh" })).toEqual(["Nhà phố Ba Đình rộng"]);
      expect(await titlesOf({ q: "BA ĐÌNH" })).toEqual(["Nhà phố Ba Đình rộng"]);
      expect(await titlesOf({ q: "pho ba" })).toEqual(["Nhà phố Ba Đình rộng"]);
      for (const q of ["ba rong", "pho dinh", "dinh ba"]) {
        expect(await titlesOf({ q })).toEqual([]);
        expect((await search({ q })).total).toBe(0);
      }
      expect((await search({ q: "ba dinh" })).total).toBe(1);
      expect(await titlesOf({ q: "dinh" })).toEqual(["Nhà phố Ba Đình rộng"]);
    });

    it("tiếng Anh: tìm theo searchText bản en, vẫn gõ địa danh tiếng Việt không dấu", async () => {
      expect((await search({ locale: "en", q: "serviced" })).total).toBe(1);
      expect((await search({ locale: "en", q: "ben nghe" })).total).toBe(1);
      expect((await search({ locale: "en", q: "studio" })).total).toBe(0);
    });

    it("% và _ trong q là chữ thường, không phải ký tự đại diện của LIKE", async () => {
      expect((await search({ q: "%" })).total).toBe(0);
      expect((await search({ q: "_" })).total).toBe(0);
      expect((await search({ q: "can_ho" })).total).toBe(0);
    });

    it("chuỗi injection trong q (và các bộ lọc chữ) không lỗi, không thay đổi dữ liệu", async () => {
      const payloads = ["'; DROP TABLE rentals; --", "\" OR 1=1 --", "\\", "' UNION SELECT address FROM rentals --", "a'||(SELECT 1)||'"];
      for (const q of payloads) {
        const result = await search({ q, category: q, province: q, ward: q });
        expect(result.total).toBe(0);
        expect((await search({ q })).items).toEqual([]);
      }
      expect((await search({ limit: 48 })).total).toBe(6);
    });
  });

  describe("bộ lọc", () => {
    it("category: danh mục cha gồm cả danh mục con; danh mục con chỉ tin của nó; slug theo locale", async () => {
      expect(await titlesOf({ category: "can-ho", limit: 48 })).toHaveLength(4);
      expect(await titlesOf({ category: "can-ho-dich-vu" })).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ category: "nha-pho", limit: 48 })).toHaveLength(2);
      expect((await search({ category: "khong-co" })).total).toBe(0);
      expect((await search({ locale: "en", category: "can-ho-dich-vu" })).total).toBe(0);
    });

    it("province + ward", async () => {
      expect(await titlesOf({ province: "ha-noi" })).toEqual(["Nhà phố Ba Đình rộng"]);
      expect(await titlesOf({ province: "ha-noi", ward: "ba-dinh" })).toEqual(["Nhà phố Ba Đình rộng"]);
      // Slug phường chỉ duy nhất trong tỉnh: `ward` không kèm `province` là mơ hồ nên schema từ chối.
      expect(rentalSearchParamsSchema.safeParse({ ward: "ba-dinh" }).success).toBe(false);
      expect((await search({ province: "ho-chi-minh", limit: 48 })).total).toBe(5);
      expect((await search({ province: "ha-noi", ward: "sai-gon" })).total).toBe(0);
    });

    it("danh mục cha đã xoá mềm không còn khớp (kể cả tin của danh mục con còn sống)", async () => {
      await withDatabase((client) => client.query(`UPDATE "categories" SET "deleted_at" = now() WHERE "id" = $1`, [rootCategoryId]));
      try {
        expect((await search({ category: "can-ho" })).total).toBe(0);
      } finally {
        await withDatabase((client) => client.query(`UPDATE "categories" SET "deleted_at" = NULL WHERE "id" = $1`, [rootCategoryId]));
      }
      expect((await search({ category: "can-ho", limit: 48 })).total).toBe(4);
    });

    it("available=true (trang S04): bỏ tin đã thuê; mặc định API vẫn trả cả hai", async () => {
      expect((await search({ limit: 48, available: true })).total).toBe(5);
      expect((await search({ limit: 48 })).total).toBe(6);
      expect((await search({ limit: 48, available: "false" })).total).toBe(6);
      expect((await search({ limit: 48, province: "ho-chi-minh", available: "true" })).items.map((card) => card.status)).not.toContain("rented");
    });

    it("khoảng giá và diện tích gồm cả hai đầu; tin thương lượng (không giá) bị loại khi lọc giá", async () => {
      expect((await titlesOf({ priceMin: 6_000_000, priceMax: 12_000_000, sort: "price_asc" }))).toEqual(["Studio gần chợ", "Căn hộ đã cho thuê", "Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ priceMin: 40_000_000 })).toEqual(["Biệt thự năm phòng ngủ"]);
      expect((await titlesOf({ areaMin: 25, areaMax: 45, sort: "price_asc" }))).toEqual(["Studio gần chợ", "Căn hộ dịch vụ Bến Nghé"]);
    });

    it("bedrooms: số đúng; 4 nghĩa là 4 trở lên; 0 là studio", async () => {
      expect(await titlesOf({ bedrooms: 1 })).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ bedrooms: 0 })).toEqual(["Studio gần chợ"]);
      expect((await titlesOf({ bedrooms: 4, sort: "price_asc" }))).toEqual(["Nhà phố Ba Đình rộng", "Biệt thự năm phòng ngủ"]);
    });

    it("furnishing + tổ hợp nhiều bộ lọc", async () => {
      expect((await titlesOf({ furnishing: "full", sort: "price_asc" }))).toEqual(["Căn hộ dịch vụ Bến Nghé", "Biệt thự năm phòng ngủ"]);
      expect(await titlesOf({ furnishing: "full", category: "nha-pho", province: "ho-chi-minh", bedrooms: 4, priceMin: 50_000_000, q: "biet thu" })).toEqual(["Biệt thự năm phòng ngủ"]);
      expect(await titlesOf({ furnishing: "full", q: "studio" })).toEqual([]);
    });

    it("amenities (BL-044): tin phải có ĐỦ mọi tiện ích (AND); giá trị lạ bị bỏ (không 400); tin không có tiện ích không khớp", async () => {
      expect((await titlesOf({ amenities: "gym", sort: "price_asc" }))).toEqual(["Studio gần chợ", "Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ amenities: "pool,gym" })).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ amenities: ["gym", "pool"] })).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
      expect(await titlesOf({ amenities: "pool,kitchen" })).toEqual([]);
      expect((await titlesOf({ amenities: "gym,khong-co", sort: "price_asc" }))).toEqual(["Studio gần chợ", "Căn hộ dịch vụ Bến Nghé"]);
      expect((await search({ amenities: "khong-co", limit: 48 })).total).toBe(6);
      expect(await titlesOf({ amenities: "pool", q: "studio" })).toEqual([]);
    });
  });

  /** Trang danh mục Cho thuê (layer-9-task-08): `findRentalCategory` quyết định 404 (slug lạ / xoá mềm / chưa có EN) và cấp tin theo danh mục + con. */
  describe("trang danh mục /cho-thue/danh-muc/[category]", () => {
    it("tìm theo slug đúng ngôn ngữ, đúng scope rental; cha được populate ở danh mục con", async () => {
      const { findRentalCategory } = await import("../../src/lib/rentals/rental-list-queries");
      expect(await findRentalCategory(payload, "vi", "can-ho")).toMatchObject({ id: rootCategoryId, slug: "can-ho" });
      const child = await findRentalCategory(payload, "vi", "can-ho-dich-vu");
      expect(child).toMatchObject({ id: childCategoryId });
      expect(child?.parent).toMatchObject({ id: rootCategoryId, slug: "can-ho" });
      // Slug lạ, slug của scope khác (danh mục dự án) và slug chưa có bản EN đều là 404.
      expect(await findRentalCategory(payload, "vi", "khong-co")).toBeNull();
      expect(await findRentalCategory(payload, "vi", "du-an-can-ho")).toBeNull();
      expect(await findRentalCategory(payload, "en", "can-ho")).toBeNull();
    });

    it("danh mục xoá mềm → null (và tin của nó không được liệt kê qua trang)", async () => {
      const { findRentalCategory } = await import("../../src/lib/rentals/rental-list-queries");
      await withDatabase((client) => client.query(`UPDATE "categories" SET "deleted_at" = now() WHERE "id" = $1`, [houseCategoryId]));
      try {
        expect(await findRentalCategory(payload, "vi", "nha-pho")).toBeNull();
      } finally {
        await withDatabase((client) => client.query(`UPDATE "categories" SET "deleted_at" = NULL WHERE "id" = $1`, [houseCategoryId]));
      }
      expect(await findRentalCategory(payload, "vi", "nha-pho")).toMatchObject({ id: houseCategoryId });
    });

    it("tin của trang: danh mục cha gồm tin của con, danh mục con chỉ tin của nó (đúng tập mà trang gọi SearchService)", async () => {
      const filters = parseRentalFilters({ province: "ho-chi-minh" });
      const forCategory = async (category: string) =>
        (await service.search(toRentalSearchParams({ ...filters, category }, "vi"))).items.map((card) => card.title);
      expect(await forCategory("can-ho-dich-vu")).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
      expect(await forCategory("can-ho")).toContain("Căn hộ dịch vụ Bến Nghé");
      expect((await forCategory("can-ho")).length).toBeGreaterThan(1);
    });
  });

  /** Trang /cho-thue (layer-8-task-03): URL -> `parseRentalFilters` -> `toRentalSearchParams` -> SearchService, đúng đường trang đi. */
  describe("URL của trang /cho-thue -> đúng tập kết quả", () => {
    const viaUrl = async (query: string, locale: "vi" | "en" = "vi") => {
      const filters = parseRentalFilters(Object.fromEntries(new URLSearchParams(query)));
      const result = await service.search(toRentalSearchParams(filters, locale));
      return { total: result.total, titles: result.items.map((card) => card.title), statuses: result.items.map((card) => card.status) };
    };

    it("không lọc: chỉ tin còn trống (không có tin đã thuê), 12/trang, mới nhất trước", async () => {
      const result = await viaUrl("");
      expect(result.total).toBe(5);
      expect(result.statuses).not.toContain("rented");
      expect(result.titles).not.toContain("Căn hộ đã cho thuê");
    });

    it("từ khoá không dấu + bộ lọc; tham số lạ bị bỏ qua", async () => {
      expect((await viaUrl("q=studio&bedrooms=0&utm_source=fb&limit=999")).titles).toEqual(["Studio gần chợ"]);
      expect((await viaUrl("q=CAN HO DICH VU")).titles).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
    });

    it("danh mục cha gồm danh mục con + tỉnh + khoảng giá + nội thất", async () => {
      expect((await viaUrl("category=can-ho&province=ho-chi-minh")).total).toBe(3);
      expect((await viaUrl("category=can-ho&province=ho-chi-minh&priceMin=10000000&furnishing=full")).titles).toEqual(["Căn hộ dịch vụ Bến Nghé"]);
    });

    it("phường theo tỉnh; phường không kèm tỉnh bị bỏ (URL không làm trang lỗi)", async () => {
      expect((await viaUrl("province=ha-noi&ward=ba-dinh")).titles).toEqual(["Nhà phố Ba Đình rộng"]);
      expect((await viaUrl("ward=ba-dinh")).total).toBe(5);
    });

    it("sắp xếp theo giá và phân trang qua URL; giá trị sai bị bỏ về mặc định", async () => {
      expect((await viaUrl("sort=price_desc")).titles[0]).toBe("Biệt thự năm phòng ngủ");
      expect((await viaUrl("sort=bogus&page=0&priceMin=abc")).total).toBe(5);
    });

    it("/en: chỉ tin có bản EN", async () => {
      expect((await viaUrl("q=serviced", "en")).titles).toEqual(["Serviced apartment Ben Nghe"]);
      expect((await viaUrl("", "en")).total).toBe(1);
    });
  });

  describe("sắp xếp + phân trang", () => {
    it("price_asc / price_desc xếp tin không giá cuối cùng; newest mới nhất trước", async () => {
      const asc = await titlesOf({ sort: "price_asc", limit: 48 });
      const desc = await titlesOf({ sort: "price_desc", limit: 48 });
      expect(asc[0]).toBe("Studio gần chợ");
      expect(asc.at(-1)).toBe("Căn hộ thương lượng");
      expect(desc[0]).toBe("Biệt thự năm phòng ngủ");
      expect(desc.at(-1)).toBe("Căn hộ thương lượng");
      const newest = await titlesOf({ limit: 48 });
      expect(newest[0]).toBe("Căn hộ đã cho thuê");
    });

    it("page/limit/total/totalPages; trang vượt quá rỗng; hai trang không trùng nhau", async () => {
      const first = await search({ limit: 4, page: 1, sort: "price_asc" });
      const second = await search({ limit: 4, page: 2, sort: "price_asc" });
      expect([first.total, first.totalPages, first.items.length, second.items.length, second.page]).toEqual([6, 2, 4, 2, 2]);
      expect(new Set([...first.items, ...second.items].map((card) => card.id)).size).toBe(6);
      expect((await search({ limit: 4, page: 3 })).items).toEqual([]);
    });
  });

  describe("RentalCard", () => {
    const card = async (key: string): Promise<RentalCard> => {
      const found = (await search({ limit: 48 })).items.find((item) => item.id === ids[key]);
      expect(found).toBeDefined();
      return found!;
    };

    it("không có address khi showExactAddress=false; có khi bật", async () => {
      const hiddenAddress = await card("a");
      expect("address" in hiddenAddress).toBe(false);
      expect((await card("b")).address).toBe("5 Phố Bí Mật");
    });

    it("chỉ trường công khai, kiểu đúng, ảnh đại diện lấy ảnh đầu", async () => {
      for (const item of (await search({ limit: 48 })).items) {
        expect(Object.keys(item).filter((key) => !CARD_KEYS.includes(key))).toEqual([]);
        expect(JSON.stringify(item)).not.toMatch(/author|searchText|search_text|location|deletedAt|isFeatured|translation/);
      }
      const a = await card("a");
      expect(a).toMatchObject({
        code: expect.stringMatching(/^CT-\d{6}$/),
        status: "published",
        priceMonthlyVnd: 12_000_000,
        areaM2: 45,
        bedrooms: 1,
        province: { name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" },
        ward: { name: "Phường Sài Gòn", slug: "sai-gon" },
        thumbnail: { url: "/api/media/file/card.jpg" },
      });
      expect((await card("f")).status).toBe("rented");
      expect((await card("e")).priceMonthlyVnd).toBeNull();
    });
  });

  describe.skipIf(!hasRedis)("endpoint GET /api/public/rentals", () => {
    it("200: khung { success, data }, Cache-Control s-maxage=60, kết quả theo locale", async () => {
      const response = await getHandler("locale=en&q=serviced", newIp());
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60");
      const body = (await response.json()) as { success: boolean; data: { items: RentalCard[]; total: number; page: number; totalPages: number } };
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ total: 1, page: 1, totalPages: 1 });
      expect(body.data.items[0]!.slug).toBe("serviced-apartment-ben-nghe");
    });

    it("tham số sai -> 400 (không cache); khoá lạ và giá trị rỗng được bỏ qua", async () => {
      for (const query of ["limit=49", "limit=0", "page=0", "locale=fr", "sort=random", "bedrooms=5", "priceMin=abc", "priceMin=10&priceMax=5", "furnishing=x", "ward=ba-dinh", "available=yes"]) {
        const response = await getHandler(query, newIp());
        expect(response.status, query).toBe(400);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
        expect(((await response.json()) as { success: boolean }).success).toBe(false);
      }
      expect((await getHandler("q=&category=&foo=bar", newIp())).status).toBe(200);
    });

    it("GET ?amenities=pool,gym đếm đúng (AND); tiện ích lạ bị bỏ → 200 (khác furnishing sai → 400)", async () => {
      const both = (await (await getHandler("amenities=pool,gym&limit=1", newIp())).json()) as { data: { total: number } };
      expect(both.data.total).toBe(1);
      const unknown = await getHandler("amenities=pool,khong-co&limit=1", newIp());
      expect(unknown.status).toBe(200);
      expect(((await unknown.json()) as { data: { total: number } }).data.total).toBe(1);
    });

    it("GET ?amenities=pool&amenities=gym (khoá lặp) cho cùng kết quả với ?amenities=pool,gym", async () => {
      const repeated = (await (await getHandler("amenities=pool&amenities=gym&limit=48", newIp())).json()) as { data: { total: number } };
      const comma = (await (await getHandler("amenities=pool,gym&limit=48", newIp())).json()) as { data: { total: number } };
      expect(repeated.data.total).toBe(1);
      expect(repeated.data.total).toBe(comma.data.total);
    });

    it("vượt 60 lần/phút/IP -> 429 kèm Retry-After", async () => {
      const ip = newIp();
      for (let i = 0; i < 60; i++) expect((await getHandler("limit=1", ip)).status).toBe(200);
      const blocked = await getHandler("limit=1", ip);
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("reindex searchText (follow-up review layer-6-task-02)", () => {
    const searchTextOf = async (key: string, locale: "vi" | "en") =>
      (await payload.findByID({ collection: "rentals", id: ids[key]!, locale, fallbackLocale: false, depth: 0, overrideAccess: true, showHiddenFields: true })).searchText;

    it("đổi tên cũ của phường làm mới searchText của tin thuộc phường (cả vi và en), tìm được ngay", async () => {
      expect(await searchTextOf("a", "en")).toContain("ben nghe");
      await payload.update({
        collection: "wards",
        id: sgWardId,
        data: { legacyNames: [{ name: "Phường Bến Thành, Quận 1" }] },
        overrideAccess: true,
      });
      expect(await searchTextOf("a", "vi")).toContain("ben thanh");
      expect(await searchTextOf("a", "vi")).not.toContain("phuong ben nghe");
      expect(await searchTextOf("a", "en")).toContain("ben thanh");
      expect((await search({ q: "ben thanh", limit: 48 })).total).toBe(5);
    });

    it("đổi tên tỉnh làm mới searchText của tin thuộc tỉnh, tìm được bằng tên mới (không dấu); đổi shortName thì không ghi lại", async () => {
      expect(await searchTextOf("a", "vi")).toContain("ho chi minh");
      await payload.update({ collection: "provinces", id: hcmId, data: { name: "Thành phố Sài Gòn" }, overrideAccess: true });
      expect(await searchTextOf("a", "vi")).toContain("sai gon");
      expect(await searchTextOf("a", "vi")).not.toContain("ho chi minh");
      expect(await searchTextOf("a", "en")).toContain("sai gon");
      expect((await search({ q: "thanh pho sai gon", limit: 48 })).total).toBe(5);
      // Tin thuộc tỉnh khác không bị ghi lại.
      expect(await searchTextOf("c", "vi")).toContain("ha noi");

      await withDatabase((client) => client.query(`UPDATE "rentals_locales" SET "search_text" = 'cu' WHERE "_parent_id" = $1 AND "_locale" = 'vi'`, [ids.a]));
      await payload.update({ collection: "provinces", id: hcmId, data: { shortName: "TP Sài Gòn" }, overrideAccess: true });
      expect(await searchTextOf("a", "vi")).toBe("cu");
      // Trả tên cũ cho các test sau (và dựng lại searchText đã đặt thành 'cu').
      await payload.update({ collection: "provinces", id: hcmId, data: { name: "Thành phố Hồ Chí Minh" }, overrideAccess: true });
      expect(await searchTextOf("a", "vi")).toContain("ho chi minh");
    });

    it("không đổi tên/tên cũ của phường thì không ghi lại", async () => {
      await withDatabase((client) => client.query(`UPDATE "rentals_locales" SET "search_text" = 'cu' WHERE "_parent_id" = $1 AND "_locale" = 'vi'`, [ids.a]));
      await payload.update({ collection: "wards", id: sgWardId, data: { slug: "sai-gon" }, overrideAccess: true });
      expect(await searchTextOf("a", "vi")).toBe("cu");
    });

    it("lệnh reindex dựng lại searchText đã lệch (mọi tin, idempotent); không đụng tin chưa có bản en", async () => {
      await withDatabase((client) => client.query(`UPDATE "rentals_locales" SET "search_text" = 'lech'`));
      const first = await reindexRentalSearchText(payload, "all");
      expect(first.rentals).toBeGreaterThanOrEqual(9);
      expect(await searchTextOf("a", "vi")).toContain("can ho dich vu");
      expect(await searchTextOf("b", "vi")).toContain("studio gan cho");
      expect(await searchTextOf("b", "vi")).toContain("5 pho bi mat");
      expect(await searchTextOf("a", "en")).toContain("serviced apartment");
      const second = await reindexRentalSearchText(payload, "all");
      expect(second).toEqual(first);
      // Tin b chưa có bản en: không sinh dòng en rỗng/lệch.
      const enRows = await withDatabase((client) => client.query(`SELECT count(*)::int AS n FROM "rentals_locales" WHERE "_parent_id" = $1 AND "_locale" = 'en' AND "search_text" = 'lech'`, [ids.b]));
      expect(enRows.rows[0].n).toBe(0);
    });

    it("đổi tên dự án làm mới searchText của tin thuộc dự án", async () => {
      await payload.update({ collection: "rentals", id: ids.c!, data: { project: projectId } as never, locale: "vi", overrideAccess: true });
      expect(await searchTextOf("c", "vi")).toContain("du an alpha");
      await payload.update({ collection: "projects", id: projectId, data: { title: "Dự án Beta" } as never, locale: "vi", overrideAccess: true });
      expect(await searchTextOf("c", "vi")).toContain("du an beta");
      expect(await searchTextOf("c", "vi")).not.toContain("alpha");
    });
  });

  /**
   * BL-052 (P2-T01): tham số `project`, trang danh sách (`listing`: nổi bật không lặp lưới, `total` gồm nổi bật, số đếm theo chiều), ô "Dự án".
   * Dữ liệu riêng ở tỉnh Đà Nẵng + danh mục riêng (tạo ở đây, chạy SAU mọi khối khác nên không đổi số đếm của chúng; DB tạm bị xoá cuối file).
   */
  describe("BL-052: project + listing (nổi bật, số đếm)", () => {
    let dnSlug = "";
    let officeRootId = "";
    let officeChildId = "";
    let projectSlug = "";
    let draftProjectSlug = "";
    const dnKeys: string[] = [];
    const listing = (params: Record<string, unknown>) => service.listing(rentalSearchParamsSchema.parse({ available: true, ...params }));

    beforeAll(async () => {
      const dn = await payload.create({ collection: "provinces", data: { code: "48", name: "Thành phố Đà Nẵng", slug: "da-nang-bl052" }, overrideAccess: true });
      dnSlug = dn.slug;
      const dnWard = await payload.create({ collection: "wards", data: { province: dn.id, code: "20194", name: "Phường Hải Châu", type: "phuong", slug: "hai-chau" }, overrideAccess: true });
      const category = (name: string, parent?: string) =>
        payload.create({ collection: "categories", data: { name, scope: "rental", ...(parent ? { parent } : {}) } as never, locale: "vi", overrideAccess: true, depth: 0 });
      officeRootId = (await category("Văn phòng BL052")).id;
      officeChildId = (await category("Văn phòng chia sẻ BL052", officeRootId)).id;
      const projectCategoryId = (await payload.create({ collection: "categories", data: { name: "Dự án BL052", scope: "project" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id;
      const project = await payload.create({
        collection: "projects",
        data: { title: "Dự án Gamma BL052", summary: "Tóm tắt", overview: lexical("Tổng quan"), category: projectCategoryId, province: dn.id, salesStatus: "selling" } as never,
        locale: "vi",
        user: admin as never,
        overrideAccess: false,
        depth: 0,
      });
      // Xuất bản thẳng ở DB: điều kiện xuất bản đầy đủ của dự án không phải đối tượng của test này.
      await withDatabase((client) => client.query(`UPDATE "projects" SET "status" = 'published' WHERE "id" = $1`, [project.id]));
      const slugOf = async (id: string) =>
        (await withDatabase((client) => client.query(`SELECT "slug" FROM "projects_locales" WHERE "_parent_id" = $1 AND "_locale" = 'vi'`, [id]))).rows[0].slug as string;
      projectSlug = await slugOf(project.id);
      draftProjectSlug = await slugOf(projectId);

      const place = { province: dn.id, ward: dnWard.id };
      // 7 tin nổi bật (căn hộ, thuộc dự án) + 1 nổi bật đã thuê + 6 tin thường (văn phòng con; 3 thuộc dự án).
      for (let i = 1; i <= 7; i++) {
        await createRental(`dnf${i}`, `Nổi bật Đà Nẵng ${i}`, { ...place, isFeatured: true, project: project.id, priceMonthlyVnd: 10_000_000 + i });
        dnKeys.push(`dnf${i}`);
      }
      const rentedFeatured = await createRental("dnfr", "Nổi bật đã thuê Đà Nẵng", { ...place, isFeatured: true, project: project.id });
      await payload.update({ collection: "rentals", id: rentedFeatured.id, data: { status: "rented" }, locale: "vi", user: admin as never, overrideAccess: false, depth: 0 });
      for (let i = 1; i <= 6; i++) {
        await createRental(`dno${i}`, `Văn phòng Đà Nẵng ${i}`, { ...place, category: officeChildId, ...(i <= 3 ? { project: project.id } : {}), priceMonthlyVnd: 20_000_000 + i });
        dnKeys.push(`dno${i}`);
      }
    }, 180_000);

    it("search ?project=: chỉ tin của dự án công khai; slug lạ hoặc dự án nháp → rỗng (không lỗi)", async () => {
      const result = await search({ project: projectSlug, available: true, limit: 48 });
      expect(result.total).toBe(10);
      expect(result.items.every((card) => dnKeys.some((key) => ids[key] === card.id))).toBe(true);
      // Mặc định API trả cả tin đã thuê.
      expect((await search({ project: projectSlug, limit: 48 })).total).toBe(11);
      expect((await search({ project: "khong-co-du-an" })).total).toBe(0);
      expect((await search({ project: draftProjectSlug })).total).toBe(0);
      expect((await search({ project: projectSlug, category: "van-phong-bl052", limit: 48 })).total).toBe(3);
    });

    it("listing: ≤ 5 nổi bật (mới nhất trước, chỉ tin còn trống), không lặp trong lưới ở MỌI trang; total gồm nổi bật; totalPages trên phần còn lại", async () => {
      const page1 = await listing({ province: dnSlug, limit: 4, page: 1 });
      expect(page1.featured).toHaveLength(5);
      expect(page1.featured.every((card) => card.status === "published")).toBe(true);
      expect(page1.total).toBe(13);
      expect(page1.totalPages).toBe(2);
      const page2 = await listing({ province: dnSlug, limit: 4, page: 2 });
      expect(page2.featured).toEqual([]);
      const featuredIds = page1.featured.map((card) => card.id);
      const gridIds = [...page1.items, ...page2.items].map((card) => card.id);
      expect(gridIds).toHaveLength(8);
      expect(gridIds.filter((id) => featuredIds.includes(id))).toEqual([]);
      expect(new Set([...featuredIds, ...gridIds]).size).toBe(13);
      // Hai tin nổi bật còn lại (vượt trần 5) nằm trong lưới.
      expect(gridIds.filter((id) => ["dnf1", "dnf2", "dnf3", "dnf4", "dnf5", "dnf6", "dnf7"].some((key) => ids[key] === id))).toHaveLength(2);
      const published = (await listing({ province: dnSlug, limit: 48 })).featured.map((card) => card.publishedAt ?? "");
      expect([...published].sort().reverse()).toEqual(published);
    });

    it("listing: nổi bật khớp bộ lọc (lọc văn phòng → không còn tin nổi bật, lưới đủ 6)", async () => {
      const result = await listing({ province: dnSlug, category: "van-phong-bl052", limit: 48 });
      expect(result.featured).toEqual([]);
      expect(result.items).toHaveLength(6);
      expect(result.total).toBe(6);
    });

    it("số đếm: tab danh mục cấp 1 (con tính vào cha) + Tất cả bỏ chiều danh mục; tỉnh bỏ chiều tỉnh, total không lọc", async () => {
      const filtered = await listing({ province: dnSlug, category: "van-phong-bl052", project: projectSlug, limit: 12 });
      // Danh mục: khớp tỉnh + dự án, bỏ danh mục → 7 căn hộ (root) + 3 văn phòng (con → cha).
      expect(filtered.facets.category.counts[rootCategoryId]).toBe(7);
      expect(filtered.facets.category.counts[officeRootId]).toBe(3);
      expect(filtered.facets.category.counts[officeChildId]).toBeUndefined();
      expect(filtered.facets.category.all).toBe(10);
      // Tỉnh: khớp danh mục văn phòng + dự án, bỏ tỉnh → Đà Nẵng 3, HCM 0 (vẫn có dòng vì có tin công khai còn trống).
      const byId = new Map(filtered.facets.provinces.map((entry) => [entry.provinceId, entry]));
      const dnId = (await payload.find({ collection: "provinces", where: { slug: { equals: dnSlug } }, overrideAccess: true, depth: 0 })).docs[0]!.id;
      expect(byId.get(dnId)).toEqual({ provinceId: dnId, count: 3, total: 13 });
      expect(byId.get(hcmId)).toMatchObject({ count: 0 });
      expect(byId.get(hcmId)!.total).toBeGreaterThan(0);
    });

    it("số đếm Tiện ích (P2-T04): bỏ CẢ chiều tiện ích, giữ lọc khác; chỉ tin công khai còn trống; tiện ích đang chọn mà 0 vẫn có khoá", async () => {
      // Tin đã thuê (f) và tin nháp có "pool": không được tính (phạm vi danh sách = công khai + còn trống).
      const extra = [ids.f!, ids.draft!];
      await withDatabase((client) => client.query(`INSERT INTO "rentals_amenities" ("order", "parent_id", "value") SELECT 1, unnest($1::uuid[]), 'pool'`, [extra]));
      try {
        // a: pool, gym, elevator · b: gym (HCM). Chọn pool + kitchen: đếm không phụ thuộc tiện ích đang chọn.
        const selected = await listing({ amenities: "pool,kitchen", limit: 1 });
        expect(selected.total).toBe(0);
        expect(selected.facets.amenities).toMatchObject({ pool: 1, gym: 2, elevator: 1, kitchen: 0, parking: 0 });
        expect(await listing({ limit: 1 }).then((result) => result.facets.amenities)).toEqual(selected.facets.amenities);
        // Lọc khác vẫn áp dụng: 1 phòng ngủ → chỉ còn a.
        expect((await listing({ bedrooms: 1, amenities: "gym", limit: 1 })).facets.amenities).toMatchObject({ pool: 1, gym: 1, elevator: 1 });
        expect(Object.values((await listing({ province: dnSlug, limit: 1 })).facets.amenities).every((count) => count === 0)).toBe(true);
      } finally {
        await withDatabase((client) => client.query(`DELETE FROM "rentals_amenities" WHERE "parent_id" = ANY($1::uuid[])`, [extra]));
      }
    });

    it("số đếm Tiện ích /en: chỉ tin hasEnglish (BL-055 C-5)", async () => {
      // b (gym, không có bản EN) thêm tạm "pool": /vi đếm pool 2, /en chỉ đếm a (pool, gym, elevator).
      await withDatabase((client) => client.query(`INSERT INTO "rentals_amenities" ("order", "parent_id", "value") VALUES (2, $1, 'pool')`, [ids.b]));
      try {
        expect((await listing({ limit: 1 })).facets.amenities).toMatchObject({ pool: 2, gym: 2 });
        expect((await listing({ locale: "en", limit: 1 })).facets.amenities).toMatchObject({ pool: 1, gym: 1, elevator: 1, kitchen: 0 });
      } finally {
        await withDatabase((client) => client.query(`DELETE FROM "rentals_amenities" WHERE "parent_id" = $1 AND "order" = 2`, [ids.b]));
      }
    });

    it("thẻ có danh mục của tin (danh mục con giữ tên con)", async () => {
      const { items } = await listing({ province: dnSlug, category: "van-phong-bl052", limit: 48 });
      expect(items.map((card) => card.category)).toEqual(items.map(() => ({ name: "Văn phòng chia sẻ BL052", slug: "van-phong-chia-se-bl052" })));
    });

    it("ô Dự án: chỉ dự án công khai có tin còn trống (dự án nháp không có)", async () => {
      const { listRentalProjectOptions } = await import("../../src/lib/rentals/rental-list-queries");
      expect(await listRentalProjectOptions(payload, "vi")).toEqual([{ slug: projectSlug, title: "Dự án Gamma BL052" }]);
      // /en: dự án chưa có bản EN → không có.
      expect(await listRentalProjectOptions(payload, "en")).toEqual([]);
    });

    it.skipIf(!hasRedis)("GET /api/public/rentals?project=: 200 + đúng tập; slug lạ → 200 rỗng; thẻ có khoá category", async () => {
      const response = await getHandler(`project=${projectSlug}&available=true&limit=48`, newIp());
      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: { items: RentalCard[]; total: number } };
      expect(body.data.total).toBe(10);
      expect(body.data.items.every((card) => "category" in card)).toBe(true);
      const unknown = await getHandler("project=khong-co-du-an", newIp());
      expect(unknown.status).toBe(200);
      expect(((await unknown.json()) as { data: { total: number } }).data.total).toBe(0);
    });
  });
  describe("BL-080: khớp đầu từ + ưu tiên khớp nguyên cụm (DB thật)", () => {
    let province = "";
    const phraseKeys = ["w80p1", "w80p2"];
    const looseKeys = ["w80l1", "w80l2", "w80l3"];
    const inProvince = (params: Record<string, unknown> = {}) => search({ province, limit: 48, ...params });

    beforeAll(async () => {
      const hue = await payload.create({ collection: "provinces", data: { code: "46", name: "Thành phố Huế", slug: "hue-bl080" }, overrideAccess: true });
      province = hue.slug;
      const ward = await payload.create({ collection: "wards", data: { province: hue.id, code: "19778", name: "Phường Vĩnh Ninh", type: "phuong", slug: "vinh-ninh-bl080" }, overrideAccess: true });
      const place = { province: hue.id, ward: ward.id };
      // Khớp nguyên cụm tạo TRƯỚC (cũ hơn); khớp rời tạo SAU (mới hơn) để newest thuần sẽ đặt chúng lên đầu.
      await createRental("w80p1", "Căn hộ Huế một phòng ngủ", place);
      await createRental("w80p2", "Chung cư, căn-hộ view sông", place);
      await createRental("w80l1", "Hộ kinh doanh cần thuê căn góc", place);
      await createRental("w80l2", "Hộ gia đình tìm căn nhỏ", place);
      await createRental("w80l3", "Hộ nghèo căn nhà cấp bốn", place);
      // Chỉ chứa "cần", "cho": "can" là đầu từ nhưng không từ nào bắt đầu bằng "ho" → không khớp.
      await createRental("w80n1", "Cần cho thuê mặt bằng", place);
    });

    it("'can ho' không khớp tin chỉ chứa 'cần…cho'; 'ho' không khớp giữa từ 'cho'", async () => {
      const titlesFound = await titlesOf({ province, limit: 48, q: "can ho" });
      expect(titlesFound).not.toContain("Cần cho thuê mặt bằng");
      // BL-103: chỉ tin chứa nguyên cụm "căn hộ"; tin rời rạc (căn … hộ) bị loại.
      expect(titlesFound).toHaveLength(2);
      for (const key of looseKeys) expect(titlesFound).not.toContain(titles.get(ids[key]!) ?? "");
      expect(await titlesOf({ province, q: "ho thue" })).not.toContain("Cần cho thuê mặt bằng");
    });

    it("sort mặc định: chỉ tin khớp nguyên cụm (BL-103); phân trang limit 1 không lặp/sót", async () => {
      const first = await inProvince({ q: "can ho", limit: 1, page: 1 });
      expect(first.total).toBe(2);
      const second = await inProvince({ q: "can ho", limit: 1, page: 2 });
      const all = [...first.items, ...second.items].map((card) => card.id);
      expect(new Set(all)).toEqual(new Set(phraseKeys.map((key) => ids[key])));
      expect((await inProvince({ q: "can ho", limit: 1, page: 3 })).items).toEqual([]);
    });

    it("sort giá vẫn theo giá (không ưu tiên cụm); đếm tổng khớp danh sách", async () => {
      const asc = await inProvince({ q: "can ho", sort: "price_asc" });
      const prices = asc.items.map((card) => card.priceMonthlyVnd ?? Infinity);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
      expect(asc.total).toBe(asc.items.length);
    });

    it("listing: lưới và số đếm cùng điều kiện đầu từ", async () => {
      const listing = await service.listing(rentalSearchParamsSchema.parse({ province, q: "can ho", limit: 2 }));
      expect(listing.total).toBe(2);
      expect(listing.items.map((card) => card.id).sort()).toEqual(phraseKeys.map((key) => ids[key]).sort());
    });

    it("mã tin CT-xxxxxx vẫn tìm được (đầy đủ và tách 'ct 000012')", async () => {
      const code = (await payload.findByID({ collection: "rentals", id: ids.w80p1!, depth: 0, overrideAccess: true })).code;
      expect(await titlesOf({ q: code })).toEqual(["Căn hộ Huế một phòng ngủ"]);
      expect(await titlesOf({ q: code.toLowerCase().replace("-", " ") })).toEqual(["Căn hộ Huế một phòng ngủ"]);
    });
  });
});
