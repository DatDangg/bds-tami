import type { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedSampleRentals } from "../../seed/sample/rentals";
import { ROLES } from "../../src/access/roles";
import { findLayoutField } from "../../src/lib/admin/form-layout";

const baseUrl = process.env.DATABASE_URL_TEST;

type Locale = "vi" | "en";

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400, APIError 409). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

const NOW = () => new Date().toISOString();
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

describe("migration rentals (SQL tuỳ biến, ERD §5)", () => {
  const sqlText = readFileSync(new URL("../../migrations/20261017_143212_rentals.ts", import.meta.url), "utf8");

  it("tạo sequence mã tin và đủ index tổng hợp + GIST location với tên có tiền tố bảng", () => {
    expect(sqlText).toContain(`CREATE SEQUENCE IF NOT EXISTS "rentals_code_seq"`);
    for (const index of [
      `"rentals_list_idx" ON "rentals" USING btree ("status", "has_english", "category_id", "province_id", "price_monthly_vnd")`,
      `"rentals_status_ward_idx" ON "rentals" USING btree ("status", "ward_id")`,
      `"rentals_status_published_at_idx" ON "rentals" USING btree ("status", "published_at" DESC)`,
      `"rentals_status_area_m2_idx" ON "rentals" USING btree ("status", "area_m2")`,
      `"rentals_status_bedrooms_idx" ON "rentals" USING btree ("status", "bedrooms")`,
      `"rentals_location_gist_idx" ON "rentals" USING gist ("location")`,
      `UNIQUE INDEX "rentals_slug_idx" ON "rentals_locales" USING btree ("slug","_locale")`,
    ]) {
      expect(sqlText).toContain(index);
    }
  });
});

