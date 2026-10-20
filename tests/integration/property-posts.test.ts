import type { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedSamplePropertyPosts } from "../../seed/sample/property-posts";
import { ROLES } from "../../src/access/roles";
import { findLayoutField } from "../../src/lib/admin/form-layout";
import { isOfferEnded, offerNotEndedWhere } from "../../src/lib/content/offer-status";

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

/** Ô chọn ngày `dayOnly` của admin ghim 12:00 UTC của ngày được chọn. */
const pickerDate = (ymd: string) => `${ymd}T12:00:00.000Z`;

describe("migration property_posts (SQL tuỳ biến, ERD §5)", () => {
  const sqlText = readFileSync(new URL("../../migrations/20261018_075627_property_posts.ts", import.meta.url), "utf8");

  it("tạo hai index tổng hợp theo ERD §5 với tên có tiền tố bảng, và đăng ký task expire-offers trong enum jobs", () => {
    expect(sqlText).toContain(`"property_posts_list_idx" ON "property_posts" USING btree ("status", "has_english", "category_id", "published_at" DESC)`);
    expect(sqlText).toContain(`"property_posts_featured_offer_idx" ON "property_posts" USING btree ("status", "is_featured", "offer_end_at")`);
    expect(sqlText).toContain(`UNIQUE INDEX "property_posts_slug_idx" ON "property_posts_locales" USING btree ("slug","_locale")`);
    expect(sqlText).toContain(`ADD VALUE 'expire-offers'`);
  });
});

