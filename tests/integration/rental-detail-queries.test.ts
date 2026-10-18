import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

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

describe.skipIf(!baseUrl)("integration: truy vấn trang chi tiết cho thuê (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_rental_detail_${runId}`;
  let payload: Payload;
  let testUrl: string;
  let queries: typeof import("../../src/lib/rentals/rental-queries");
  let saleId = "";
  let lockedSaleId = "";
  let categoryId = "";
  let otherCategoryId = "";
  let provinceId = "";
  let otherProvinceId = "";
  let wardId = "";
  const imageIds: string[] = [];
  let otherWardId = "";

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  const createRental = (data: Record<string, unknown>) =>
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
        author: saleId,
        status: "published",
        gallery: imageIds,
        ...data,
      } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });

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
    await withDatabase((client) => client.query(`CREATE EXTENSION IF NOT EXISTS postgis`));
    const { getPayload } = await import("payload");
    const { buildRentalsTestConfig } = await import("../fixtures/rentals/payload-config");
    payload = await getPayload({ config: buildRentalsTestConfig(testUrl, () => undefined) });
    await withDatabase((client) => client.query(`CREATE SEQUENCE IF NOT EXISTS rentals_code_seq START 1`));
    queries = await import("../../src/lib/rentals/rental-queries");

    const createStaff = (label: string, active: boolean) =>
      payload.create({
        collection: "staff",
        overrideAccess: true,
        data: { email: `${label}-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: `Sale ${label}`, phone: "0901 111 222", role: ROLES.sale, active },
      });
    saleId = (await createStaff("active", true)).id;
    lockedSaleId = (await createStaff("locked", false)).id;
    const category = (name: string) => payload.create({ collection: "categories", data: { name, scope: "rental" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    categoryId = (await category("Căn hộ")).id;
    otherCategoryId = (await category("Nhà phố")).id;
    const province = (code: string, name: string, slug: string) => payload.create({ collection: "provinces", data: { code, name, slug }, overrideAccess: true });
    provinceId = (await province("79", "Thành phố Hồ Chí Minh", "ho-chi-minh")).id;
    otherProvinceId = (await province("01", "Thành phố Hà Nội", "ha-noi")).id;
    const ward = (province_: string, code: string, name: string, slug: string) =>
      payload.create({ collection: "wards", data: { province: province_, code, name, type: "phuong", slug }, overrideAccess: true });
    // Xuất bản cần >= 3 ảnh: chỉ cần dòng `media` tồn tại (chèn thẳng để khỏi ghi file ra đĩa).
    for (let index = 0; index < 3; index += 1) {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, ["image/jpeg"]));
      imageIds.push(inserted.rows[0].id as string);
    }
    wardId = (await ward(provinceId, "70101063", "Phường Sài Gòn", "sai-gon")).id;
    otherWardId = (await ward(otherProvinceId, "00004", "Phường Ba Đình", "ba-dinh")).id;
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

  it("findPublicRentalBySlug: đọc như khách — tin published và rented có, hidden/draft không; address + location bị chặn khi tắt showExactAddress", async () => {
    await createRental({ title: "Tin công khai", slug: "tin-cong-khai", showExactAddress: false, location: [106.700981, 10.776889] });
    await createRental({ title: "Tin đã thuê", slug: "tin-da-thue", status: "rented" });
    await createRental({ title: "Tin ẩn", slug: "tin-an", status: "hidden" });
    await createRental({ title: "Tin nháp", slug: "tin-nhap", status: "draft" });

    const published = await queries.findPublicRentalBySlug(payload, "vi", "tin-cong-khai");
    expect(published?.title).toBe("Tin công khai");
    expect(published?.address).toBeUndefined();
    expect(published?.location).toBeUndefined();
    expect((await queries.findPublicRentalBySlug(payload, "vi", "tin-da-thue"))?.status).toBe("rented");
    expect(await queries.findPublicRentalBySlug(payload, "vi", "tin-an")).toBeNull();
    expect(await queries.findPublicRentalBySlug(payload, "vi", "tin-nhap")).toBeNull();
    expect(await queries.findPublicRentalBySlug(payload, "en", "tin-cong-khai")).toBeNull();
  });

  it("findRentalPrivateFields: lấy author + location bằng overrideAccess dù khách không đọc được", async () => {
    const created = await createRental({ title: "Tin có toạ độ", slug: "tin-co-toa-do", showExactAddress: false, location: [106.700981, 10.776889] });
    expect(await queries.findRentalPrivateFields(payload, created.id)).toEqual({ authorId: saleId, location: [106.700981, 10.776889] });
    const noLocation = await createRental({ title: "Tin chưa có toạ độ", slug: "tin-chua-co-toa-do" });
    expect(await queries.findRentalPrivateFields(payload, noLocation.id)).toEqual({ authorId: saleId, location: null });
  });

  it("findActiveSaleContact: sale hoạt động → tên + SĐT; sale khoá, đã xoá hoặc không có id → null; không lộ email/vai trò", async () => {
    const active = await queries.findActiveSaleContact(payload, "vi", saleId);
    expect(active).toEqual({ fullName: "Sale active", phone: "0901 111 222", avatar: null });
    expect(Object.keys(active ?? {})).not.toEqual(expect.arrayContaining(["email", "role"]));
    expect(await queries.findActiveSaleContact(payload, "vi", lockedSaleId)).toBeNull();
    expect(await queries.findActiveSaleContact(payload, "vi", "00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(await queries.findActiveSaleContact(payload, "vi", null)).toBeNull();
  });

  it("findActiveSaleContact: avatar đọc như khách — không lộ uploadedBy, alt theo locale (/en dùng bản EN)", async () => {
    const inserted = await withDatabase(async (client) => {
      const media = await client.query(`INSERT INTO "media" (mime_type, filename, width, uploaded_by_id) VALUES ($1, $2, $3, $4) RETURNING id`, ["image/jpeg", "avatar.jpg", 400, saleId]);
      const id = media.rows[0].id as string;
      await client.query(`INSERT INTO "media_locales" (alt, _locale, _parent_id) VALUES ($1, 'vi', $3), ($2, 'en', $3)`, ["Ảnh sale", "Sale photo", id]);
      return id;
    });
    await payload.update({ collection: "staff", id: saleId, data: { avatar: inserted } as never, overrideAccess: true, depth: 0 });

    const vi = await queries.findActiveSaleContact(payload, "vi", saleId);
    const en = await queries.findActiveSaleContact(payload, "en", saleId);
    expect(vi?.avatar?.url).toBe("/api/media/file/avatar.jpg");
    expect(vi?.avatar?.alt).toBe("Ảnh sale");
    expect(en?.avatar?.alt).toBe("Sale photo");
    expect(vi?.avatar).not.toHaveProperty("uploadedBy");
    expect(JSON.stringify(vi)).not.toContain(saleId);
    await payload.update({ collection: "staff", id: saleId, data: { avatar: null } as never, overrideAccess: true, depth: 0 });
  });

  describe("findSimilarRentals", () => {
    const seedCluster = async () => {
      const current = await createRental({ title: "Hiện tại", slug: "hien-tai" });
      for (let index = 1; index <= 5; index += 1) await createRental({ title: `Cùng khu ${index}`, slug: `cung-khu-${index}` });
      await createRental({ title: "Khác danh mục", slug: "khac-danh-muc", category: otherCategoryId });
      await createRental({ title: "Khác tỉnh", slug: "khac-tinh", province: otherProvinceId, ward: otherWardId });
      await createRental({ title: "Cùng khu đã thuê", slug: "cung-khu-da-thue", status: "rented" });
      await createRental({ title: "Cùng khu ẩn", slug: "cung-khu-an", status: "hidden" });
      return current;
    };

    it("cùng danh mục + tỉnh, loại tin hiện tại, rented/hidden/khác khu vực bị loại, tối đa 4 (tin đã thuê: 8)", async () => {
      const current = await seedCluster();
      const similar = await queries.findSimilarRentals(payload, "vi", { id: current.id, category: categoryId, province: provinceId, status: "published" });
      expect(similar).toHaveLength(4);
      const titles = similar.map((doc) => doc.title);
      expect(titles.every((title) => title?.startsWith("Cùng khu ") && !title.includes("đã thuê") && !title.includes("ẩn"))).toBe(true);
      expect(similar.map((doc) => doc.id)).not.toContain(current.id);

      const whenRented = await queries.findSimilarRentals(payload, "vi", { id: current.id, category: categoryId, province: provinceId, status: "rented" });
      // Còn 5 tin published cùng khu (+ các tin cùng khu từ test trước): nhiều hơn 4 nhưng không có tin rented/hidden.
      expect(whenRented.length).toBeGreaterThan(4);
      expect(whenRented.length).toBeLessThanOrEqual(8);
      expect(whenRented.every((doc) => doc.status === "published")).toBe(true);
    });

    it("thẻ chỉ mang trường cần (select): không có mô tả, điều khoản; /en chỉ tin có bản EN", async () => {
      const current = await createRental({ title: "Hiện tại 2", slug: "hien-tai-2" });
      const [card] = await queries.findSimilarRentals(payload, "vi", { id: current.id, category: categoryId, province: provinceId, status: "published" });
      expect(card).toBeDefined();
      expect(card).toHaveProperty("title");
      expect(card).not.toHaveProperty("description");
      expect(card).not.toHaveProperty("rentalTerms");
      // Thẻ chỉ mang ảnh đầu (không populate cả thư viện).
      expect(card?.gallery).toHaveLength(1);
      expect(card?.gallery?.[0]).toEqual(expect.objectContaining({ id: imageIds[0] }));
      expect(await queries.findSimilarRentals(payload, "en", { id: current.id, category: categoryId, province: provinceId, status: "published" })).toEqual([]);
    });

    it("thiếu cả danh mục lẫn tỉnh → rỗng (không so khớp được)", async () => {
      expect(await queries.findSimilarRentals(payload, "vi", { id: "x", category: null, province: null as never, status: "published" })).toEqual([]);
    });
  });
});