describe.skipIf(!baseUrl)("integration: rentals (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_rentals_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const revalidatedPaths: string[][] = [];
  const imageIds: string[] = [];
  let pdfId = "";
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;
  let categoryId = "";
  let provinceId = "";
  let otherProvinceId = "";
  let wardId = "";
  let otherProvinceWardId = "";
  let publicQueries: typeof import("../../src/lib/content/public-queries");

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
  }

  type Actor = Awaited<ReturnType<typeof createStaff>>;
  interface Options {
    as?: Actor;
    locale?: Locale;
    trash?: boolean;
  }

  const createCategory = (name: string, scope: string) =>
    payload.create({ collection: "categories", data: { name, scope } as never, locale: "vi", overrideAccess: true, depth: 0 });

  const createRental = (data: Record<string, unknown>, { as = sale, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "rentals",
      data: {
        description: lexical("Mô tả"),
        category: categoryId,
        province: provinceId,
        ward: wardId,
        address: "12 Đường Test",
        priceMonthlyVnd: 10_000_000,
        areaM2: 40,
        ...data,
      } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updateRental = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi", trash = false }: Options = {}) =>
    payload.update({ collection: "rentals", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0, trash });

  const deleteRental = (id: string, as: Actor) =>
    payload.delete({ collection: "rentals", id, user: asUser(as), overrideAccess: false, trash: true });

  /** `searchText` là trường ẩn: chỉ đọc được khi `showHiddenFields`. */
  async function searchTextOf(id: string, locale: Locale): Promise<string | null | undefined> {
    const doc = await payload.findByID({ collection: "rentals", id, locale, fallbackLocale: false, depth: 0, overrideAccess: true, showHiddenFields: true });
    return (doc as { searchText?: string | null }).searchText;
  }

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  async function insertMedia(mimeType: string): Promise<string> {
    const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, [mimeType]));
    return inserted.rows[0].id as string;
  }

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
    // `location` là geometry(Point) và mã tin lấy từ sequence: DB mới tạo bằng `push` chưa có (migration tạo ở DB thật).
    await withDatabase((client) => client.query(`CREATE EXTENSION IF NOT EXISTS postgis`));
    const { getPayload } = await import("payload");
    const { buildRentalsTestConfig } = await import("../fixtures/rentals/payload-config");
    payload = await getPayload({ config: buildRentalsTestConfig(testUrl, (paths) => void revalidatedPaths.push(paths)) });
    // Mã tin lấy từ sequence do migration tạo ở DB thật; DB tạm dùng cấu hình chế độ đồng bộ schema tự động nên tự tạo ở đây, SAU khi
    // schema đã dựng (bước đồng bộ có thể dọn đối tượng không thuộc schema nên tạo trước sẽ bị xoá).
    await withDatabase((client) => client.query(`CREATE SEQUENCE IF NOT EXISTS rentals_code_seq START 1`));
    publicQueries = await import("../../src/lib/content/public-queries");
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("othersale", ROLES.sale);
    categoryId = (await createCategory("Căn hộ", "rental")).id;
    provinceId = (
      await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })
    ).id;
    otherProvinceId = (
      await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })
    ).id;
    wardId = (
      await payload.create({
        collection: "wards",
        data: {
          province: provinceId,
          code: "70101063",
          name: "Phường Sài Gòn",
          type: "phuong",
          slug: "sai-gon",
          legacyNames: [{ name: "Phường Bến Nghé, Quận 1" }, { name: "Phường Bến Thành, Quận 1" }],
        },
        overrideAccess: true,
      })
    ).id;
    otherProvinceWardId = (
      await payload.create({
        collection: "wards",
        data: { province: otherProvinceId, code: "00004", name: "Phường Ba Đình", type: "phuong", slug: "ba-dinh" },
        overrideAccess: true,
      })
    ).id;
    // Trường upload chỉ cần `media` tồn tại: chèn thẳng dòng để khỏi ghi file ra đĩa.
    for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) imageIds.push(await insertMedia(mimeType));
    pdfId = await insertMedia("application/pdf");
  }, 120_000);

  afterAll(async () => {
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

  beforeEach(() => {
    revalidatedPaths.length = 0;
  });

  describe("cấu hình + schema", () => {
    it("đủ trường ERD §4.6 + group rentalTerms", () => {
      const config = payload.collections.rentals!.config;
      const names = config.flattenedFields.map((field) => field.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "code", "title", "slug", "category", "project", "province", "ward", "address", "showExactAddress", "location",
          "priceMonthlyVnd", "priceNegotiable", "areaM2", "bedrooms", "bathrooms", "floor", "houseDirection",
          "balconyDirection", "furnishing", "rentalTerms", "description", "gallery", "videoUrl", "legalNote", "isFeatured",
          "status", "rentedAt", "publishedAt", "author", "searchText", "hasEnglish", "translation", "seo",
        ]),
      );
      const terms = findLayoutField(config.fields, "rentalTerms");
      expect(terms && "fields" in terms ? terms.fields.map((field) => "name" in field && field.name) : []).toEqual([
        "minLeaseMonths", "depositMonths", "paymentCycle", "includedServices", "availableFrom",
      ]);
      expect(config.trash).toBe(true);
    });

    it("DB tạm có UNIQUE (slug, _locale) trên rentals_locales, UNIQUE code và index lọc cơ bản", async () => {
      const locales = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'rentals_locales'`));
      expect(locales.rows.some((row) => String(row.indexdef).includes("UNIQUE") && String(row.indexdef).includes("(slug, _locale)"))).toBe(true);
      const main = await withDatabase((client) => client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'rentals'`));
      const names = main.rows.map((row) => String(row.indexname));
      expect(names).toEqual(expect.arrayContaining(["rentals_code_idx", "rentals_province_idx", "rentals_ward_idx", "rentals_status_idx", "rentals_furnishing_idx"]));
      expect(main.rows.find((row) => row.indexname === "rentals_code_idx")?.indexdef).toContain("UNIQUE");
    });

    it("lưu và đọc lại đủ nhóm trường: rentalTerms, location, gallery, hướng, nội thất", async () => {
      const doc = await createRental({
        title: "Căn hộ đủ trường",
        showExactAddress: true,
        location: [106.7, 10.77],
        bedrooms: 2,
        bathrooms: 1,
        floor: "Tầng trệt",
        houseDirection: "NE",
        balconyDirection: "SW",
        furnishing: "full",
        rentalTerms: {
          minLeaseMonths: 6,
          depositMonths: 2,
          paymentCycle: "quarterly",
          includedServices: ["electricity", "internet"],
          availableFrom: "2026-12-01T00:00:00.000Z",
        },
        videoUrl: "https://www.youtube.com/watch?v=abc",
        legalNote: "Có hợp đồng",
        gallery: imageIds,
      });
      const stored = await payload.findByID({ collection: "rentals", id: doc.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(stored.location).toEqual([106.7, 10.77]);
      expect(stored.rentalTerms).toMatchObject({ minLeaseMonths: 6, depositMonths: 2, paymentCycle: "quarterly", includedServices: ["electricity", "internet"] });
      expect(stored.houseDirection).toBe("NE");
      expect(stored.furnishing).toBe("full");
      expect(stored.gallery).toEqual(imageIds);
      expect(stored.showExactAddress).toBe(true);
      expect(stored.status).toBe("draft");
    });
  });

  describe("code CT- từ sequence", () => {
    it("dạng CT-000123, chỉ đọc: giá trị gửi lên bị bỏ qua, sửa không đổi mã (kể cả overrideAccess)", async () => {
      const doc = await createRental({ title: "Mã tự sinh", code: "CT-999999" });
      expect(doc.code).toMatch(/^CT-\d{6}$/);
      expect(doc.code).not.toBe("CT-999999");
      expect((await updateRental(doc.id, { code: "CT-000001", address: "Sửa địa chỉ" })).code).toBe(doc.code);
      const forced = await payload.update({ collection: "rentals", id: doc.id, data: { code: "CT-123456" } as never, overrideAccess: true, depth: 0 });
      expect(forced.code).toBe(doc.code);
      const forcedCreate = await payload.create({
        collection: "rentals",
        data: {
          title: "Ép mã",
          description: lexical("x"),
          category: categoryId,
          province: provinceId,
          ward: wardId,
          address: "a",
          priceMonthlyVnd: 1,
          areaM2: 1,
          author: sale.id,
          code: "CT-424242",
        } as never,
        overrideAccess: true,
        depth: 0,
      });
      expect(forcedCreate.code).not.toBe("CT-424242");
    });

    it("tạo 20 tin song song: 20 mã khác nhau, tăng dần theo thứ tự cấp", async () => {
      const created = await Promise.all(Array.from({ length: 20 }, (_, index) => createRental({ title: `Song song ${index}` })));
      const numbers = created.map((doc) => Number(doc.code.slice(3)));
      expect(new Set(created.map((doc) => doc.code)).size).toBe(20);
      const sorted = [...numbers].sort((a, b) => a - b);
      for (let index = 1; index < sorted.length; index += 1) expect(sorted[index]).toBeGreaterThan(sorted[index - 1]!);
      const later = await createRental({ title: "Sau song song" });
      expect(Number(later.code.slice(3))).toBeGreaterThan(sorted.at(-1)!);
    });

    it("nhân bản tin có mã mới, không trùng", async () => {
      const original = await createRental({ title: "Bản gốc nhân bản" });
      const copy = await payload.duplicate({ collection: "rentals", id: original.id, overrideAccess: true, depth: 0, locale: "vi" });
      expect(copy.code).toMatch(/^CT-\d{6}$/);
      expect(copy.code).not.toBe(original.code);
    });
  });

  describe("xuất bản + giá + diện tích", () => {
    it("published với 0-2 ảnh → 400; đủ 3 ảnh → xuất bản; nháp được thiếu ảnh; không gỡ còn dưới 3 ảnh", async () => {
      expect(await statusOf(createRental({ title: "Thiếu ảnh", status: "published" }))).toBe(400);
      expect(await statusOf(createRental({ title: "Hai ảnh", status: "published", gallery: imageIds.slice(0, 2) }))).toBe(400);
      const draft = await createRental({ title: "Nháp hai ảnh", gallery: imageIds.slice(0, 2) });
      expect(draft.status).toBe("draft");
      const published = await createRental({ title: "Ba ảnh", status: "published", gallery: imageIds });
      expect(published.status).toBe("published");
      expect((await updateRental(published.id, { address: "Sửa một phần" })).address).toBe("Sửa một phần");
      expect(await statusOf(updateRental(published.id, { gallery: imageIds.slice(0, 2) }))).toBe(400);
      expect(await statusOf(updateRental(draft.id, { status: "published" }))).toBe(400);
      expect(await statusOf(createRental({ title: "Rented hai ảnh", status: "rented", gallery: imageIds.slice(0, 2) }))).toBe(400);
      expect(await statusOf(updateRental(draft.id, { status: "rented" }))).toBe(400);
    });

    it("gallery chỉ nhận ảnh: PDF bị validator upload mặc định chặn (filterOptions) dù có validate tuỳ biến", async () => {
      expect(await statusOf(createRental({ title: "Gallery PDF", gallery: [pdfId] }))).toBe(400);
    });

    it("priceMonthlyVnd bắt buộc trừ khi priceNegotiable; không âm; diện tích > 0", async () => {
      expect(await statusOf(createRental({ title: "Thiếu giá", priceMonthlyVnd: null }))).toBe(400);
      expect((await createRental({ title: "Thỏa thuận", priceMonthlyVnd: null, priceNegotiable: true })).priceNegotiable).toBe(true);
      expect(await statusOf(createRental({ title: "Giá âm", priceMonthlyVnd: -1 }))).toBe(400);
      expect(await statusOf(createRental({ title: "Diện tích 0", areaM2: 0 }))).toBe(400);
      expect(await statusOf(createRental({ title: "Thiếu diện tích", areaM2: null }))).toBe(400);
      const doc = await createRental({ title: "Giá rồi bỏ thỏa thuận", priceMonthlyVnd: null, priceNegotiable: true });
      expect(await statusOf(updateRental(doc.id, { priceNegotiable: false }))).toBe(400);
      expect((await updateRental(doc.id, { priceNegotiable: false, priceMonthlyVnd: 5_000_000 })).priceMonthlyVnd).toBe(5_000_000);
    });

    it("videoUrl chỉ nhận https YouTube/TikTok; thiếu province/ward/address/category → 400", async () => {
      expect(await statusOf(createRental({ title: "Video lạ", videoUrl: "javascript:alert(1)" }))).toBe(400);
      expect(await statusOf(createRental({ title: "Video http", videoUrl: "http://youtube.com/watch?v=1" }))).toBe(400);
      expect(await statusOf(createRental({ title: "Video trang lạ", videoUrl: "https://example.com/v" }))).toBe(400);
      expect((await createRental({ title: "Video TikTok", videoUrl: "https://www.tiktok.com/@a/video/1" })).videoUrl).toContain("tiktok.com");
      expect(await statusOf(createRental({ title: "Thiếu tỉnh", province: null }))).toBe(400);
      expect(await statusOf(createRental({ title: "Thiếu phường", ward: null }))).toBe(400);
      expect(await statusOf(createRental({ title: "Thiếu địa chỉ", address: "" }))).toBe(400);
      expect(await statusOf(createRental({ title: "Thiếu danh mục", category: null }))).toBe(400);
    });
  });

  describe("rentedAt", () => {
    it("chuyển sang rented tự gán rentedAt, lưu lại giữ nguyên, rời rented thì xoá; không sửa tay được", async () => {
      const doc = await createRental({ title: "Cho thuê rồi", status: "published", gallery: imageIds });
      expect(doc.rentedAt ?? null).toBeNull();
      const rented = await updateRental(doc.id, { status: "rented", rentedAt: "2020-01-01T00:00:00.000Z" });
      expect(rented.rentedAt).toBeTruthy();
      expect(new Date(rented.rentedAt!).getFullYear()).toBeGreaterThan(2020);
      const resaved = await updateRental(doc.id, { address: "Đổi địa chỉ khi đã thuê" });
      expect(resaved.rentedAt).toBe(rented.rentedAt);
      const reopened = await updateRental(doc.id, { status: "published" });
      expect(reopened.rentedAt ?? null).toBeNull();
    });
  });

  describe("searchText theo từng ngôn ngữ", () => {
    it("vi: mã + tiêu đề + địa chỉ + phường + tỉnh + tên dự án (không có tên phường cũ), không dấu, chữ thường", async () => {
      const project = await payload.create({
        collection: "projects",
        data: {
          title: "Vinhomes Grand Park",
          summary: "s",
          overview: lexical("o"),
          category: (await createCategory("Chung cư", "project")).id,
          province: provinceId,
          salesStatus: "selling",
          author: admin.id,
        } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      const doc = await createRental({ title: "Căn hộ Đồng Khởi", project: project.id });
      const text = (await searchTextOf(doc.id, "vi"))!;
      expect(text).toContain(doc.code.toLowerCase());
      for (const fragment of [
        "can ho dong khoi",
        "12 duong test",
        "phuong sai gon",
        "thanh pho ho chi minh",
        "vinhomes grand park",
      ]) {
        expect(text).toContain(fragment);
      }
      // BL-110: tên phường cũ (legacyNames) không vào searchText.
      expect(text).not.toContain("ben nghe");
      expect(text).not.toContain("ben thanh");
      expect(text).toBe(text.toLowerCase());
      expect(text).not.toMatch(/[đàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/i);
    });

    it("tìm bằng tên phường cũ không ra tin (BL-110: searchText không chứa legacyNames[].name)", async () => {
      const doc = await createRental({ title: "Studio tên cũ" });
      const keyword = "Phường Bến Nghé".normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      expect(await searchTextOf(doc.id, "vi")).not.toContain(keyword);
      const hit = await payload.find({
        collection: "rentals",
        where: { searchText: { contains: keyword } },
        locale: "vi",
        depth: 0,
        overrideAccess: true,
      });
      expect(hit.docs.map((found) => found.id)).not.toContain(doc.id);
    });

    it("mỗi ngôn ngữ có searchText riêng theo tiêu đề của nó; đổi phường/địa chỉ ở vi làm mới cả bản en", async () => {
      const doc = await createRental({ title: "Căn hộ song ngữ" });
      await payload.update({
        collection: "rentals",
        id: doc.id,
        data: { title: "Bilingual apartment", description: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const vi = (await searchTextOf(doc.id, "vi"))!;
      const en = (await searchTextOf(doc.id, "en"))!;
      expect(vi).toContain("can ho song ngu");
      expect(vi).not.toContain("bilingual");
      expect(en).toContain("bilingual apartment");
      expect(en).not.toContain("song ngu");
      expect(en).toContain("phuong sai gon");
      expect(en).toContain(doc.code.toLowerCase());

      await updateRental(doc.id, { province: otherProvinceId, ward: otherProvinceWardId, address: "99 Phố Mới" });
      const viAfter = (await searchTextOf(doc.id, "vi"))!;
      const enAfter = (await searchTextOf(doc.id, "en"))!;
      for (const text of [viAfter, enAfter]) {
        expect(text).toContain("99 pho moi");
        expect(text).toContain("phuong ba dinh");
        expect(text).toContain("thanh pho ha noi");
        expect(text).not.toContain("phuong sai gon");
      }
      expect(enAfter).toContain("bilingual apartment");
      const latestVersion = await withDatabase((client) =>
        client.query(
          `SELECT l.version_search_text FROM "_rentals_v_locales" l WHERE l._locale = 'en' AND l._parent_id = (SELECT id FROM "_rentals_v" WHERE parent_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1)`,
          [doc.id],
        ),
      );
      expect(latestVersion.rows[0]?.version_search_text).toContain("99 pho moi");
    });

    it("searchText ẩn khỏi kết quả API và client không ghi được", async () => {
      const doc = await createRental({ title: "Ẩn searchText", searchText: "gia mao" });
      expect("searchText" in doc).toBe(false);
      expect(await searchTextOf(doc.id, "vi")).not.toContain("gia mao");
    });
  });

  describe("riêng tư địa chỉ + searchText với khách (ERD §4.6)", () => {
    const location = [106.7, 10.77];
    const guestFind = (where: Record<string, unknown>) =>
      payload.find({ collection: "rentals", where: where as never, depth: 0, overrideAccess: false });

    async function publish(title: string, showExactAddress: boolean) {
      return createRental({ title, status: "published", gallery: imageIds, address: "77 Số Nhà Bí Mật", location, showExactAddress });
    }

    it("showExactAddress=false: khách không nhận address/location (Local API overrideAccess:false); nhân viên vẫn nhận", async () => {
      const doc = await publish("Ẩn số nhà", false);
      const guest = (await guestFind({ id: { equals: doc.id } })).docs[0]!;
      expect(guest.title).toBe("Ẩn số nhà");
      expect("address" in guest).toBe(false);
      expect("location" in guest).toBe(false);
      expect("searchText" in guest).toBe(false);
      const guestById = await payload.findByID({ collection: "rentals", id: doc.id, depth: 0, overrideAccess: false });
      expect("address" in guestById).toBe(false);
      expect("location" in guestById).toBe(false);
      const staff = await payload.findByID({ collection: "rentals", id: doc.id, depth: 0, user: asUser(sale), overrideAccess: false });
      expect(staff.address).toBe("77 Số Nhà Bí Mật");
      expect(staff.location).toEqual(location);
    });

    it("showExactAddress=true: khách nhận address + location", async () => {
      const doc = await publish("Hiện số nhà", true);
      const guest = (await guestFind({ id: { equals: doc.id } })).docs[0]!;
      expect(guest.address).toBe("77 Số Nhà Bí Mật");
      expect(guest.location).toEqual(location);
    });

    it("khách lọc/sắp xếp theo searchText, address, location bị từ chối (không dò được số nhà)", async () => {
      await publish("Dò số nhà", false);
      expect(await statusOf(guestFind({ searchText: { like: "bi mat" } }))).toBe(400);
      expect(await statusOf(guestFind({ address: { like: "Bí Mật" } }))).toBe(400);
      expect(await statusOf(guestFind({ location: { near: "106.7,10.77,1000" } }))).toBe(400);
      expect(await statusOf(payload.find({ collection: "rentals", sort: "address", depth: 0, overrideAccess: false }))).toBe(400);
      const staff = await payload.find({
        collection: "rentals",
        where: { address: { like: "Bí Mật" } },
        depth: 0,
        user: asUser(sale),
        overrideAccess: false,
      });
      expect(staff.docs.length).toBeGreaterThan(0);
    });

    it("phiên bản: khách không đọc được; không lộ address/location", async () => {
      const doc = await publish("Phiên bản ẩn", false);
      const versions = payload.findVersions({ collection: "rentals", where: { parent: { equals: doc.id } }, depth: 0, overrideAccess: false });
      const result = await versions.catch((error: { status?: number }) => error);
      if (result instanceof Error || (result as { status?: number }).status) {
        expect([401, 403]).toContain((result as { status?: number }).status);
      } else {
        for (const version of (result as { docs: Array<{ version: Record<string, unknown> }> }).docs) {
          expect("address" in version.version).toBe(false);
          expect("location" in version.version).toBe(false);
        }
      }
    });
  });

  describe("tỉnh/thành: chặn xoá khi còn tin cho thuê / dự án / phường", () => {
    const removeProvince = (id: string) => payload.delete({ collection: "provinces", id, user: asUser(admin), overrideAccess: false });

    it("còn phường (kéo theo tin, kể cả xoá mềm) → 409; còn dự án → 409; trống thì xoá được", async () => {
      const province = await payload.create({ collection: "provinces", data: { code: "88", name: "Tỉnh Tạm", slug: "tinh-tam" }, overrideAccess: true });
      const ward = await payload.create({
        collection: "wards",
        data: { province: province.id, code: "88001", name: "Phường Tạm 2", type: "phuong", slug: "tam-2" },
        overrideAccess: true,
      });
      const doc = await createRental({ title: "Giữ tỉnh", province: province.id, ward: ward.id });
      expect(await statusOf(removeProvince(province.id))).toBe(409);
      await updateRental(doc.id, { deletedAt: NOW() });
      expect(await statusOf(removeProvince(province.id))).toBe(409);
      await deleteRental(doc.id, admin);
      await payload.delete({ collection: "wards", id: ward.id, overrideAccess: true });
      await removeProvince(province.id);
    });

    it("tỉnh chỉ còn dự án tham chiếu → 409", async () => {
      const province = await payload.create({ collection: "provinces", data: { code: "89", name: "Tỉnh Dự Án", slug: "tinh-du-an" }, overrideAccess: true });
      const project = await payload.create({
        collection: "projects",
        data: {
          title: "Dự án giữ tỉnh",
          summary: "s",
          overview: lexical("o"),
          category: (await createCategory("Chung cư 2", "project")).id,
          province: province.id,
          salesStatus: "selling",
          author: admin.id,
        } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      expect(await statusOf(removeProvince(province.id))).toBe(409);
      await payload.delete({ collection: "projects", id: project.id, overrideAccess: true, trash: true });
      await removeProvince(province.id);
    });
  });

  describe("ward thuộc province (G22)", () => {
    it("phường của tỉnh khác → 400 khi tạo; sửa riêng tỉnh hoặc riêng phường làm lệch → 400; khớp thì được", async () => {
      expect(await statusOf(createRental({ title: "Phường lệch tỉnh", ward: otherProvinceWardId }))).toBe(400);
      const doc = await createRental({ title: "Phường khớp tỉnh" });
      expect(await statusOf(updateRental(doc.id, { province: otherProvinceId }))).toBe(400);
      expect(await statusOf(updateRental(doc.id, { ward: otherProvinceWardId }))).toBe(400);
      const moved = await updateRental(doc.id, { province: otherProvinceId, ward: otherProvinceWardId });
      expect(moved.ward).toBe(otherProvinceWardId);
    });

    it("lọc ô chọn phường theo tỉnh đã chọn", () => {
      const ward = payload.collections.rentals!.config.flattenedFields.find((field) => field.name === "ward");
      const filter = (ward as { filterOptions?: (args: { siblingData: unknown }) => unknown }).filterOptions!;
      expect(filter({ siblingData: { province: provinceId } })).toEqual({ province: { equals: provinceId } });
      expect(filter({ siblingData: {} })).toBe(true);
    });

    it("không xoá được phường đang có tin cho thuê (409, kể cả tin xoá mềm); hết tin thì xoá được", async () => {
      const ward = await payload.create({
        collection: "wards",
        data: { province: provinceId, code: "70101099", name: "Phường Tạm", type: "phuong", slug: "tam" },
        overrideAccess: true,
      });
      const doc = await createRental({ title: "Giữ phường", ward: ward.id });
      const removeWard = () => payload.delete({ collection: "wards", id: ward.id, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(removeWard())).toBe(409);
      await updateRental(doc.id, { deletedAt: NOW() });
      expect(await statusOf(removeWard())).toBe(409);
      await deleteRental(doc.id, admin);
      await removeWard();
    });
  });

  describe("quyền (PERMISSION §3.1)", () => {
    it("sale tạo tin của mình (author tự gán); sale sửa / xoá tin của sale khác → 403", async () => {
      const mine = await createRental({ title: "Tin của sale" });
      expect(String(typeof mine.author === "object" ? mine.author.id : mine.author)).toBe(sale.id);
      expect((await updateRental(mine.id, { address: "Sửa của mình" }, { as: sale })).address).toBe("Sửa của mình");
      expect(await statusOf(updateRental(mine.id, { address: "Phá" }, { as: otherSale }))).toBe(403);
      expect(await statusOf(updateRental(mine.id, { deletedAt: NOW() }, { as: otherSale }))).toBe(403);
      expect(await statusOf(deleteRental(mine.id, otherSale))).toBe(403);
    });

    it("sale xoá mềm tin của mình nhưng không xoá hẳn và không khôi phục; admin khôi phục và xoá hẳn", async () => {
      const mine = await createRental({ title: "Xoá mềm" });
      await updateRental(mine.id, { deletedAt: NOW() }, { as: sale });
      expect(await statusOf(deleteRental(mine.id, sale))).toBe(403);
      expect(await statusOf(updateRental(mine.id, { deletedAt: null }, { as: sale, trash: true }))).toBe(403);
      const restored = await updateRental(mine.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      await deleteRental(mine.id, admin);
      const gone = await payload.find({ collection: "rentals", where: { id: { equals: mine.id } }, trash: true, overrideAccess: true });
      expect(gone.docs).toHaveLength(0);
    });

    it("admin sửa tin của sale; khách không tạo được", async () => {
      const mine = await createRental({ title: "Admin sửa" });
      expect((await updateRental(mine.id, { address: "Admin đã sửa" })).address).toBe("Admin đã sửa");
      const guestCreate = payload.create({
        collection: "rentals",
        data: {
          title: "Khách",
          description: lexical("x"),
          category: categoryId,
          province: provinceId,
          ward: wardId,
          address: "a",
          priceMonthlyVnd: 1,
          areaM2: 1,
        } as never,
        overrideAccess: false,
      });
      expect(await statusOf(guestCreate)).toBe(403);
    });
  });

  describe("category thuộc scope rental", () => {
    it("danh mục sai scope → 400; không xoá được danh mục đang có tin cho thuê (xoá hẳn và xoá mềm → 409)", async () => {
      const wrong = await createCategory("Tin X", "news");
      expect(await statusOf(createRental({ title: "Sai scope", category: wrong.id }))).toBe(400);
      const category = await createCategory("Có tin cho thuê", "rental");
      const doc = await createRental({ title: "Giữ danh mục", category: category.id });
      const hardDelete = () => payload.delete({ collection: "categories", id: category.id, user: asUser(admin), overrideAccess: false, trash: true });
      const softDelete = () =>
        payload.update({ collection: "categories", id: category.id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(hardDelete())).toBe(409);
      expect(await statusOf(softDelete())).toBe(409);
      await deleteRental(doc.id, admin);
      await hardDelete();
    });
  });

  describe("slug + truy vấn công khai + làm mới cache", () => {
    it("slug sinh từ tiêu đề, trùng thì thêm hậu tố", async () => {
      expect((await createRental({ title: "Căn Hộ Sông Hồng" })).slug).toBe("can-ho-song-hong");
      expect((await createRental({ title: "Căn Hộ Sông Hồng" })).slug).toBe("can-ho-song-hong-2");
    });

    it("PublicCollectionSlug nhận rentals: khách thấy published và rented, không thấy draft / hidden / xoá mềm; en cần hasEnglish", async () => {
      const live = await createRental({ title: "Tin công khai", status: "published", gallery: imageIds });
      const rented = await createRental({ title: "Tin đã thuê", status: "published", gallery: imageIds });
      await updateRental(rented.id, { status: "rented" });
      await createRental({ title: "Tin nháp" });
      const hidden = await createRental({ title: "Tin ẩn", status: "published", gallery: imageIds });
      await updateRental(hidden.id, { status: "hidden" });
      const gone = await createRental({ title: "Tin xoá", status: "published", gallery: imageIds });
      await updateRental(gone.id, { deletedAt: NOW() });

      const titles = (await publicQueries.findPublicList<{ title: string }>(payload, "rentals", "vi", { limit: 100 })).docs.map((doc) => doc.title);
      expect(titles).toEqual(expect.arrayContaining(["Tin công khai", "Tin đã thuê"]));
      for (const unseen of ["Tin nháp", "Tin ẩn", "Tin xoá"]) expect(titles).not.toContain(unseen);

      const publicDoc = await publicQueries.findPublicBySlug<Record<string, unknown>>(payload, "rentals", "vi", "tin-cong-khai");
      expect(publicDoc).not.toBeNull();
      expect("searchText" in publicDoc!).toBe(false);
      expect(await publicQueries.findPublicBySlug(payload, "rentals", "en", "tin-cong-khai")).toBeNull();
      await payload.update({
        collection: "rentals",
        id: live.id,
        data: { title: "Public rental", description: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await publicQueries.findPublicBySlug(payload, "rentals", "en", "public-rental")).not.toBeNull();
    });

    it("xuất bản làm mới /cho-thue/[slug] + /cho-thue của vi và en; nháp thì không", async () => {
      const doc = await createRental({ title: "Làm mới cho thuê" });
      expect(revalidatedPaths).toEqual([]);
      await updateRental(doc.id, { status: "published", gallery: imageIds });
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi/cho-thue/lam-moi-cho-thue", "/vi/cho-thue", "/en/cho-thue"]));
    });
  });

  describe("seed", () => {
    it("seedSampleRentals: thiếu danh mục mẫu báo lỗi rõ; chạy 2 lần không nhân đôi; tin là bản nháp đúng tỉnh/phường", async () => {
      await expect(seedSampleRentals(payload)).rejects.toThrow(/pnpm seed/);
      await payload.create({ collection: "categories", data: { name: "Căn hộ chung cư", scope: "rental" } as never, locale: "vi", overrideAccess: true });
      expect(await seedSampleRentals(payload)).toEqual({ created: 2, skipped: 0 });
      expect(await seedSampleRentals(payload)).toEqual({ created: 0, skipped: 2 });
      const seeded = await payload.find({
        collection: "rentals",
        where: { title: { equals: "Studio mẫu gần hồ Tây" } },
        locale: "vi",
        depth: 0,
        overrideAccess: true,
      });
      expect(seeded.docs[0]?.status).toBe("draft");
      expect(seeded.docs[0]?.priceNegotiable).toBe(true);
      expect(seeded.docs[0]?.province).toBe(otherProvinceId);
      expect(seeded.docs[0]?.ward).toBe(otherProvinceWardId);
      expect(seeded.docs[0]?.code).toMatch(/^CT-\d{6}$/);
    });
  });

  describe("ô tìm kiếm danh sách (listSearchableFields)", () => {
    const searchOf = async (search: string, user: Actor = admin) => {
      const { mergeListSearchAndWhere } = await import("payload/shared");
      // Đúng `where` mà danh sách admin tạo ra.
      const where = mergeListSearchAndWhere({ collectionConfig: payload.collections.rentals!.config, search });
      const found = await payload.find({ collection: "rentals", where, limit: 500, depth: 0, locale: "vi", user: asUser(user), overrideAccess: false });
      return found.docs.map((doc) => doc.id);
    };

    it("cấu hình tìm theo mã, tiêu đề, địa chỉ", () => {
      expect(payload.collections.rentals!.config.admin.listSearchableFields).toEqual(["code", "title", "address"]);
    });

    it("mã CT-, tên đường (một phần, không phân biệt hoa thường) và tiêu đề đều ra tin", async () => {
      const doc = await createRental({ title: "Căn hộ tìm kiếm Alpha", address: "88 Đường Nguyễn Văn Linh Test" });
      const other = await createRental({ title: "Căn hộ khác Beta", address: "5 Đường Lê Lợi Test" });
      expect(await searchOf(doc.code)).toEqual([doc.id]);
      expect(await searchOf("nguyễn văn linh")).toEqual([doc.id]);
      expect(await searchOf("Alpha")).toEqual([doc.id]);
      expect(await searchOf("Lê Lợi Test", sale)).toEqual([other.id]);
    });
  });
});
