import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;
const SITE = "https://tami.example";

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

describe.skipIf(!baseUrl)("integration: sitemap — cho thuê + danh mục (DB tạm)", () => {
  const dbName = `tami_sitemap_rentals_${Date.now().toString(36)}`;
  let payload: Payload;
  let testUrl: string;
  let sitemap: typeof import("../../src/lib/seo/sitemap-data");
  let saleId = "";
  let categoryId = "";
  let provinceId = "";
  let wardId = "";
  const imageIds: string[] = [];

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

  const enableEnglish = (id: string, title: string) =>
    payload.update({ collection: "rentals", id, data: { title, description: lexical("en"), hasEnglish: true } as never, locale: "en", overrideAccess: true });

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
    sitemap = await import("../../src/lib/seo/sitemap-data");

    saleId = (
      await payload.create({
        collection: "staff",
        overrideAccess: true,
        data: { email: `sale-${dbName}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Sale", phone: "0901 111 222", role: ROLES.sale, active: true },
      })
    ).id;
    const category = (name: string, scope: string) => payload.create({ collection: "categories", data: { name, scope } as never, locale: "vi", overrideAccess: true, depth: 0 });
    categoryId = (await category("Căn hộ", "rental")).id;
    await category("Tin thị trường", "news");
    await category("Danh mục BĐS", "property_post");
    provinceId = (await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })).id;
    wardId = (await payload.create({ collection: "wards", data: { province: provinceId, code: "70101063", name: "Phường Sài Gòn", type: "phuong", slug: "sai-gon" }, overrideAccess: true })).id;
    for (let index = 0; index < 3; index += 1) {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, ["image/jpeg"]));
      imageIds.push(inserted.rows[0].id as string);
    }
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

  it("cho thuê: chỉ published (loại draft, hidden, rented, xoá mềm, seo.noindex); EN chỉ khi hasEnglish; lastmod = updatedAt", async () => {
    const live = await createRental({ title: "Tin công khai", slug: "tin-cong-khai" });
    const translated = await createRental({ title: "Tin có bản EN", slug: "tin-co-ban-en" });
    await enableEnglish(translated.id, "Translated listing");
    await createRental({ title: "Tin nháp", slug: "tin-nhap", status: "draft" });
    await createRental({ title: "Tin ẩn", slug: "tin-an", status: "hidden" });
    await createRental({ title: "Tin đã thuê", slug: "tin-da-thue", status: "rented" });
    await createRental({ title: "Tin noindex", slug: "tin-noindex", seo: { noindex: true } });
    const gone = await createRental({ title: "Tin xoá", slug: "tin-xoa" });
    await payload.update({ collection: "rentals", id: gone.id, data: { deletedAt: new Date().toISOString() } as never, overrideAccess: true, locale: "vi" });

    const urls = await sitemap.loadSectionUrls(payload, "rentals", 1, SITE, new Date());
    expect(urls.map((url) => url.loc).sort()).toEqual(
      [`${SITE}/cho-thue/tin-cong-khai`, `${SITE}/cho-thue/tin-co-ban-en`, `${SITE}/en/for-rent/translated-listing`].sort(),
    );
    const viLive = urls.find((url) => url.loc === `${SITE}/cho-thue/tin-cong-khai`);
    expect(viLive?.alternates).toEqual([]);
    expect(viLive?.lastmod).toBe(new Date(live.updatedAt).toISOString());
    const viTranslated = urls.find((url) => url.loc === `${SITE}/cho-thue/tin-co-ban-en`);
    expect(viTranslated?.alternates.map((alt) => alt.hreflang)).toEqual(["vi", "en", "x-default"]);
    expect(await sitemap.countSectionChunks(payload, "rentals", new Date())).toBe(1);
  });

  it("danh mục: chỉ scope news cho nhóm categories-news (scope khác không vào)", async () => {
    const urls = await sitemap.loadSectionUrls(payload, "categories-news", 1, SITE, new Date());
    expect(urls.map((url) => url.loc)).toEqual([`${SITE}/tin-tuc/danh-muc/tin-thi-truong`]);
  });

  it("danh mục Cho thuê (S05): nhóm categories-rentals chỉ scope rental; loại xoá mềm và seo.noindex; EN chỉ khi hasEnglish", async () => {
    const make = async (name: string, data: Record<string, unknown> = {}) =>
      payload.create({ collection: "categories", data: { name, scope: "rental", ...data } as never, locale: "vi", overrideAccess: true, depth: 0 });
    const translated = await make("Văn phòng");
    await payload.update({ collection: "categories", id: translated.id, data: { name: "Office", hasEnglish: true } as never, locale: "en", overrideAccess: true });
    await make("Kho xưởng noindex", { seo: { noindex: true } });
    const gone = await make("Mặt bằng đã xoá");
    await payload.update({ collection: "categories", id: gone.id, data: { deletedAt: new Date().toISOString() } as never, locale: "vi", overrideAccess: true });

    const locs = (await sitemap.loadSectionUrls(payload, "categories-rentals", 1, SITE, new Date())).map((url) => url.loc);
    expect(locs).toContain(`${SITE}/cho-thue/danh-muc/can-ho`);
    expect(locs).toContain(`${SITE}/cho-thue/danh-muc/van-phong`);
    expect(locs).toContain(`${SITE}/en/for-rent/category/office`);
    expect(locs.some((loc) => loc.includes("kho-xuong") || loc.includes("mat-bang"))).toBe(false);
    expect(locs.some((loc) => loc.includes("tin-thi-truong") || loc.includes("danh-muc-bds"))).toBe(false);
    expect(await sitemap.countSectionChunks(payload, "categories-rentals", new Date())).toBeGreaterThanOrEqual(1);
  });

  it("danh mục: seo.noindex xét theo từng ngôn ngữ (cả hai / chỉ vi / chỉ en)", async () => {
    const make = async (name: string, enName: string, noindex: { vi: boolean; en: boolean }) => {
      const created = await payload.create({
        collection: "categories",
        data: { name, scope: "news", seo: { noindex: noindex.vi } } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      await payload.update({
        collection: "categories",
        id: created.id,
        data: { name: enName, hasEnglish: true, seo: { noindex: noindex.en } } as never,
        locale: "en",
        overrideAccess: true,
      });
    };
    await make("Ẩn cả hai", "Hidden both", { vi: true, en: true });
    await make("Ẩn tiếng Việt", "Hidden vi only", { vi: true, en: false });
    await make("Ẩn tiếng Anh", "Hidden en only", { vi: false, en: true });

    const locs = (await sitemap.loadSectionUrls(payload, "categories-news", 1, SITE, new Date())).map((url) => url.loc);
    expect(locs).toContain(`${SITE}/tin-tuc/danh-muc/tin-thi-truong`);
    expect(locs.some((loc) => loc.includes("an-ca-hai") || loc.includes("hidden-both"))).toBe(false);
    expect(locs).toContain(`${SITE}/en/news/category/hidden-vi-only`);
    expect(locs).not.toContain(`${SITE}/tin-tuc/danh-muc/an-tieng-viet`);
    expect(locs).toContain(`${SITE}/tin-tuc/danh-muc/an-tieng-anh`);
    expect(locs).not.toContain(`${SITE}/en/news/category/hidden-en-only`);
  });
});
