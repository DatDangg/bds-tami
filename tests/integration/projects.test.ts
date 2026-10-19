import type { EventEmitter } from "node:events";
import { rm } from "node:fs/promises";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import type { Project } from "../../src/payload-types";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedSampleProjects } from "../../seed/sample/projects";
import { ROLES } from "../../src/access/roles";
import { PROJECTS_TEST_MEDIA_DIR } from "../fixtures/projects/payload-config";

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
    await rm(PROJECTS_TEST_MEDIA_DIR, { recursive: true, force: true });
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
          "highlights", "nearbyAmenities", "priceTable", "priceUpdatedAt", "faqs",
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

    it("khối nội dung mở rộng: dự án không có khối nào vẫn lưu; có khối thì lưu/đọc lại đủ, bỏ khối bằng mảng rỗng", async () => {
      const bare = await createProject({ title: "Dự án chưa có khối mở rộng" });
      const bareStored = await payload.findByID({ collection: "projects", id: bare.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(bareStored.highlights ?? []).toEqual([]);
      expect(bareStored.priceTable ?? []).toEqual([]);
      expect(bareStored.priceUpdatedAt ?? null).toBeNull();

      const doc = await createProject({
        title: "Dự án có khối mở rộng",
        highlights: [{ title: "View sông", description: "Căn nhìn sông", icon: "river" }],
        nearbyAmenities: [{ category: "education", name: "Trường Quốc tế", distance: "1,2 km", location: [105.8, 21.0] }],
        priceTable: [{ unitType: "Căn 2PN", areaFrom: 60, areaTo: 75, priceFrom: 3_000_000_000, priceTo: 4_000_000_000, availability: "few_left", note: "Giá chưa VAT" }],
        priceUpdatedAt: "2026-10-01T00:00:00.000Z",
        faqs: [{ question: "Bàn giao khi nào?", answer: "Quý 4/2027" }],
      });
      const stored = await payload.findByID({ collection: "projects", id: doc.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(stored.highlights?.[0]).toMatchObject({ title: "View sông", description: "Căn nhìn sông", icon: "river" });
      expect(stored.nearbyAmenities?.[0]).toMatchObject({ category: "education", name: "Trường Quốc tế", distance: "1,2 km", location: [105.8, 21.0] });
      expect(stored.priceTable?.[0]).toMatchObject({ unitType: "Căn 2PN", areaFrom: 60, areaTo: 75, priceFrom: 3_000_000_000, priceTo: 4_000_000_000, availability: "few_left", note: "Giá chưa VAT" });
      expect(stored.priceUpdatedAt).toBe("2026-10-01T00:00:00.000Z");
      expect(stored.faqs?.[0]).toMatchObject({ question: "Bàn giao khi nào?", answer: "Quý 4/2027" });

      const cleared = await updateProject(doc.id, { highlights: [], nearbyAmenities: [], priceTable: [], faqs: [] });
      expect(cleared.highlights ?? []).toEqual([]);
      expect(cleared.faqs ?? []).toEqual([]);
    });

    it("khối nội dung mở rộng: 'đến' nhỏ hơn 'từ', quá số dòng, nhóm/tình trạng lạ, thiếu tiêu đề → 400", async () => {
      expect(await statusOf(createProject({ title: "Diện tích ngược", priceTable: [{ unitType: "A", areaFrom: 80, areaTo: 70 }] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Giá ngược", priceTable: [{ unitType: "A", priceFrom: 5, priceTo: 4 }] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Giá âm", priceTable: [{ unitType: "A", priceFrom: -1 }] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Tình trạng lạ", priceTable: [{ unitType: "A", availability: "xyz" }] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Nhóm lạ", nearbyAmenities: [{ category: "xyz", name: "B" }] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Thiếu tiêu đề", highlights: [{ description: "x" }] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Thiếu câu trả lời", faqs: [{ question: "Q" }] }))).toBe(400);
      const nine = Array.from({ length: 9 }, (_, index) => ({ title: "Điểm " + index }));
      expect(await statusOf(createProject({ title: "Quá 8 điểm nổi bật", highlights: nine }))).toBe(400);
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

  describe("gallery chỉ nhận ảnh + phường thuộc tỉnh + ảnh bị xoá (follow-up layer-5-task-01)", () => {
    const wardData = (province: string, code: string) => ({ province, code, name: `Phường ${code}`, type: "phuong", slug: `phuong-${code}` });
    let otherProvinceId = "";
    let wardInProvince = "";
    let wardInOtherProvince = "";

    beforeAll(async () => {
      otherProvinceId = (await payload.create({ collection: "provinces", data: { code: "X7", name: "Tỉnh thử phường", slug: "tinh-thu-phuong" }, overrideAccess: true })).id;
      wardInProvince = (await payload.create({ collection: "wards", data: wardData(provinceId, "00010001") as never, overrideAccess: true })).id;
      wardInOtherProvince = (await payload.create({ collection: "wards", data: wardData(otherProvinceId, "00020002") as never, overrideAccess: true })).id;
    });

    it("gallery có PDF → 400 (kể cả nháp); id media sai định dạng hoặc không tồn tại → 400 thay vì 500", async () => {
      const pdfId = mediaIds[2];
      expect(await statusOf(createProject({ title: "Gallery PDF", status: "published", gallery: [mediaIds[0], pdfId] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Nháp gallery PDF", gallery: [pdfId] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Gallery id sai", status: "published", gallery: ["khong-phai-uuid"] }))).toBe(400);
      expect(await statusOf(createProject({ title: "Gallery id không tồn tại", status: "published", gallery: ["00000000-0000-4000-8000-000000000000"] }))).toBe(400);
      const ok = await createProject({ title: "Gallery ảnh", status: "published", gallery: [mediaIds[0]] });
      expect(await statusOf(updateProject(ok.id, { gallery: [mediaIds[0], pdfId] }))).toBe(400);
    });

    it("documents vẫn chỉ nhận PDF (không bị ảnh hưởng)", async () => {
      expect(await statusOf(createProject({ title: "Tài liệu ảnh", documents: [mediaIds[0]] }))).toBe(400);
      expect((await createProject({ title: "Tài liệu PDF", documents: [mediaIds[2]] })).documents).toEqual([mediaIds[2]]);
    });

    it("ward không thuộc province → 400; cùng tỉnh hoặc không chọn phường → được; sửa riêng province làm lệch → 400", async () => {
      expect(await statusOf(createProject({ title: "Phường lệch tỉnh", ward: wardInOtherProvince }))).toBe(400);
      expect(await statusOf(createProject({ title: "Phường không tồn tại", ward: "00000000-0000-4000-8000-000000000000" }))).toBe(400);
      const ok = await createProject({ title: "Phường đúng tỉnh", ward: wardInProvince });
      expect(ok.ward).toBe(wardInProvince);
      expect((await createProject({ title: "Không chọn phường" })).ward ?? null).toBeNull();
      expect(await statusOf(updateProject(ok.id, { province: otherProvinceId }))).toBe(400);
      expect(await statusOf(updateProject(ok.id, { ward: wardInOtherProvince }))).toBe(400);
      expect((await updateProject(ok.id, { province: otherProvinceId, ward: wardInOtherProvince })).province).toBe(otherProvinceId);
    });

    it("ward.filterOptions lọc theo tỉnh đã chọn trong form (admin); chưa chọn tỉnh thì không lọc", async () => {
      const field = payload.collections.projects!.config.flattenedFields.find((item) => item.name === "ward") as {
        filterOptions?: (args: { siblingData?: unknown }) => unknown;
      };
      expect(field.filterOptions?.({ siblingData: { province: provinceId } })).toEqual({ province: { equals: provinceId } });
      expect(field.filterOptions?.({ siblingData: {} })).toBe(true);
    });

    it("dự án published mà mọi ảnh gallery bị xoá (media bị xoá cứng): đọc công khai không lỗi, view trang chi tiết không có hero, thẻ không có cover", async () => {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type, filename, width) VALUES ('image/jpeg', 'tam.jpg', 800) RETURNING id`));
      const tempId = inserted.rows[0].id as string;
      const doc = await createProject({ title: "Mất hết ảnh", status: "published", gallery: [tempId] });
      const detailView = await import("../../src/lib/projects/project-detail-view");
      const cardView = await import("../../src/lib/projects/project-view");
      const before = await publicQueries.findPublicBySlug<Project>(payload, "projects", "vi", doc.slug as string, { depth: 1 });
      expect(detailView.toProjectDetailView(before!, "vi").hero?.url).toBe("/api/media/file/tam.jpg");

      await withDatabase((client) => client.query(`DELETE FROM "media" WHERE id = $1`, [tempId]));
      const after = await publicQueries.findPublicBySlug<Project>(payload, "projects", "vi", doc.slug as string, { depth: 1 });
      expect(after).not.toBeNull();
      expect(detailView.toProjectDetailView(after!, "vi")).toMatchObject({ hero: null, gallery: [] });
      expect(cardView.toProjectCardData(after!, "vi")?.cover).toBeNull();
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

  describe("danh sách dự án công khai (layer-6-task-04)", () => {
    let queries: typeof import("../../src/lib/projects/project-queries");
    let view: typeof import("../../src/lib/projects/project-view");
    let otherProvinceId = "";
    let catX = "";
    let catY = "";
    let catChild = "";
    const publish = (title: string, data: Record<string, unknown> = {}) =>
      createProject({ title, status: "published", gallery: [mediaIds[0]], ...data });
    const setPublishedAt = (id: string, iso: string) =>
      withDatabase((client) => client.query(`UPDATE "projects" SET published_at = $1 WHERE id = $2`, [iso, id]));
    const titlesOf = (result: { docs: Array<{ title?: string | null }> }) => result.docs.map((doc) => doc.title);
    const allCategories = () => [catX, catY, catChild];

    beforeAll(async () => {
      queries = await import("../../src/lib/projects/project-queries");
      view = await import("../../src/lib/projects/project-view");
      otherProvinceId = (
        await payload.create({ collection: "provinces", data: { code: "98", name: "Thành phố Đà Nẵng", slug: "da-nang-list" }, overrideAccess: true })
      ).id;
      catX = (await createCategory("Loại X danh sách", "project")).id;
      catY = (await createCategory("Loại Y danh sách", "project")).id;
      catChild = (
        await payload.create({ collection: "categories", data: { name: "Loại X con", scope: "project", parent: catX } as never, locale: "vi", overrideAccess: true, depth: 0 })
      ).id;
    });

    it("lọc theo tỉnh, trạng thái mở bán, danh mục (+ con) và kết hợp; bản nháp / ẩn không lên danh sách", async () => {
      await publish("Lọc 1", { province: provinceId, salesStatus: "selling", category: catX });
      await publish("Lọc 2", { province: otherProvinceId, salesStatus: "upcoming", category: catX });
      await publish("Lọc 3", { province: provinceId, salesStatus: "handed_over", category: catY });
      await publish("Lọc 4", { province: provinceId, salesStatus: "selling", category: catChild });
      await createProject({ title: "Lọc nháp", province: provinceId, salesStatus: "selling", category: catX });
      const hidden = await publish("Lọc ẩn", { province: provinceId, salesStatus: "selling", category: catX });
      await updateProject(hidden.id, { status: "hidden" });

      const list = async (query: Partial<Parameters<typeof queries.listPublicProjects>[2]>) =>
        titlesOf(await queries.listPublicProjects(payload, "vi", { page: 1, categoryIds: allCategories(), ...query })).sort();
      expect(await list({})).toEqual(["Lọc 1", "Lọc 2", "Lọc 3", "Lọc 4"]);
      expect(await list({ provinceId: otherProvinceId })).toEqual(["Lọc 2"]);
      expect(await list({ salesStatus: "selling" })).toEqual(["Lọc 1", "Lọc 4"]);
      expect(await list({ salesStatus: "handed_over" })).toEqual(["Lọc 3"]);
      expect(await list({ provinceId, salesStatus: "upcoming" })).toEqual([]);
      expect(await list({ categoryIds: [catY] })).toEqual(["Lọc 3"]);
      expect(await list({ categoryIds: [catX] })).toEqual(["Lọc 1", "Lọc 2"]);
      expect(await list({ categoryIds: [catX, catChild] })).toEqual(["Lọc 1", "Lọc 2", "Lọc 4"]);
      expect(await list({ categoryIds: [catX, catChild], provinceId, salesStatus: "selling" })).toEqual(["Lọc 1", "Lọc 4"]);
    });

    it("/en chỉ gồm dự án đã có bản EN; mới xuất bản xếp trước", async () => {
      const category = (await createCategory("Loại EN danh sách", "project")).id;
      const first = await publish("EN một", { category });
      const second = await publish("EN hai", { category });
      await setPublishedAt(first.id, "2026-01-01T00:00:00.000Z");
      await setPublishedAt(second.id, "2026-02-01T00:00:00.000Z");
      expect(titlesOf(await queries.listPublicProjects(payload, "vi", { page: 1, categoryIds: [category] }))).toEqual(["EN hai", "EN một"]);
      expect(titlesOf(await queries.listPublicProjects(payload, "en", { page: 1, categoryIds: [category] }))).toEqual([]);
      await payload.update({
        collection: "projects",
        id: first.id,
        data: { title: "English one", summary: "S", overview: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(titlesOf(await queries.listPublicProjects(payload, "en", { page: 1, categoryIds: [category] }))).toEqual(["English one"]);
    });

    it("12 dự án/trang: trang 1 đủ 12, trang 2 phần còn lại, không trùng", async () => {
      const category = (await createCategory("Loại phân trang", "project")).id;
      for (let index = 1; index <= 13; index += 1) await publish(`Trang ${String(index).padStart(2, "0")}`, { category });
      const first = await queries.listPublicProjects(payload, "vi", { page: 1, categoryIds: [category] });
      const second = await queries.listPublicProjects(payload, "vi", { page: 2, categoryIds: [category] });
      expect(queries.PROJECT_PAGE_SIZE).toBe(12);
      expect([first.docs.length, second.docs.length, first.totalPages, first.totalDocs]).toEqual([12, 1, 2, 13]);
      expect(new Set([...titlesOf(first), ...titlesOf(second)]).size).toBe(13);
    });

    it("thẻ: ảnh đại diện = ảnh đầu thư viện, tỉnh/danh mục đã populate, link chi tiết theo ngôn ngữ; truy vấn danh mục + tỉnh", async () => {
      await publish("Thẻ dự án", { province: otherProvinceId, category: catX, priceFromVnd: 3_500_000_000, gallery: [mediaIds[1], mediaIds[0]] });
      const result = await queries.listPublicProjects(payload, "vi", { page: 1, categoryIds: [catX], provinceId: otherProvinceId, salesStatus: "selling" });
      const [card] = view.toProjectCards(result.docs, "vi");
      expect(card).toMatchObject({ title: "Thẻ dự án", href: "/du-an/the-du-an", provinceName: "Thành phố Đà Nẵng", categoryName: "Loại X danh sách", priceFrom: "3,5 tỷ", salesStatus: "selling" });
      expect(card?.cover).toMatchObject({ id: mediaIds[1] });
      const categories = await queries.listRootProjectCategories(payload, "vi");
      expect(categories.docs.map((doc) => doc.name)).toEqual(expect.arrayContaining(["Loại X danh sách", "Loại Y danh sách"]));
      expect(categories.docs.map((doc) => doc.name)).not.toContain("Loại X con");
      expect((await queries.listChildProjectCategories(payload, "vi", catX)).docs.map((doc) => doc.name)).toEqual(["Loại X con"]);
      expect((await queries.findProjectCategoryBySlug(payload, "vi", "loai-x-danh-sach"))?.id).toBe(catX);
      expect(await queries.findProjectCategoryBySlug(payload, "en", "loai-x-danh-sach")).toBeNull();
      expect((await queries.listProvinces(payload)).map((province) => province.slug)).toEqual(expect.arrayContaining(["ha-noi", "da-nang-list"]));
    });
  });

  describe("REST đọc không có ?locale (BL-021 #07)", () => {
    // Bộ lọc quan hệ trong admin gọi GET /api/projects/:id?depth=0 không kèm locale để lấy nhãn; fallback tắt (BR-07) từng khiến title = null.
    const getProject = async (id: string, query: string): Promise<Record<string, unknown>> => {
      const response = await handleEndpoints({ config: payload.config, request: new Request(`http://localhost/api/projects/${id}?depth=0${query}`, { method: "GET" }) });
      expect(response.status).toBe(200);
      return (await response.json()) as Record<string, unknown>;
    };

    it("không locale → tên VI; locale=vi/en/all giữ nguyên hành vi (fallback vẫn tắt)", async () => {
      const project = await createProject({ title: "Dự án nhãn bộ lọc", status: "published", gallery: [mediaIds[0]] });
      await updateProject(project.id, { title: "Filter Label Project" }, { locale: "en" });
      expect((await getProject(project.id, "")).title).toBe("Dự án nhãn bộ lọc");
      expect((await getProject(project.id, "&locale=vi")).title).toBe("Dự án nhãn bộ lọc");
      expect((await getProject(project.id, "&locale=en")).title).toBe("Filter Label Project");
      expect((await getProject(project.id, "&locale=all")).title).toEqual({ vi: "Dự án nhãn bộ lọc", en: "Filter Label Project" });
      // Danh sách (find) cũng đọc theo locale mặc định khi không nêu locale.
      const listResponse = await handleEndpoints({ config: payload.config, request: new Request(`http://localhost/api/projects?depth=0&where[id][equals]=${project.id}`, { method: "GET" }) });
      expect(((await listResponse.json()) as { docs: Array<{ title: unknown }> }).docs[0]?.title).toBe("Dự án nhãn bộ lọc");
    });
  });

  describe("seed", () => {
    const countMedia = async () =>
      (await payload.find({ collection: "media", where: { alt: { contains: "Ảnh minh hoạ" } }, locale: "vi", limit: 0, pagination: false, overrideAccess: true })).totalDocs;
    const seedProvinces = [
      { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" },
      { code: "48", name: "Thành phố Đà Nẵng", slug: "da-nang" },
      { code: "31", name: "Thành phố Hải Phòng", slug: "hai-phong" },
    ];

    it("seedSampleProjects: thiếu tỉnh báo lỗi rõ và không để lại ảnh/danh mục mồ côi", async () => {
      await expect(seedSampleProjects(payload)).rejects.toThrow(/pnpm seed/);
      expect(await countMedia()).toBe(0);
    });

    it("dự án mẫu: published + có ảnh; chạy 2 lần không nhân đôi dự án lẫn ảnh (media)", async () => {
      for (const province of seedProvinces) await payload.create({ collection: "provinces", data: province, overrideAccess: true });
      expect(await seedSampleProjects(payload)).toEqual({ created: 6, skipped: 0 });
      expect(await countMedia()).toBe(6);
      expect(await seedSampleProjects(payload)).toEqual({ created: 0, skipped: 6 });
      expect(await countMedia()).toBe(6);

      const seeded = await payload.find({
        collection: "projects",
        where: { title: { equals: "Dự án mẫu Khu đô thị Tây Hồ" } },
        locale: "vi",
        depth: 1,
        overrideAccess: true,
      });
      const doc = seeded.docs[0];
      expect(doc?.status).toBe("published");
      expect(doc?.salesStatus).toBe("upcoming");
      expect(doc?.location).toEqual([105.8194, 21.0586]);
      expect(doc?.gallery).toHaveLength(1);
      expect(doc?.gallery?.[0]).toMatchObject({ mimeType: "image/webp" });
      const published = await payload.find({ collection: "projects", where: { status: { equals: "published" } }, limit: 0, pagination: false, overrideAccess: true });
      expect(published.docs.filter((project) => String(project.title).startsWith("Dự án mẫu"))).toHaveLength(6);
    });

    it("sample có đủ 3 loại hình, 3 trạng thái mở bán; có dự án có EN và dự án không có (để thử bộ lọc và /en)", async () => {
      const { SAMPLE_PROJECTS } = await import("../../seed/sample/projects");
      expect(new Set(SAMPLE_PROJECTS.map((project) => project.category.vi)).size).toBe(3);
      expect(new Set(SAMPLE_PROJECTS.map((project) => project.salesStatus))).toEqual(new Set(["upcoming", "selling", "handed_over"]));
      expect(SAMPLE_PROJECTS.filter((project) => project.english)).toHaveLength(3);
      const english = await publicQueries.findPublicList<{ title: string }>(payload, "projects", "en", { where: { title: { like: "Sample" } } });
      expect(english.docs).toHaveLength(3);
    });

    it("bản nháp không ảnh từ seed cũ được bổ sung ảnh + xuất bản, không tạo bản trùng", async () => {
      const legacyTitle = "Dự án mẫu Căn hộ Sông Sài Gòn";
      const found = await payload.find({ collection: "projects", where: { title: { equals: legacyTitle } }, locale: "vi", depth: 0, overrideAccess: true });
      const legacy = found.docs[0]!;
      // Đưa về dạng của seed cũ: nháp, không ảnh (Payload chỉ chặn bản xuất bản thiếu ảnh, nháp thì được).
      await payload.update({ collection: "projects", id: legacy.id, data: { status: "draft", gallery: [] } as never, locale: "vi", overrideAccess: true });
      expect(await seedSampleProjects(payload)).toEqual({ created: 0, skipped: 6 });
      const healed = await payload.findByID({ collection: "projects", id: legacy.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(healed.status).toBe("published");
      expect(healed.gallery).toHaveLength(1);
      expect(await countMedia()).toBe(6);
    });
  });
});