describe.skipIf(!baseUrl)("integration: property-posts (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_property_posts_${runId}`;
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
  let expireOffers: typeof import("../../src/jobs/expire-offers").expireOffers;
  let createLocalReq: typeof import("payload").createLocalReq;

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

  const createPost = (data: Record<string, unknown>, { as = sale, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "property-posts",
      data: { excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, ...data } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updatePost = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi", trash = false }: Options = {}) =>
    payload.update({ collection: "property-posts", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0, trash });

  const deletePost = (id: string, as: Actor) =>
    payload.delete({ collection: "property-posts", id, user: asUser(as), overrideAccess: false, trash: true });

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
    // `projects.location` là geometry(Point) và mã tin cho thuê lấy từ sequence: DB mới tạo bằng `push` chưa có (migration tạo ở DB thật).
    await withDatabase((client) => client.query(`CREATE EXTENSION IF NOT EXISTS postgis`));
    const payloadModule = await import("payload");
    createLocalReq = payloadModule.createLocalReq;
    const { buildPropertyPostsTestConfig } = await import("../fixtures/property-posts/payload-config");
    payload = await payloadModule.getPayload({ config: buildPropertyPostsTestConfig(testUrl, (paths) => void revalidatedPaths.push(paths)) });
    await withDatabase((client) => client.query(`CREATE SEQUENCE IF NOT EXISTS rentals_code_seq START 1`));
    publicQueries = await import("../../src/lib/content/public-queries");
    ({ expireOffers } = await import("../../src/jobs/expire-offers"));
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("othersale", ROLES.sale);
    categoryId = (await createCategory("Tin BĐS", "property_post")).id;
    provinceId = (
      await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })
    ).id;
    otherProvinceId = (
      await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })
    ).id;
    wardId = (
      await payload.create({
        collection: "wards",
        data: { province: provinceId, code: "70101063", name: "Phường Sài Gòn", type: "phuong", slug: "sai-gon" },
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
    it("đủ trường ERD §4.7 + group offer, bật xoá mềm", () => {
      const config = payload.collections["property-posts"]!.config;
      const names = config.flattenedFields.map((field) => field.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "title", "slug", "category", "cover", "gallery", "excerpt", "content", "priceVnd", "priceNote", "province", "ward",
          "relatedProject", "relatedRental", "offer", "isFeatured", "status", "publishedAt", "author", "seo", "hasEnglish", "translation",
        ]),
      );
      const offer = findLayoutField(config.fields, "offer");
      expect(offer && "fields" in offer ? offer.fields.map((field) => "name" in field && field.name) : []).toEqual([
        "startAt", "endAt", "voucherCode", "terms",
      ]);
      expect(config.trash).toBe(true);
    });

    it("DB tạm có UNIQUE (slug, _locale), index lọc cơ bản và index offer_end_at", async () => {
      const locales = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'property_posts_locales'`));
      expect(locales.rows.some((row) => String(row.indexdef).includes("UNIQUE") && String(row.indexdef).includes("(slug, _locale)"))).toBe(true);
      const main = await withDatabase((client) => client.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'property_posts'`));
      expect(main.rows.map((row) => String(row.indexname))).toEqual(
        expect.arrayContaining([
          "property_posts_status_idx",
          "property_posts_category_idx",
          "property_posts_province_idx",
          "property_posts_is_featured_idx",
          "property_posts_offer_offer_end_at_idx",
          "property_posts_published_at_idx",
        ]),
      );
    });

    it("lưu và đọc lại đủ nhóm trường: tuỳ chọn giá/khu vực/dự án/tin cho thuê và offer", async () => {
      const project = await payload.create({
        collection: "projects",
        data: {
          title: "Dự án liên quan",
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
      const rental = await payload.create({
        collection: "rentals",
        data: {
          title: "Tin cho thuê liên quan",
          description: lexical("d"),
          category: (await createCategory("Căn hộ", "rental")).id,
          province: provinceId,
          ward: wardId,
          address: "a",
          priceMonthlyVnd: 1,
          areaM2: 1,
          author: admin.id,
        } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      const doc = await createPost({
        title: "Đủ trường",
        gallery: imageIds,
        priceVnd: 2_100_000_000,
        priceNote: "Chỉ từ 2,1 tỷ",
        province: provinceId,
        ward: wardId,
        relatedProject: project.id,
        relatedRental: rental.id,
        offer: { startAt: pickerDate("2026-10-01"), endAt: pickerDate("2026-10-31"), voucherCode: "TAMI10", terms: "Áp dụng 1 lần" },
      });
      const stored = await payload.findByID({ collection: "property-posts", id: doc.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(stored).toMatchObject({ priceVnd: 2_100_000_000, priceNote: "Chỉ từ 2,1 tỷ", province: provinceId, ward: wardId, status: "draft" });
      expect(stored.relatedProject).toBe(project.id);
      expect(stored.relatedRental).toBe(rental.id);
      expect(stored.gallery).toEqual(imageIds);
      expect(stored.offer).toMatchObject({ voucherCode: "TAMI10", terms: "Áp dụng 1 lần" });
      expect(stored.offer?.endAt).toBe(pickerDate("2026-10-31"));
    });

    it("tất cả trường tuỳ chọn được bỏ trống; priceVnd âm và ngày kết thúc trước ngày bắt đầu → 400", async () => {
      const bare = await createPost({ title: "Tối giản" });
      expect(bare.priceVnd ?? null).toBeNull();
      expect(await statusOf(createPost({ title: "Giá âm", priceVnd: -1 }))).toBe(400);
      expect(
        await statusOf(createPost({ title: "Ngày ngược", offer: { startAt: pickerDate("2026-10-20"), endAt: pickerDate("2026-10-10") } })),
      ).toBe(400);
      const ok = await createPost({ title: "Cùng ngày", offer: { startAt: pickerDate("2026-10-20"), endAt: pickerDate("2026-10-20") } });
      expect(await statusOf(updatePost(ok.id, { offer: { endAt: pickerDate("2026-10-01") } }))).toBe(400);
    });
  });

  describe("ảnh bìa", () => {
    it("published thiếu cover → 400; nháp được thiếu; có cover xuất bản được; sửa một phần không mất cover; không gỡ cover khi đang xuất bản", async () => {
      expect(await statusOf(createPost({ title: "Thiếu bìa", status: "published" }))).toBe(400);
      expect((await createPost({ title: "Nháp thiếu bìa" })).status).toBe("draft");
      const published = await createPost({ title: "Có bìa", status: "published", cover: imageIds[0] });
      expect(published.status).toBe("published");
      expect((await updatePost(published.id, { priceNote: "Sửa một phần" })).priceNote).toBe("Sửa một phần");
      expect(await statusOf(updatePost(published.id, { cover: null }))).toBe(400);
      const draft = await createPost({ title: "Nháp rồi xuất bản" });
      expect(await statusOf(updatePost(draft.id, { status: "published" }))).toBe(400);
      expect((await updatePost(draft.id, { status: "published", cover: imageIds[1] })).status).toBe("published");
    });

    it("cover và gallery chỉ nhận ảnh: PDF bị validator upload mặc định chặn dù có validate tuỳ biến", async () => {
      expect(await statusOf(createPost({ title: "Bìa PDF", cover: pdfId }))).toBe(400);
      expect(await statusOf(createPost({ title: "Gallery PDF", gallery: [pdfId] }))).toBe(400);
      expect(await statusOf(createPost({ title: "Bìa id lạ", cover: "00000000-0000-4000-8000-000000000000" }))).toBe(400);
    });
  });

  describe("ward thuộc province (G22)", () => {
    it("phường của tỉnh khác → 400; phường mà không có tỉnh → 400; sửa riêng một đầu làm lệch → 400; khớp thì được", async () => {
      expect(await statusOf(createPost({ title: "Phường lệch tỉnh", province: provinceId, ward: otherProvinceWardId }))).toBe(400);
      expect(await statusOf(createPost({ title: "Phường không tỉnh", ward: wardId }))).toBe(400);
      const doc = await createPost({ title: "Phường khớp tỉnh", province: provinceId, ward: wardId });
      expect(await statusOf(updatePost(doc.id, { province: otherProvinceId }))).toBe(400);
      expect(await statusOf(updatePost(doc.id, { ward: otherProvinceWardId }))).toBe(400);
      expect(await statusOf(updatePost(doc.id, { province: null }))).toBe(400);
      const moved = await updatePost(doc.id, { province: otherProvinceId, ward: otherProvinceWardId });
      expect(moved.ward).toBe(otherProvinceWardId);
      const cleared = await updatePost(doc.id, { province: null, ward: null });
      expect(cleared.province ?? null).toBeNull();
    });

    it("lọc ô chọn phường theo tỉnh đã chọn", () => {
      const ward = payload.collections["property-posts"]!.config.flattenedFields.find((field) => field.name === "ward");
      const filter = (ward as { filterOptions?: (args: { siblingData: unknown }) => unknown }).filterOptions!;
      expect(filter({ siblingData: { province: provinceId } })).toEqual({ province: { equals: provinceId } });
      expect(filter({ siblingData: {} })).toBe(true);
    });

    it("không xoá được tỉnh/phường đang có bài (409, kể cả bài xoá mềm); hết bài thì xoá được", async () => {
      const province = await payload.create({ collection: "provinces", data: { code: "88", name: "Tỉnh Tạm", slug: "tinh-tam" }, overrideAccess: true });
      const ward = await payload.create({
        collection: "wards",
        data: { province: province.id, code: "88001", name: "Phường Tạm", type: "phuong", slug: "tam" },
        overrideAccess: true,
      });
      const doc = await createPost({ title: "Giữ khu vực", province: province.id, ward: ward.id });
      const removeWard = () => payload.delete({ collection: "wards", id: ward.id, user: asUser(admin), overrideAccess: false });
      const removeProvince = () => payload.delete({ collection: "provinces", id: province.id, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(removeWard())).toBe(409);
      expect(await statusOf(removeProvince())).toBe(409);
      await updatePost(doc.id, { deletedAt: NOW() });
      expect(await statusOf(removeWard())).toBe(409);
      await deletePost(doc.id, admin);
      await removeWard();
      await removeProvince();
    });
  });

  describe("quyền (PERMISSION §3.1)", () => {
    it("sale tạo bài của mình (author tự gán); sale sửa / xoá bài của sale khác → 403", async () => {
      const mine = await createPost({ title: "Bài của sale" });
      expect(String(typeof mine.author === "object" ? mine.author.id : mine.author)).toBe(sale.id);
      expect((await updatePost(mine.id, { priceNote: "Sửa của mình" }, { as: sale })).priceNote).toBe("Sửa của mình");
      expect(await statusOf(updatePost(mine.id, { priceNote: "Phá" }, { as: otherSale }))).toBe(403);
      expect(await statusOf(updatePost(mine.id, { deletedAt: NOW() }, { as: otherSale }))).toBe(403);
      expect(await statusOf(deletePost(mine.id, otherSale))).toBe(403);
    });

    it("sale xoá mềm bài của mình nhưng không xoá hẳn và không khôi phục; admin khôi phục và xoá hẳn", async () => {
      const mine = await createPost({ title: "Xoá mềm" });
      await updatePost(mine.id, { deletedAt: NOW() }, { as: sale });
      expect(await statusOf(deletePost(mine.id, sale))).toBe(403);
      expect(await statusOf(updatePost(mine.id, { deletedAt: null }, { as: sale, trash: true }))).toBe(403);
      const restored = await updatePost(mine.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      await deletePost(mine.id, admin);
      const gone = await payload.find({ collection: "property-posts", where: { id: { equals: mine.id } }, trash: true, overrideAccess: true });
      expect(gone.docs).toHaveLength(0);
    });

    it("admin sửa bài của sale; khách không tạo được", async () => {
      const mine = await createPost({ title: "Admin sửa" });
      expect((await updatePost(mine.id, { priceNote: "Admin đã sửa" })).priceNote).toBe("Admin đã sửa");
      const guestCreate = payload.create({
        collection: "property-posts",
        data: { title: "Khách", excerpt: "x", content: lexical("x"), category: categoryId } as never,
        overrideAccess: false,
      });
      expect(await statusOf(guestCreate)).toBe(403);
    });
  });

  describe("category thuộc scope property_post", () => {
    it("danh mục sai scope → 400; không xoá được danh mục đang có bài (xoá hẳn và xoá mềm → 409)", async () => {
      const wrong = await createCategory("Tin tức X", "news");
      expect(await statusOf(createPost({ title: "Sai scope", category: wrong.id }))).toBe(400);
      expect(await statusOf(createPost({ title: "Thiếu danh mục", category: null }))).toBe(400);
      const category = await createCategory("Có bài đăng tin", "property_post");
      const doc = await createPost({ title: "Giữ danh mục", category: category.id });
      const hardDelete = () => payload.delete({ collection: "categories", id: category.id, user: asUser(admin), overrideAccess: false, trash: true });
      const softDelete = () =>
        payload.update({ collection: "categories", id: category.id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(hardDelete())).toBe(409);
      expect(await statusOf(softDelete())).toBe(409);
      await deletePost(doc.id, admin);
      await hardDelete();
    });
  });

  describe("slug + truy vấn công khai + làm mới cache", () => {
    it("slug sinh từ tiêu đề, trùng thì thêm hậu tố", async () => {
      expect((await createPost({ title: "Khuyến Mãi Mùa Thu" })).slug).toBe("khuyen-mai-mua-thu");
      expect((await createPost({ title: "Khuyến Mãi Mùa Thu" })).slug).toBe("khuyen-mai-mua-thu-2");
    });

    it("PublicCollectionSlug nhận property-posts: khách chỉ thấy published, không thấy draft / hidden / xoá mềm; en cần hasEnglish", async () => {
      const live = await createPost({ title: "Tin công khai", status: "published", cover: imageIds[0] });
      await createPost({ title: "Tin nháp" });
      const hidden = await createPost({ title: "Tin ẩn", status: "published", cover: imageIds[0] });
      await updatePost(hidden.id, { status: "hidden" });
      const gone = await createPost({ title: "Tin xoá", status: "published", cover: imageIds[0] });
      await updatePost(gone.id, { deletedAt: NOW() });

      const titles = (await publicQueries.findPublicList<{ title: string }>(payload, "property-posts", "vi", { limit: 100 })).docs.map((doc) => doc.title);
      expect(titles).toContain("Tin công khai");
      for (const unseen of ["Tin nháp", "Tin ẩn", "Tin xoá"]) expect(titles).not.toContain(unseen);

      expect(await publicQueries.findPublicBySlug(payload, "property-posts", "vi", "tin-cong-khai")).not.toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "property-posts", "en", "tin-cong-khai")).toBeNull();
      await payload.update({
        collection: "property-posts",
        id: live.id,
        data: { title: "Public post", excerpt: "en", content: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await publicQueries.findPublicBySlug(payload, "property-posts", "en", "public-post")).not.toBeNull();
    });

    it("xuất bản làm mới /tin-bds/[slug] + /tin-bds của vi và en (+ trang chủ nếu nổi bật); nháp thì không", async () => {
      const doc = await createPost({ title: "Làm mới tin đăng" });
      expect(revalidatedPaths).toEqual([]);
      await updatePost(doc.id, { status: "published", cover: imageIds[0] });
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi/tin-bds/lam-moi-tin-dang", "/vi/tin-bds", "/en/tin-bds"]));
      expect(revalidatedPaths.flat()).not.toContain("/vi");
      revalidatedPaths.length = 0;
      await updatePost(doc.id, { isFeatured: true });
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi", "/en"]));
    });
  });

  describe("ưu đãi: isOfferEnded là nguồn duy nhất (BR-06)", () => {
    it("truy vấn 'chưa kết thúc' trả đúng tập mà isOfferEnded cho là chưa kết thúc, ở các mốc biên giờ VN", async () => {
      const specs = [
        { title: "Offer không hạn", offer: undefined },
        { title: "Offer hạn 15", offer: { endAt: pickerDate("2026-10-15") } },
        { title: "Offer hạn 16", offer: { endAt: pickerDate("2026-10-16") } },
        { title: "Offer hạn 17", offer: { endAt: pickerDate("2026-10-17") } },
        { title: "Offer hạn 18", offer: { endAt: pickerDate("2026-10-18") } },
        { title: "Offer hạn nửa đêm VN 17", offer: { endAt: "2026-10-16T17:00:00.000Z" } },
      ];
      const created = new Map<string, { id: string; offer?: { endAt?: string | null } | null }>();
      for (const { title, offer } of specs) {
        const doc = await createPost({ title, offer, status: "published", cover: imageIds[0] });
        created.set(doc.id, { id: doc.id, offer: offer ?? null });
      }
      for (const nowIso of ["2026-10-17T16:59:59.999Z", "2026-10-17T17:00:00.000Z", "2026-10-18T03:00:00.000Z", "2026-10-18T17:00:00.000Z"]) {
        const now = new Date(nowIso);
        const found = await payload.find({
          collection: "property-posts",
          where: { and: [{ id: { in: [...created.keys()] } }, offerNotEndedWhere(now)] },
          depth: 0,
          limit: 100,
          pagination: false,
          overrideAccess: true,
        });
        const expected = [...created.values()].filter((post) => !isOfferEnded(post, now)).map((post) => post.id).sort();
        expect(found.docs.map((doc) => doc.id).sort(), nowIso).toEqual(expected);
      }
    });
  });

  describe("job expire-offers", () => {
    // 00:05 VN ngày 11/03/2027 = 17:05 UTC ngày 10/03 (ngày riêng để không lẫn với bài của các test khác dùng chung DB).
    const jobNow = new Date("2027-03-10T17:05:00.000Z");

    async function runJob(now = jobNow) {
      const recorded: string[][] = [];
      const req = await createLocalReq({}, payload);
      const outcome = await expireOffers({ req, now, revalidate: (paths) => void recorded.push(paths) });
      return { outcome, paths: recorded.flat() };
    }

    it("chỉ làm mới bài published có ưu đãi hết hạn ĐÚNG ngày hôm qua giờ VN: chi tiết vi + en, danh sách, trang chủ; chạy lại idempotent", async () => {
      const ended = await createPost({ title: "Job vừa hết hạn", status: "published", cover: imageIds[0], offer: { endAt: pickerDate("2027-03-10") } });
      await payload.update({
        collection: "property-posts",
        id: ended.id,
        data: { title: "Job just ended", excerpt: "en", content: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const stillRunning = await createPost({ title: "Job còn hạn", status: "published", cover: imageIds[0], offer: { endAt: pickerDate("2027-03-11") } });
      await createPost({ title: "Job hết hạn từ trước", status: "published", cover: imageIds[0], offer: { endAt: pickerDate("2027-03-08") } });
      await createPost({ title: "Job không ưu đãi", status: "published", cover: imageIds[0] });
      await createPost({ title: "Job nháp hết hạn", offer: { endAt: pickerDate("2027-03-10") } });
      const trashed = await createPost({ title: "Job xoá mềm", status: "published", cover: imageIds[0], offer: { endAt: pickerDate("2027-03-10") } });
      await updatePost(trashed.id, { deletedAt: NOW() });

      const first = await runJob();
      expect(first.outcome).toEqual({ expired: 1 });
      expect(first.paths.sort()).toEqual(
        ["/en", "/en/tin-bds", "/en/tin-bds/job-just-ended", "/vi", "/vi/tin-bds", "/vi/tin-bds/job-vua-het-han"].sort(),
      );
      expect(first.paths.join()).not.toContain(String(stillRunning.slug));
      const second = await runJob();
      expect({ ...second, paths: [...second.paths].sort() }).toEqual(first);
    });

    it("không có bài nào vừa hết hạn → không gọi revalidate; job không đổi bản ghi nào", async () => {
      const before = await payload.count({ collection: "property-posts", overrideAccess: true, trash: true });
      const quiet = await runJob(new Date("2031-05-05T17:05:00.000Z"));
      expect(quiet).toEqual({ outcome: { expired: 0 }, paths: [] });
      expect((await payload.count({ collection: "property-posts", overrideAccess: true, trash: true })).totalDocs).toBe(before.totalDocs);
    });

    it("lỗi revalidate (app không với tới) được ném ra để Payload Jobs thử lại", async () => {
      await createPost({ title: "Job lỗi revalidate", status: "published", cover: imageIds[0], offer: { endAt: pickerDate("2026-11-01") } });
      const req = await createLocalReq({}, payload);
      await expect(
        expireOffers({
          req,
          now: new Date("2026-11-01T17:05:00.000Z"),
          revalidate: () => {
            throw new Error("app down");
          },
        }),
      ).rejects.toThrow("app down");
    });
  });

  describe("truy vấn trang công khai Đăng tin BĐS (S08/S09)", () => {
    // Ngày riêng (tương lai xa) để tách khỏi bài của các test khác dùng chung DB; "bây giờ" cố định 10:00 VN 15/06/2031.
    const now = new Date("2031-06-15T03:00:00.000Z");
    let listCategoryId = "";
    const ids: Record<string, string> = {};

    it("listPublicPosts: bài còn hạn / không hạn trước, bài đã kết thúc sau; phân trang nối hai nhóm; lọc danh mục; loại id nổi bật", async () => {
      const { listPublicPosts, findFeaturedPost } = await import("../../src/lib/posts/post-queries");
      listCategoryId = (await createCategory("Danh mục truy vấn", "property_post")).id;
      const make = async (key: string, offer?: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
        const doc = await createPost({ title: `Truy vấn ${key}`, status: "published", cover: imageIds[0], category: listCategoryId, ...(offer ? { offer } : {}), ...extra });
        ids[key] = doc.id;
      };
      await make("ended-old", { endAt: pickerDate("2031-06-01") });
      await make("ended-yesterday", { endAt: pickerDate("2031-06-14") });
      await make("active-today", { endAt: pickerDate("2031-06-15") });
      await make("active-none");
      await make("active-future", { endAt: pickerDate("2031-07-01") });
      await updatePost(ids["active-future"]!, { isFeatured: true });
      await updatePost(ids["ended-old"]!, { isFeatured: true });

      // Hai nhóm nối nhau theo trang: trang 1 = 3 bài còn hạn / không hạn, trang 2 = 2 bài đã kết thúc.
      const first = await listPublicPosts(payload, "vi", { page: 1, now, categoryIds: [listCategoryId] });
      expect(first.docs.map((doc) => doc.id).sort()).toEqual(["active-today", "active-none", "active-future"].map((key) => ids[key]!).sort());
      expect(first).toMatchObject({ totalPages: 2, isEmpty: false });
      const second = await listPublicPosts(payload, "vi", { page: 2, now, categoryIds: [listCategoryId] });
      expect(second.docs.map((doc) => doc.id).sort()).toEqual(["ended-old", "ended-yesterday"].map((key) => ids[key]!).sort());
      expect((await listPublicPosts(payload, "vi", { page: 3, now, categoryIds: [listCategoryId] })).docs).toEqual([]);

      // Hạn là NGÀY: ưu đãi hết hạn hôm nay (15/06) vẫn còn hiệu lực hết ngày; sang 00:00 ngày 16 giờ VN thì đã kết thúc.
      const tomorrow = new Date("2031-06-15T17:00:00.000Z");
      const after = await listPublicPosts(payload, "vi", { page: 1, now: tomorrow, categoryIds: [listCategoryId] });
      expect(after.docs.map((doc) => doc.id)).not.toContain(ids["active-today"]);
      expect(after.docs).toHaveLength(2);

      const excluded = await listPublicPosts(payload, "vi", { page: 1, now, categoryIds: [listCategoryId], excludeIds: [ids["active-none"]!] });
      expect(excluded.docs.map((doc) => doc.id)).not.toContain(ids["active-none"]);
      expect((await listPublicPosts(payload, "vi", { page: 1, now, categoryIds: [categoryId], excludeIds: [] })).docs.map((doc) => doc.id)).not.toContain(ids["active-none"]);

      // Nổi bật = isFeatured còn hạn mới nhất: bài isFeatured đã kết thúc không được chọn.
      const featured = await findFeaturedPost(payload, "vi", now);
      expect(featured?.id).toBe(ids["active-future"]);
      // Trang danh mục dùng cùng quy tắc, chỉ xét bài trong danh mục: danh mục khác (trống) không có bài nổi bật.
      expect((await findFeaturedPost(payload, "vi", now, [listCategoryId]))?.id).toBe(ids["active-future"]);
      const otherCategory = await createCategory("Danh mục không nổi bật", "property_post");
      expect(await findFeaturedPost(payload, "vi", now, [otherCategory.id])).toBeNull();
    });

    it("/en chỉ gồm bài có bản EN; bài nháp không bao giờ xuất hiện", async () => {
      const { listPublicPosts } = await import("../../src/lib/posts/post-queries");
      const draft = await createPost({ title: "Truy vấn nháp", status: "draft", category: listCategoryId });
      const vi = await listPublicPosts(payload, "vi", { page: 1, now, categoryIds: [listCategoryId] });
      expect(vi.docs.map((doc) => doc.id)).not.toContain(draft.id);
      const en = await listPublicPosts(payload, "en", { page: 1, now, categoryIds: [listCategoryId] });
      expect(en.docs).toEqual([]);
    });

    it("findPublicPostBySlug + findRelatedTargets: chỉ trả dự án / tin cho thuê công khai (nháp thì không)", async () => {
      const { findPublicPostBySlug, findRelatedTargets } = await import("../../src/lib/posts/post-queries");
      const found = await findPublicPostBySlug(payload, "vi", "truy-van-active-none");
      expect(found?.id).toBe(ids["active-none"]);
      expect(await findPublicPostBySlug(payload, "vi", "truy-van-nhap")).toBeNull();
      expect(await findPublicPostBySlug(payload, "en", "truy-van-active-none")).toBeNull();
      expect(await findRelatedTargets(payload, "vi", {})).toEqual({ project: null, rental: null });
    });
  });

  describe("seed", () => {
    it("seedSamplePropertyPosts: thiếu danh mục mẫu báo lỗi rõ; chạy 2 lần không nhân đôi; bài là bản nháp đúng danh mục", async () => {
      await expect(seedSamplePropertyPosts(payload)).rejects.toThrow(/pnpm seed/);
      await createCategory("Voucher / Ưu đãi", "property_post");
      // "Tin BĐS" đã được tạo ở beforeAll (slug tin-bds).
      expect(await seedSamplePropertyPosts(payload)).toEqual({ created: 2, skipped: 0 });
      expect(await seedSamplePropertyPosts(payload)).toEqual({ created: 0, skipped: 2 });
      const seeded = await payload.find({
        collection: "property-posts",
        where: { title: { equals: "Voucher tri ân khách thuê căn hộ" } },
        locale: "vi",
        depth: 1,
        overrideAccess: true,
      });
      expect(seeded.docs[0]?.status).toBe("draft");
      expect(seeded.docs[0]?.offer?.voucherCode).toBe("TAMI-TRI-AN");
      const category = seeded.docs[0]?.category;
      expect(category && typeof category === "object" ? category.slug : null).toBe("voucher-uu-dai");
    });
  });
});
