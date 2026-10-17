import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedSampleProjects } from "../../seed/sample/projects";
import { ROLES } from "../../src/access/roles";

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

describe.skipIf(!baseUrl)("integration: projects (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_projects_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const revalidatedPaths: string[][] = [];
  const mediaIds: string[] = [];
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;
  let categoryId = "";
  let provinceId = "";
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

  const createProject = (data: Record<string, unknown>, { as = sale, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "projects",
      data: {
        summary: "Tóm tắt",
        overview: lexical("Tổng quan"),
        category: categoryId,
        province: provinceId,
        salesStatus: "selling",
        ...data,
      } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updateProject = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi", trash = false }: Options = {}) =>
    payload.update({ collection: "projects", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0, trash });

  const deleteProject = (id: string, as: Actor) =>
    payload.delete({ collection: "projects", id, user: asUser(as), overrideAccess: false, trash: true });

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
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
    // `location` là geometry(Point): DB mới tạo từ template1 chưa có PostGIS (chỉ DB dev được init.sql bật).
    await withDatabase((client) => client.query(`CREATE EXTENSION IF NOT EXISTS postgis`));
    const { getPayload } = await import("payload");
    const { buildProjectsTestConfig } = await import("../fixtures/projects/payload-config");
    payload = await getPayload({ config: buildProjectsTestConfig(testUrl, (paths) => void revalidatedPaths.push(paths)) });
    publicQueries = await import("../../src/lib/content/public-queries");
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("othersale", ROLES.sale);
    categoryId = (await createCategory("Căn hộ", "project")).id;
    provinceId = (
      await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })
    ).id;
    // Trường upload chỉ cần `media` tồn tại: chèn thẳng dòng để khỏi ghi file ra đĩa.
    for (const mimeType of ["image/jpeg", "image/png", "application/pdf"]) {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, [mimeType]));
      mediaIds.push(inserted.rows[0].id as string);
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

  beforeEach(() => {
    revalidatedPaths.length = 0;
  });

  describe("cấu hình + schema", () => {
    it("đủ trường ERD §4.5", () => {
      const names = payload.collections.projects!.config.flattenedFields.map((field) => field.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "title", "slug", "category", "developer", "salesStatus", "province", "ward", "address", "location",
          "priceFromVnd", "priceToVnd", "areaFromM2", "areaToM2", "scale", "summary", "overview", "amenities",
          "gallery", "floorPlans", "documents", "legalInfo", "salesPolicy", "isFeatured", "status", "publishedAt",
          "author", "hasEnglish", "translation", "seo",
        ]),
      );
      expect(payload.collections.projects!.config.trash).toBe(true);
    });

    it("DB tạm có UNIQUE (slug, _locale) trên projects_locales và index lọc cơ bản", async () => {
      const locales = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'projects_locales'`));
      expect(locales.rows.some((row) => String(row.indexdef).includes("UNIQUE") && String(row.indexdef).includes("(slug, _locale)"))).toBe(true);
      const main = await withDatabase((client) => client.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'projects'`));
      const names = main.rows.map((row) => String(row.indexname));
      expect(names).toEqual(
        expect.arrayContaining(["projects_sales_status_idx", "projects_province_idx", "projects_status_idx", "projects_has_english_idx"]),
      );
    });

    it("lưu và đọc lại đủ nhóm trường: location, scale, amenities, floorPlans, giá, diện tích, tài liệu", async () => {
      const doc = await createProject({
        title: "Dự án đủ trường",
        address: "1 Phố Test",
        location: [105.85, 21.03],
        priceFromVnd: 1_000_000_000,
        priceToVnd: 2_000_000_000,
        areaFromM2: 40,
        areaToM2: 90,
        scale: { totalUnits: 500, blocks: 3, floors: 30, landAreaM2: 12000.5, handoverTime: "Quý 4/2027" },
        amenities: [{ name: "Hồ bơi", icon: "pool" }],
        floorPlans: [{ title: "Căn 2PN", image: mediaIds[0] }],
        documents: [mediaIds[2]],
        gallery: [mediaIds[0], mediaIds[1]],
        legalInfo: lexical("Sổ hồng lâu dài"),
        salesPolicy: lexical("Chiết khấu 5%"),
      });
      const stored = await payload.findByID({ collection: "projects", id: doc.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(stored.location).toEqual([105.85, 21.03]);
      expect(stored.scale).toMatchObject({ totalUnits: 500, blocks: 3, floors: 30, landAreaM2: 12000.5, handoverTime: "Quý 4/2027" });
      expect(stored.amenities?.[0]).toMatchObject({ name: "Hồ bơi", icon: "pool" });
      expect(stored.floorPlans?.[0]).toMatchObject({ title: "Căn 2PN", image: mediaIds[0] });
      expect(stored.gallery).toEqual([mediaIds[0], mediaIds[1]]);
      expect(stored.documents).toEqual([mediaIds[2]]);
      expect(stored.priceFromVnd).toBe(1_000_000_000);
    });

    it("số âm, salesStatus lạ, thiếu province / salesStatus → 400", async () => {
      expect(await statusOf(createProject({ title: "Giá âm", priceFromVnd: -1 }))).toBe(400);
      expect(await statusOf(createProject({ title: "Diện tích âm", areaToM2: -5 }))).toBe(400);
      expect(await statusOf(createProject({ title: "Trạng thái lạ", salesStatus: "xyz" }))).toBe(400);
      expect(await statusOf(createProject({ title: "Thiếu tỉnh", province: null }))).toBe(400);
      expect(await statusOf(createProject({ title: "Thiếu bán hàng", salesStatus: null }))).toBe(400);
    });
  });

  describe("gallery bắt buộc khi published", () => {
    it("published thiếu gallery (hoặc gallery rỗng) → 400; nháp được; có gallery → xuất bản; không gỡ hết ảnh được", async () => {
      expect(await statusOf(createProject({ title: "Xuất bản thiếu ảnh", status: "published" }))).toBe(400);
      expect(await statusOf(createProject({ title: "Xuất bản ảnh rỗng", status: "published", gallery: [] }))).toBe(400);
      const draft = await createProject({ title: "Nháp không ảnh" });
      expect(draft.status).toBe("draft");
      const published = await createProject({ title: "Có ảnh", status: "published", gallery: [mediaIds[0], mediaIds[1]] });
      expect(published.status).toBe("published");
      expect((await updateProject(published.id, { summary: "Sửa một phần" })).summary).toBe("Sửa một phần");
      expect(await statusOf(updateProject(published.id, { gallery: [] }))).toBe(400);
    });

    it("nháp chưa có ảnh không xuất bản được nếu không gửi gallery; gửi kèm thì được và giữ thứ tự (ảnh đầu = đại diện)", async () => {
      const draft = await createProject({ title: "Nháp rồi xuất bản" });
      expect(await statusOf(updateProject(draft.id, { status: "published" }))).toBe(400);
      const published = await updateProject(draft.id, { status: "published", gallery: [mediaIds[1], mediaIds[0]] });
      expect(published.gallery).toEqual([mediaIds[1], mediaIds[0]]);
    });
  });

  describe("quyền (PERMISSION §3.1)", () => {
    it("sale tạo dự án của mình (author tự gán); sale sửa / xoá dự án của sale khác → 403", async () => {
      const mine = await createProject({ title: "Dự án của sale" });
      expect(String(typeof mine.author === "object" ? mine.author.id : mine.author)).toBe(sale.id);
      expect((await updateProject(mine.id, { summary: "Sửa của mình" }, { as: sale })).summary).toBe("Sửa của mình");
      expect(await statusOf(updateProject(mine.id, { summary: "Phá" }, { as: otherSale }))).toBe(403);
      expect(await statusOf(updateProject(mine.id, { deletedAt: NOW() }, { as: otherSale }))).toBe(403);
      expect(await statusOf(deleteProject(mine.id, otherSale))).toBe(403);
    });

    it("sale xoá mềm dự án của mình nhưng không xoá hẳn và không khôi phục; admin khôi phục và xoá hẳn", async () => {
      const mine = await createProject({ title: "Xoá mềm" });
      await updateProject(mine.id, { deletedAt: NOW() }, { as: sale });
      expect(await statusOf(deleteProject(mine.id, sale))).toBe(403);
      expect(await statusOf(updateProject(mine.id, { deletedAt: null }, { as: sale, trash: true }))).toBe(403);
      const restored = await updateProject(mine.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      await deleteProject(mine.id, admin);
      const gone = await payload.find({ collection: "projects", where: { id: { equals: mine.id } }, trash: true, overrideAccess: true });
      expect(gone.docs).toHaveLength(0);
    });

    it("admin sửa dự án của sale; khách không tạo được", async () => {
      const mine = await createProject({ title: "Admin sửa" });
      expect((await updateProject(mine.id, { summary: "Admin đã sửa" })).summary).toBe("Admin đã sửa");
      const guestCreate = payload.create({
        collection: "projects",
        data: { title: "Khách", summary: "x", category: categoryId, province: provinceId, salesStatus: "selling" } as never,
        overrideAccess: false,
      });
      expect(await statusOf(guestCreate)).toBe(403);
    });
  });

  describe("category thuộc scope project", () => {
    it("danh mục sai scope hoặc thiếu → 400; đúng scope → được", async () => {
      const wrong = await createCategory("Tin X", "news");
      expect(await statusOf(createProject({ title: "Sai scope", category: wrong.id }))).toBe(400);
      expect(await statusOf(createProject({ title: "Thiếu danh mục", category: null }))).toBe(400);
      expect((await createProject({ title: "Đúng scope" })).category).toBe(categoryId);
    });

    it("không xoá được danh mục đang có dự án (xoá hẳn và xoá mềm → 409); hết dự án thì xoá được", async () => {
      const category = await createCategory("Có dự án", "project");
      const doc = await createProject({ title: "Giữ danh mục", category: category.id });
      const hardDelete = () => payload.delete({ collection: "categories", id: category.id, user: asUser(admin), overrideAccess: false, trash: true });
      const softDelete = () =>
        payload.update({ collection: "categories", id: category.id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(hardDelete())).toBe(409);
      expect(await statusOf(softDelete())).toBe(409);
      await deleteProject(doc.id, admin);
      await hardDelete();
    });
  });

  describe("trường bắt buộc + slug", () => {
    it("title, summary bắt buộc ở bản vi; slug sinh từ tiêu đề và tự thêm hậu tố khi trùng", async () => {
      expect(await statusOf(createProject({ title: "" }))).toBe(400);
      expect(await statusOf(createProject({ title: "Thiếu tóm tắt", summary: "" }))).toBe(400);
      expect((await createProject({ title: "Dự Án Sông Hồng" })).slug).toBe("du-an-song-hong");
      expect((await createProject({ title: "Dự Án Sông Hồng" })).slug).toBe("du-an-song-hong-2");
    });
  });

  describe("truy vấn công khai (publicWhere) + làm mới cache", () => {
    it("PublicCollectionSlug nhận projects: khách không thấy draft / hidden / xoá mềm; en cần hasEnglish; slug theo locale", async () => {
      const gallery = [mediaIds[0]];
      const live = await createProject({ title: "Dự án công khai", status: "published", gallery });
      await createProject({ title: "Dự án nháp" });
      const hidden = await createProject({ title: "Dự án ẩn", status: "published", gallery });
      await updateProject(hidden.id, { status: "hidden" });
      const gone = await createProject({ title: "Dự án xoá", status: "published", gallery });
      await updateProject(gone.id, { deletedAt: NOW() });

      const titles = (await publicQueries.findPublicList<{ title: string }>(payload, "projects", "vi")).docs.map((doc) => doc.title);
      expect(titles).toContain("Dự án công khai");
      for (const unseen of ["Dự án nháp", "Dự án ẩn", "Dự án xoá"]) expect(titles).not.toContain(unseen);

      expect(await publicQueries.findPublicBySlug(payload, "projects", "vi", "du-an-nhap")).toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "projects", "en", "du-an-cong-khai")).toBeNull();
      await payload.update({
        collection: "projects",
        id: live.id,
        data: { title: "Public project", summary: "S", overview: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await publicQueries.findPublicBySlug(payload, "projects", "en", "public-project")).not.toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "projects", "vi", "du-an-cong-khai")).not.toBeNull();
    });

    it("xuất bản làm mới /du-an/[slug] + /du-an của vi và en; nháp thì không; nổi bật làm mới trang chủ", async () => {
      const doc = await createProject({ title: "Làm mới dự án" });
      expect(revalidatedPaths).toEqual([]);
      await updateProject(doc.id, { status: "published", gallery: [mediaIds[0]], isFeatured: true });
      expect(revalidatedPaths.flat()).toEqual(
        expect.arrayContaining(["/vi/du-an/lam-moi-du-an", "/vi/du-an", "/en/du-an", "/vi", "/en"]),
      );
    });
  });

  describe("Duplicate", () => {
    it("slug không thành 'xyz - Copy' và hasEnglish của bản sao = false", async () => {
      const doc = await createProject({ title: "Bản gốc song ngữ" });
      await payload.update({
        collection: "projects",
        id: doc.id,
        data: { title: "Bilingual original", summary: "S", overview: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const copy = await payload.duplicate({ collection: "projects", id: doc.id, overrideAccess: true, depth: 0, locale: "vi" });
      const stored = await payload.findByID({ collection: "projects", id: copy.id, locale: "all", overrideAccess: true, depth: 0 });
      const slugs = stored.slug as unknown as Record<Locale, string | null>;
      expect(JSON.stringify(slugs)).not.toMatch(/copy/i);
      expect(slugs.vi).toBe("ban-goc-song-ngu-2");
      expect(stored.hasEnglish).toBe(false);
    });
  });

  describe("seed", () => {
    it("seedSampleProjects: thiếu tỉnh báo lỗi rõ; chạy 2 lần không nhân đôi; dự án là bản nháp", async () => {
      await expect(seedSampleProjects(payload)).rejects.toThrow(/pnpm seed/);
      await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true });
      expect(await seedSampleProjects(payload)).toEqual({ created: 2, skipped: 0 });
      expect(await seedSampleProjects(payload)).toEqual({ created: 0, skipped: 2 });
      const seeded = await payload.find({
        collection: "projects",
        where: { title: { equals: "Dự án mẫu Khu đô thị Tây Hồ" } },
        locale: "vi",
        depth: 0,
        overrideAccess: true,
      });
      expect(seeded.docs[0]?.status).toBe("draft");
      expect(seeded.docs[0]?.salesStatus).toBe("upcoming");
      expect(seeded.docs[0]?.location).toEqual([105.8194, 21.0586]);
    });
  });
});
