import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedSampleJobPostings } from "../../seed/sample/job-postings";
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
const IN_30_DAYS = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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

describe.skipIf(!baseUrl)("integration: job-postings + job-applications (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_jobs_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const revalidatedPaths: string[][] = [];
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;
  let categoryId = "";
  let provinceId = "";
  let cvId = "";
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

  const createJob = (data: Record<string, unknown>, { as = sale, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "job-postings",
      data: {
        description: lexical("Mô tả"),
        requirements: lexical("Yêu cầu"),
        category: categoryId,
        employmentType: "full_time",
        deadline: IN_30_DAYS(),
        ...data,
      } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updateJob = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi", trash = false }: Options = {}) =>
    payload.update({ collection: "job-postings", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0, trash });

  const deleteJob = (id: string, as: Actor) =>
    payload.delete({ collection: "job-postings", id, user: asUser(as), overrideAccess: false, trash: true });

  /** Hồ sơ như endpoint công khai tạo: Local API `overrideAccess: true` (REST/khách không có quyền tạo). */
  const submitApplication = (jobPosting: string, data: Record<string, unknown> = {}) =>
    payload.create({
      collection: "job-applications",
      data: {
        jobPosting,
        fullName: "Nguyễn Văn A",
        phone: "0901234567",
        email: "ungvien@example.test",
        cv: cvId,
        message: "Xin chào",
        consentAt: NOW(),
        consentVersion: "2026-10",
        locale: "vi",
        ipHash: "hash-ip",
        ...data,
      } as never,
      overrideAccess: true,
      depth: 0,
    });

  const updateApplication = (id: string, data: Record<string, unknown>, as: Actor) =>
    payload.update({ collection: "job-applications", id, data: data as never, user: asUser(as), overrideAccess: false, depth: 0 });

  /** CV riêng cho mỗi hồ sơ cần xoá: xoá hồ sơ sẽ xoá luôn CV nên không dùng chung `cvId`. */
  async function insertCv(): Promise<string> {
    const inserted = await withDatabase((client) => client.query(`INSERT INTO "private_files" (mime_type) VALUES ('application/pdf') RETURNING id`));
    return inserted.rows[0].id as string;
  }

  const countRows = (table: string, id: string) =>
    withDatabase(async (client) => (await client.query(`SELECT count(*)::int AS n FROM "${table}" WHERE id = $1`, [id])).rows[0].n as number);

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
    const { getPayload } = await import("payload");
    const { buildJobPostingsTestConfig } = await import("../fixtures/job-postings/payload-config");
    payload = await getPayload({ config: buildJobPostingsTestConfig(testUrl, (paths) => void revalidatedPaths.push(paths)) });
    publicQueries = await import("../../src/lib/content/public-queries");
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("othersale", ROLES.sale);
    categoryId = (await createCategory("Kinh doanh", "job")).id;
    provinceId = (
      await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })
    ).id;
    // Trường upload chỉ cần một `private-files` tồn tại: chèn thẳng một dòng để khỏi ghi file lên S3.
    const inserted = await withDatabase((client) => client.query(`INSERT INTO "private_files" (mime_type) VALUES ('application/pdf') RETURNING id`));
    cvId = inserted.rows[0].id as string;
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

  describe("job-postings: cấu hình + schema", () => {
    it("đủ trường ERD §4.10, không có isFeatured", () => {
      const config = payload.collections["job-postings"]!.config;
      const names = config.flattenedFields.map((field) => field.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "title", "slug", "category", "province", "workplace", "employmentType", "salaryMinVnd", "salaryMaxVnd", "salaryText",
          "quantity", "deadline", "description", "requirements", "benefits", "status", "publishedAt", "author", "hasEnglish",
          "translation", "seo", "isUrgent",
        ]),
      );
      expect(config.flattenedFields.find((field) => field.name === "isUrgent")).toMatchObject({ type: "checkbox", defaultValue: false, label: "Tuyển gấp" });
      expect(names).not.toContain("isFeatured");
      expect(config.trash).toBe(true);
    });

    it("DB tạm có UNIQUE (slug, _locale) và index deadline + status + has_english", async () => {
      const locales = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'job_postings_locales'`));
      expect(locales.rows.some((row) => String(row.indexdef).includes("UNIQUE") && String(row.indexdef).includes("(slug, _locale)"))).toBe(true);
      const main = await withDatabase((client) => client.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'job_postings'`));
      expect(main.rows.map((row) => String(row.indexname))).toEqual(
        expect.arrayContaining(["job_postings_deadline_idx", "job_postings_status_idx", "job_postings_has_english_idx"]),
      );
    });

    it("lưu và đọc lại đủ nhóm trường", async () => {
      const doc = await createJob({
        title: "Tư vấn BĐS",
        province: provinceId,
        workplace: "1 Phố Test",
        salaryMinVnd: 15_000_000,
        salaryMaxVnd: 30_000_000,
        salaryText: "15–30 triệu + hoa hồng",
        quantity: 3,
        benefits: lexical("Thưởng"),
      });
      const stored = await payload.findByID({ collection: "job-postings", id: doc.id, locale: "vi", depth: 0, overrideAccess: true });
      expect(stored).toMatchObject({
        employmentType: "full_time",
        workplace: "1 Phố Test",
        salaryMinVnd: 15_000_000,
        salaryMaxVnd: 30_000_000,
        salaryText: "15–30 triệu + hoa hồng",
        quantity: 3,
        status: "draft",
      });
      expect(stored.province).toBe(provinceId);
      expect(Number.isNaN(Date.parse(stored.deadline))).toBe(false);
      expect(stored.isUrgent).toBe(false);
      const urgent = await createJob({ title: "Tuyển gấp", isUrgent: true });
      expect((await payload.findByID({ collection: "job-postings", id: urgent.id, depth: 0, overrideAccess: true })).isUrgent).toBe(true);
    });

    it("deadline, employmentType, mô tả, yêu cầu bắt buộc; số âm / khoảng lương ngược / số lượng 0 / loại hình lạ → 400", async () => {
      expect(await statusOf(createJob({ title: "Thiếu hạn", deadline: null }))).toBe(400);
      expect(await statusOf(createJob({ title: "Thiếu loại hình", employmentType: null }))).toBe(400);
      expect(await statusOf(createJob({ title: "Loại hình lạ", employmentType: "xyz" }))).toBe(400);
      expect(await statusOf(createJob({ title: "Thiếu mô tả", description: null }))).toBe(400);
      expect(await statusOf(createJob({ title: "Thiếu yêu cầu", requirements: null }))).toBe(400);
      expect(await statusOf(createJob({ title: "Lương âm", salaryMinVnd: -1 }))).toBe(400);
      expect(await statusOf(createJob({ title: "Lương tối đa âm", salaryMaxVnd: -5 }))).toBe(400);
      expect(await statusOf(createJob({ title: "Khoảng ngược", salaryMinVnd: 30_000_000, salaryMaxVnd: 15_000_000 }))).toBe(400);
      expect(await statusOf(createJob({ title: "Số lượng 0", quantity: 0 }))).toBe(400);
      expect(await statusOf(createJob({ title: "Khoảng đúng", salaryMinVnd: 10, salaryMaxVnd: 10 }))).toBeUndefined();
    });
  });

  describe("job-postings: quyền (PERMISSION §3.1)", () => {
    it("sale tạo tin của mình (author tự gán); sale sửa / xoá tin của sale khác → 403", async () => {
      const mine = await createJob({ title: "Tin của sale" });
      expect(String(typeof mine.author === "object" ? mine.author.id : mine.author)).toBe(sale.id);
      expect((await updateJob(mine.id, { workplace: "Sửa của mình" }, { as: sale })).workplace).toBe("Sửa của mình");
      expect(await statusOf(updateJob(mine.id, { workplace: "Phá" }, { as: otherSale }))).toBe(403);
      expect(await statusOf(updateJob(mine.id, { deletedAt: NOW() }, { as: otherSale }))).toBe(403);
      expect(await statusOf(deleteJob(mine.id, otherSale))).toBe(403);
    });

    it("sale xoá mềm tin của mình nhưng không xoá hẳn và không khôi phục; admin khôi phục và xoá hẳn", async () => {
      const mine = await createJob({ title: "Xoá mềm" });
      await updateJob(mine.id, { deletedAt: NOW() }, { as: sale });
      expect(await statusOf(deleteJob(mine.id, sale))).toBe(403);
      expect(await statusOf(updateJob(mine.id, { deletedAt: null }, { as: sale, trash: true }))).toBe(403);
      const restored = await updateJob(mine.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      await deleteJob(mine.id, admin);
      const gone = await payload.find({ collection: "job-postings", where: { id: { equals: mine.id } }, trash: true, overrideAccess: true });
      expect(gone.docs).toHaveLength(0);
    });

    it("khách không tạo được", async () => {
      const guestCreate = payload.create({
        collection: "job-postings",
        data: { title: "Khách", category: categoryId, employmentType: "full_time", deadline: IN_30_DAYS() } as never,
        overrideAccess: false,
      });
      expect(await statusOf(guestCreate)).toBe(403);
    });
  });

  describe("job-postings: category thuộc scope job", () => {
    it("danh mục sai scope → 400; đúng scope → được", async () => {
      const wrong = await createCategory("Tin X", "news");
      expect(await statusOf(createJob({ title: "Sai scope", category: wrong.id }))).toBe(400);
      expect((await createJob({ title: "Đúng scope" })).category).toBe(categoryId);
    });

    it("G25: danh mục tuỳ chọn (ERD §4.10): tạo không có danh mục được, gỡ danh mục khi sửa được, sai scope vẫn bị chặn", async () => {
      const without = await createJob({ title: "Không danh mục", category: null });
      expect(without.category ?? null).toBeNull();
      const created = await createJob({ title: "Có rồi gỡ danh mục" });
      expect(created.category).toBe(categoryId);
      expect((await updateJob(created.id, { category: null })).category ?? null).toBeNull();
      const wrong = await createCategory("Tin Y", "news");
      expect(await statusOf(updateJob(created.id, { category: wrong.id }))).toBe(400);
    });

    it("không xoá được danh mục đang có tin tuyển dụng (xoá hẳn và xoá mềm → 409); hết tin thì xoá được", async () => {
      const category = await createCategory("Có tin", "job");
      const doc = await createJob({ title: "Giữ danh mục", category: category.id });
      const hardDelete = () => payload.delete({ collection: "categories", id: category.id, user: asUser(admin), overrideAccess: false, trash: true });
      const softDelete = () =>
        payload.update({ collection: "categories", id: category.id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(hardDelete())).toBe(409);
      expect(await statusOf(softDelete())).toBe(409);
      await deleteJob(doc.id, admin);
      await hardDelete();
    });
  });

  describe("job-postings: slug, song ngữ, truy vấn công khai, làm mới cache", () => {
    it("slug sinh từ tiêu đề và tự thêm hậu tố khi trùng", async () => {
      expect(await statusOf(createJob({ title: "" }))).toBe(400);
      expect((await createJob({ title: "Nhân Viên Kinh Doanh" })).slug).toBe("nhan-vien-kinh-doanh");
      expect((await createJob({ title: "Nhân Viên Kinh Doanh" })).slug).toBe("nhan-vien-kinh-doanh-2");
    });

    it("bật hasEnglish thiếu yêu cầu bản en → 400; đủ title/description/requirements en → được", async () => {
      const doc = await createJob({ title: "Tuyển song ngữ" });
      const enData = { title: "Bilingual job", description: lexical("en") };
      // `hasEnglish` chỉ đọc với người dùng: chỉ code hệ thống (task dịch) bật được, nên dùng overrideAccess.
      const enable = (data: Record<string, unknown>) =>
        payload.update({ collection: "job-postings", id: doc.id, data: data as never, locale: "en", overrideAccess: true, depth: 0 });
      expect(await statusOf(enable({ ...enData, hasEnglish: true }))).toBe(400);
      const ok = await enable({ ...enData, requirements: lexical("en"), hasEnglish: true });
      expect(ok.hasEnglish).toBe(true);
    });

    it("PublicCollectionSlug nhận job-postings: khách không thấy draft / hidden / xoá mềm; en cần hasEnglish", async () => {
      const live = await createJob({ title: "Tin công khai", status: "published" });
      await createJob({ title: "Tin nháp" });
      const hidden = await createJob({ title: "Tin ẩn", status: "published" });
      await updateJob(hidden.id, { status: "hidden" });
      const gone = await createJob({ title: "Tin xoá", status: "published" });
      await updateJob(gone.id, { deletedAt: NOW() });

      const titles = (await publicQueries.findPublicList<{ title: string }>(payload, "job-postings", "vi")).docs.map((doc) => doc.title);
      expect(titles).toContain("Tin công khai");
      for (const unseen of ["Tin nháp", "Tin ẩn", "Tin xoá"]) expect(titles).not.toContain(unseen);

      expect(await publicQueries.findPublicBySlug(payload, "job-postings", "vi", "tin-nhap")).toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "job-postings", "en", "tin-cong-khai")).toBeNull();
      await payload.update({
        collection: "job-postings",
        id: live.id,
        data: { title: "Public job", description: lexical("en"), requirements: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await publicQueries.findPublicBySlug(payload, "job-postings", "en", "public-job")).not.toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "job-postings", "vi", "tin-cong-khai")).not.toBeNull();
    });

    it("xuất bản làm mới /tuyen-dung/[slug] + /tuyen-dung của vi và en; nháp thì không", async () => {
      const doc = await createJob({ title: "Làm mới tuyển dụng" });
      expect(revalidatedPaths).toEqual([]);
      await updateJob(doc.id, { status: "published" });
      expect(revalidatedPaths.flat()).toEqual(
        expect.arrayContaining(["/vi/tuyen-dung/lam-moi-tuyen-dung", "/vi/tuyen-dung", "/en/tuyen-dung"]),
      );
    });
  });

  describe("job-applications: quyền + PII", () => {
    it("đủ trường ERD §4.10; không bật trash / versions", () => {
      const config = payload.collections["job-applications"]!.config;
      expect(config.flattenedFields.map((field) => field.name)).toEqual(
        expect.arrayContaining([
          "jobPosting", "fullName", "phone", "email", "cv", "message", "status", "note", "consentAt", "consentVersion", "locale",
          "ipHash", "anonymizedAt",
        ]),
      );
      expect(config.trash).toBeFalsy();
      expect(config.versions).toBeFalsy();
    });

    it("sale GET danh sách / chi tiết hồ sơ → 403; khách → 403; admin đọc được", async () => {
      const job = await createJob({ title: "Tin có hồ sơ A" });
      const application = await submitApplication(job.id);
      const find = (user: Actor | null) =>
        payload.find({ collection: "job-applications", user: user ? asUser(user) : null, overrideAccess: false, depth: 0 });
      const findOne = (user: Actor | null) =>
        payload.findByID({ collection: "job-applications", id: application.id, user: user ? asUser(user) : null, overrideAccess: false, depth: 0 });
      expect(await statusOf(find(sale))).toBe(403);
      expect(await statusOf(find(null))).toBe(403);
      expect(await statusOf(findOne(sale))).toBe(403);
      expect(await statusOf(findOne(null))).toBe(403);
      expect((await find(admin)).docs.map((doc) => doc.id)).toContain(application.id);
    });

    it("khách / sale / admin tạo qua API → 403 (chỉ Local API overrideAccess của endpoint mới tạo được)", async () => {
      const job = await createJob({ title: "Tin có hồ sơ B" });
      const data = {
        jobPosting: job.id,
        fullName: "Khách",
        phone: "0900000000",
        email: "khach@example.test",
        cv: cvId,
        consentAt: NOW(),
        consentVersion: "2026-10",
        locale: "vi",
      } as never;
      const create = (user: Actor | null) =>
        payload.create({ collection: "job-applications", data, user: user ? asUser(user) : null, overrideAccess: false });
      expect(await statusOf(create(null))).toBe(403);
      expect(await statusOf(create(sale))).toBe(403);
      expect(await statusOf(create(admin))).toBe(403);
    });

    it("sale sửa / xoá hồ sơ → 403", async () => {
      const job = await createJob({ title: "Tin có hồ sơ C" });
      const application = await submitApplication(job.id);
      expect(await statusOf(updateApplication(application.id, { status: "hired" }, sale))).toBe(403);
      expect(
        await statusOf(payload.delete({ collection: "job-applications", id: application.id, user: asUser(sale), overrideAccess: false })),
      ).toBe(403);
    });

    it("admin đổi status qua mọi trạng thái và ghi note; mặc định new; trạng thái lạ → 400", async () => {
      const job = await createJob({ title: "Tin có hồ sơ D" });
      const application = await submitApplication(job.id);
      expect(application.status).toBe("new");
      for (const status of ["reviewing", "interview", "hired"]) {
        expect((await updateApplication(application.id, { status }, admin)).status).toBe(status);
      }
      const rejected = await updateApplication(application.id, { status: "rejected", note: "Không phù hợp" }, admin);
      expect(rejected).toMatchObject({ status: "rejected", note: "Không phù hợp" });
      expect(await statusOf(updateApplication(application.id, { status: "xyz" }, admin))).toBe(400);
    });

    it("trường khách gửi không sửa được qua API kể cả admin (bị bỏ qua), vẫn giữ nguyên giá trị", async () => {
      const job = await createJob({ title: "Tin có hồ sơ E" });
      const otherJob = await createJob({ title: "Tin có hồ sơ E khác" });
      const application = await submitApplication(job.id);
      const updated = await updateApplication(
        application.id,
        {
          fullName: "Tên bị sửa", phone: "0999999999", email: "sua@example.test", message: "Sửa", consentVersion: "x", locale: "en",
          jobPosting: otherJob.id, cv: await insertCv(), consentAt: "2000-01-01T00:00:00.000Z", anonymizedAt: NOW(), status: "reviewing",
        },
        admin,
      );
      expect(updated).toMatchObject({
        fullName: "Nguyễn Văn A",
        phone: "0901234567",
        email: "ungvien@example.test",
        message: "Xin chào",
        consentVersion: "2026-10",
        locale: "vi",
        status: "reviewing",
      });
      const stored = await payload.findByID({ collection: "job-applications", id: application.id, overrideAccess: true, depth: 0 });
      expect(String(stored.jobPosting)).toBe(job.id);
      expect(String(stored.cv)).toBe(cvId);
      expect(stored.consentAt).toBe(application.consentAt);
      expect(stored.anonymizedAt ?? null).toBeNull();
    });

    it("ipHash không bao giờ trả ra qua API (kể cả admin) nhưng vẫn lưu trong DB", async () => {
      const job = await createJob({ title: "Tin có hồ sơ F" });
      const application = await submitApplication(job.id);
      const viaAdmin = await payload.findByID({ collection: "job-applications", id: application.id, user: asUser(admin), overrideAccess: false, depth: 0 });
      expect("ipHash" in viaAdmin).toBe(false);
      const row = await withDatabase((client) => client.query(`SELECT ip_hash FROM job_applications WHERE id = $1`, [application.id]));
      expect(row.rows[0].ip_hash).toBe("hash-ip");
    });

    it("thiếu trường bắt buộc (cv, consent, email sai định dạng, locale lạ) → 400", async () => {
      const job = await createJob({ title: "Tin có hồ sơ G" });
      expect(await statusOf(submitApplication(job.id, { cv: null }))).toBe(400);
      expect(await statusOf(submitApplication(job.id, { consentAt: null }))).toBe(400);
      expect(await statusOf(submitApplication(job.id, { consentVersion: "" }))).toBe(400);
      expect(await statusOf(submitApplication(job.id, { email: "khong-phai-email" }))).toBe(400);
      expect(await statusOf(submitApplication(job.id, { locale: "fr" }))).toBe(400);
      expect(await statusOf(submitApplication(job.id, { fullName: "" }))).toBe(400);
      expect(await statusOf(submitApplication(job.id, { message: "x".repeat(2001) }))).toBe(400);
    });

    it("không xoá hẳn được tin tuyển dụng còn hồ sơ (409); xoá mềm được; hết hồ sơ thì xoá hẳn được", async () => {
      const job = await createJob({ title: "Tin giữ hồ sơ" });
      const application = await submitApplication(job.id);
      expect(await statusOf(deleteJob(job.id, admin))).toBe(409);
      await updateJob(job.id, { deletedAt: NOW() }, { as: sale });
      const stillThere = await payload.findByID({ collection: "job-applications", id: application.id, overrideAccess: true, depth: 0 });
      expect(String(stillThere.jobPosting)).toBe(job.id);
      await payload.delete({ collection: "job-applications", id: application.id, user: asUser(admin), overrideAccess: false });
      await deleteJob(job.id, admin);
    });

    it("admin xoá hồ sơ → xoá luôn CV (dòng private_files + gọi xoá file) và ghi audit không có PII", async () => {
      const job = await createJob({ title: "Tin xoá hồ sơ" });
      const ownCv = await insertCv();
      const application = await submitApplication(job.id, { cv: ownCv, fullName: "Trần Thị Bí Mật", email: "bimat@example.test" });
      const deletedFileIds: string[] = [];
      const privateFilesHooks = payload.collections["private-files"]!.config.hooks;
      const spy = (async ({ id }: { id: string | number }) => void deletedFileIds.push(String(id))) as never;
      privateFilesHooks.afterDelete = [...(privateFilesHooks.afterDelete ?? []), spy];
      try {
        await payload.delete({ collection: "job-applications", id: application.id, user: asUser(admin), overrideAccess: false });
      } finally {
        privateFilesHooks.afterDelete = privateFilesHooks.afterDelete.filter((hook) => hook !== spy);
      }
      expect(await countRows("job_applications", application.id)).toBe(0);
      expect(await countRows("private_files", ownCv)).toBe(0);
      expect(deletedFileIds).toEqual([ownCv]);
      const logs = await payload.find({
        collection: "audit-logs",
        where: { and: [{ collection: { equals: "job-applications" } }, { docId: { equals: application.id } }] },
        overrideAccess: true,
        depth: 0,
      });
      expect(logs.docs).toHaveLength(1);
      expect(logs.docs[0]).toMatchObject({ action: "content.purge" });
      expect(JSON.stringify(logs.docs[0])).not.toMatch(/Bí Mật|bimat/);
    });

    it("xoá CV lỗi → rollback: hồ sơ vẫn còn và không để lại dòng audit", async () => {
      const job = await createJob({ title: "Tin xoá CV lỗi" });
      const ownCv = await insertCv();
      const application = await submitApplication(job.id, { cv: ownCv });
      const privateFilesHooks = payload.collections["private-files"]!.config.hooks;
      const failingDelete = (async () => {
        throw new Error("S3 down");
      }) as never;
      privateFilesHooks.afterDelete = [...(privateFilesHooks.afterDelete ?? []), failingDelete];
      try {
        await expect(
          payload.delete({ collection: "job-applications", id: application.id, user: asUser(admin), overrideAccess: false }),
        ).rejects.toThrow();
      } finally {
        privateFilesHooks.afterDelete = privateFilesHooks.afterDelete.filter((hook) => hook !== failingDelete);
      }
      expect(await countRows("job_applications", application.id)).toBe(1);
      expect(await countRows("private_files", ownCv)).toBe(1);
      const logs = await payload.find({
        collection: "audit-logs",
        where: { and: [{ collection: { equals: "job-applications" } }, { docId: { equals: application.id } }] },
        overrideAccess: true,
        depth: 0,
      });
      expect(logs.docs).toHaveLength(0);
    });

    it("hồ sơ đã ẩn danh (cv = null) vẫn xoá được; cv chỉ được trống khi có anonymizedAt", async () => {
      const job = await createJob({ title: "Tin ẩn danh" });
      const application = await submitApplication(job.id, { cv: await insertCv() });
      const clear = (data: Record<string, unknown>) =>
        payload.update({ collection: "job-applications", id: application.id, data: { cv: null, ...data } as never, overrideAccess: true, depth: 0 });
      expect(await statusOf(clear({}))).toBe(400);
      const anonymized = await clear({ anonymizedAt: NOW() });
      expect(anonymized.cv).toBeNull();
      await payload.delete({ collection: "job-applications", id: application.id, user: asUser(admin), overrideAccess: false });
      expect(await countRows("job_applications", application.id)).toBe(0);
    });
  });

  describe("tuyển dụng công khai: danh sách chỉ tin còn hạn, chi tiết vẫn mở (SPECIFICATIONS F6)", () => {
    const DAY = 24 * 60 * 60 * 1000;
    /** Giá trị ô chọn ngày của admin: 12:00 UTC của ngày (hôm nay giờ VN + số ngày). */
    const pickerDeadline = (daysFromToday: number, now: Date) => {
      const today = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return new Date(Date.parse(`${today}T12:00:00.000Z`) + daysFromToday * DAY).toISOString();
    };
    let careers: typeof import("../../src/lib/careers/job-queries");

    beforeAll(async () => {
      careers = await import("../../src/lib/careers/job-queries");
    });

    const titlesOf = async (locale: Locale, now: Date, extra: Record<string, unknown> = {}) =>
      (await careers.listOpenJobs(payload, locale, { page: 1, now, ...extra })).docs.map((doc) => doc.title);

    it("tin hết hạn không ở danh sách nhưng chi tiết vẫn tìm được; tin còn hạn (kể cả hạn là hôm nay) ở danh sách", async () => {
      const now = new Date();
      await createJob({ title: "CL còn hạn dài", status: "published", deadline: pickerDeadline(30, now) });
      await createJob({ title: "CL hạn hôm nay", status: "published", deadline: pickerDeadline(0, now) });
      await createJob({ title: "CL đã hết hạn", status: "published", deadline: pickerDeadline(-2, now) });
      await createJob({ title: "CL nháp còn hạn", deadline: pickerDeadline(30, now) });

      const titles = await titlesOf("vi", now);
      expect(titles).toEqual(expect.arrayContaining(["CL còn hạn dài", "CL hạn hôm nay"]));
      expect(titles).not.toContain("CL đã hết hạn");
      expect(titles).not.toContain("CL nháp còn hạn");

      const expired = await careers.findPublicJobBySlug(payload, "vi", "cl-da-het-han");
      expect(expired?.title).toBe("CL đã hết hạn");
      expect(await careers.findPublicJobBySlug(payload, "vi", "cl-nhap-con-han")).toBeNull();
    });

    it("biên nửa đêm giờ VN: 16:59 UTC còn hạn chót hôm nay, 17:00 UTC (00:00 ICT) đã hết", async () => {
      const deadline = new Date(Date.UTC(2031, 0, 10, 12)).toISOString();
      await createJob({ title: "CL biên nửa đêm", status: "published", deadline });
      expect(await titlesOf("vi", new Date("2031-01-10T16:59:59.000Z"))).toContain("CL biên nửa đêm");
      expect(await titlesOf("vi", new Date("2031-01-10T17:00:00.000Z"))).not.toContain("CL biên nửa đêm");
    });

    it("lọc theo danh mục và tỉnh; /en cần hasEnglish; tin chưa có danh mục (G25) vẫn vào danh sách không lọc", async () => {
      const now = new Date();
      const other = await createCategory("Nhóm khác", "job");
      const inCategory = await createJob({
        title: "CL trong nhóm khác",
        status: "published",
        category: other.id,
        province: provinceId,
        deadline: pickerDeadline(10, now),
      });
      await createJob({ title: "CL không danh mục", status: "published", category: null, deadline: pickerDeadline(10, now) });
      expect(await titlesOf("vi", now, { categoryIds: [other.id] })).toEqual(["CL trong nhóm khác"]);
      expect(await titlesOf("vi", now, { provinceId })).toContain("CL trong nhóm khác");
      expect(await titlesOf("vi", now)).toContain("CL không danh mục");
      expect(await titlesOf("en", now)).not.toContain("CL trong nhóm khác");
      await payload.update({
        collection: "job-postings",
        id: inCategory.id,
        data: { title: "Job in other group", description: lexical("en"), requirements: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await titlesOf("en", now)).toContain("Job in other group");
    });

    it("BL-054 q: tìm tên vị trí không dấu (1 từ: chuỗi con; ≥ 2 từ: nguyên cụm, BL-103), vẫn chỉ tin còn hạn + công khai, kết hợp lọc tỉnh; trả isUrgent + phòng ban; phân trang 12/trang", async () => {
      const now = new Date();
      const marker = `qz${runId}`;
      await createJob({ title: `Chuyên viên tư vấn bất động sản ${marker}`, status: "published", isUrgent: true, province: provinceId, deadline: pickerDeadline(10, now) });
      await createJob({ title: `Tư vấn cho thuê căn hộ ${marker}`, status: "published", deadline: pickerDeadline(10, now) });
      await createJob({ title: `Tư vấn đã hết hạn ${marker}`, status: "published", deadline: pickerDeadline(-5, now) });
      await createJob({ title: `Tư vấn nháp ${marker}`, deadline: pickerDeadline(10, now) });
      const search = (q: string, extra: Record<string, unknown> = {}) => careers.listOpenJobs(payload, "vi", { page: 1, now, q, ...extra });

      const both = await search(marker.toUpperCase());
      expect(both.docs.map((doc) => doc.title).sort()).toEqual([`Chuyên viên tư vấn bất động sản ${marker}`, `Tư vấn cho thuê căn hộ ${marker}`].sort());
      expect(both.totalDocs).toBe(2);
      expect((await search(`bat dong san ${marker}`)).docs.map((doc) => doc.title)).toEqual([`Chuyên viên tư vấn bất động sản ${marker}`]);
      // BL-103: các từ rời rạc / sai thứ tự không còn khớp.
      expect((await search(`bat dong ${marker}`)).totalDocs).toBe(0);
      expect((await search(`san bat dong ${marker}`)).totalDocs).toBe(0);
      expect((await search(`tu van ${marker}`)).totalDocs).toBe(0);
      expect((await search(marker, { provinceId })).totalDocs).toBe(1);
      expect((await search(`marketing ${marker}`)).totalDocs).toBe(0);
      const urgent = (await search(`bat dong san ${marker}`)).docs[0];
      expect(urgent?.isUrgent).toBe(true);
      expect(typeof urgent?.category === "object" && urgent.category !== null ? urgent.category.id : urgent?.category).toBe(categoryId);

      for (let index = 0; index < 13; index += 1) {
        await createJob({ title: `Trang ${marker} ${index}`, status: "published", deadline: pickerDeadline(10, now) });
      }
      const page1 = await search(`trang ${marker}`);
      const page2 = await careers.listOpenJobs(payload, "vi", { page: 2, now, q: `trang ${marker}` });
      expect([page1.docs.length, page2.docs.length, page1.totalDocs, page1.totalPages, page1.hasNextPage, page2.hasPrevPage]).toEqual([12, 1, 13, 2, true, true]);
      expect(new Set([...page1.docs, ...page2.docs].map((doc) => doc.id)).size).toBe(13);
    });

    it("BL-054 q ở /en: chỉ tin có bản EN, tìm theo tên EN (không lấy tên VI bù)", async () => {
      const now = new Date();
      const marker = `qen${runId}`;
      const translated = await createJob({ title: `Tư vấn viên ${marker}`, status: "published", deadline: pickerDeadline(10, now) });
      await createJob({ title: `Tư vấn chưa dịch ${marker}`, status: "published", deadline: pickerDeadline(10, now) });
      await payload.update({
        collection: "job-postings",
        id: translated.id,
        data: { title: `Sales consultant ${marker}`, description: lexical("en"), requirements: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const searchEn = async (q: string) => (await careers.listOpenJobs(payload, "en", { page: 1, now, q })).docs.map((doc) => doc.title);
      expect(await searchEn(`consultant ${marker}`)).toEqual([`Sales consultant ${marker}`]);
      expect(await searchEn(`tu van ${marker}`)).toEqual([]);
      expect(await searchEn(`chua dich ${marker}`)).toEqual([]);
    });

    it("BL-054 findOtherOpenJobs: tối đa 4, cùng danh mục trước rồi mới nhất các danh mục khác; loại tin đang xem; /en chỉ tin có bản EN", async () => {
      const now = new Date();
      const group = await createCategory(`Nhóm gợi ý ${runId}`, "job");
      const current = await createJob({ title: "CL gợi ý đang xem", status: "published", category: group.id, deadline: pickerDeadline(10, now) });
      const sibling = await createJob({ title: "CL gợi ý cùng nhóm", status: "published", category: group.id, deadline: pickerDeadline(10, now) });
      // -4 ngày (không phải hôm qua): test close-job-postings bên dưới đếm đúng tin hết hạn hôm qua.
      await createJob({ title: "CL gợi ý cùng nhóm hết hạn", status: "published", category: group.id, deadline: pickerDeadline(-4, now) });
      const newer = await createJob({ title: "CL gợi ý nhóm khác mới", status: "published", category: null, deadline: pickerDeadline(10, now) });
      const others = await careers.findOtherOpenJobs(payload, "vi", { currentId: current.id, categoryId: group.id }, now);
      const ids = others.map((doc) => doc.id);
      expect(ids).toHaveLength(careers.OTHER_OPEN_JOBS_COUNT);
      expect(careers.OTHER_OPEN_JOBS_COUNT).toBe(4);
      expect(ids[0]).toBe(sibling.id);
      expect(ids[1]).toBe(newer.id);
      expect(ids).not.toContain(current.id);
      expect(new Set(ids).size).toBe(ids.length);
      const noCategory = await careers.findOtherOpenJobs(payload, "vi", { currentId: current.id }, now);
      expect(noCategory[0]?.id).toBe(newer.id);
      expect((await careers.findOtherOpenJobs(payload, "en", { currentId: current.id, categoryId: group.id }, now)).map((doc) => doc.id)).not.toContain(sibling.id);
    });

    it("tin hết hạn không ra ở gợi ý findOtherOpenJobs và không tự đổi status", async () => {
      const now = new Date();
      const gone = await createJob({ title: "CL gợi ý hết hạn", status: "published", deadline: pickerDeadline(-3, now) });
      const live = await createJob({ title: "CL gợi ý còn hạn", status: "published", deadline: pickerDeadline(5, now) });
      const others = await careers.findOtherOpenJobs(payload, "vi", { currentId: gone.id, categoryId }, now);
      expect(others.map((doc) => doc.id)).toContain(live.id);
      expect(others.map((doc) => doc.id)).not.toContain(gone.id);
      const reread = await payload.findByID({ collection: "job-postings", id: gone.id, depth: 0, overrideAccess: true });
      expect(reread.status).toBe("published");
    });

    it("job close-job-postings: chỉ làm mới cache tin vừa hết hạn (hôm qua), không đổi status/deadline và không đụng tin khác", async () => {
      const { closeJobPostings } = await import("../../src/jobs/close-job-postings");
      const now = new Date();
      const yesterday = await createJob({ title: "CL vừa hết hạn", status: "published", deadline: pickerDeadline(-1, now) });
      await createJob({ title: "CL hết hạn từ lâu", status: "published", deadline: pickerDeadline(-9, now) });
      await createJob({ title: "CL vẫn còn hạn", status: "published", deadline: pickerDeadline(4, now) });
      await updateJob(yesterday.id, { title: "Just expired", description: lexical("en"), requirements: lexical("en"), hasEnglish: true }, { locale: "en" });
      const recorded: string[][] = [];
      const outcome = await closeJobPostings({ req: { payload } as never, now, revalidate: (paths) => void recorded.push(paths) });
      expect(outcome).toEqual({ expired: 1 });
      expect(recorded.flat().sort()).toEqual(
        ["/en/tuyen-dung", "/en/tuyen-dung/just-expired", "/vi/tuyen-dung", "/vi/tuyen-dung/cl-vua-het-han"].sort(),
      );
      const reread = await payload.findByID({ collection: "job-postings", id: yesterday.id, depth: 0, overrideAccess: true });
      expect(reread.status).toBe("published");
      expect(reread.deadline).toBe(pickerDeadline(-1, now));
    });
  });

  describe("seed", () => {
    it("seedSampleJobPostings: thiếu tỉnh báo lỗi rõ; chạy 2 lần không nhân đôi; tin published, có tin hết hạn, tin không danh mục và tin có bản EN", async () => {
      await expect(seedSampleJobPostings(payload)).rejects.toThrow(/pnpm seed/);
      await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true });
      expect(await seedSampleJobPostings(payload)).toEqual({ created: 4, skipped: 0 });
      expect(await seedSampleJobPostings(payload)).toEqual({ created: 0, skipped: 4 });
      const seeded = await payload.find({
        collection: "job-postings",
        where: {
          title: { in: ["Chuyên viên tư vấn bất động sản", "Trưởng nhóm kinh doanh (đã đóng)", "Nhân viên chăm sóc khách hàng bán thời gian"] },
        },
        locale: "vi",
        depth: 0,
        overrideAccess: true,
      });
      const byTitle = new Map(seeded.docs.map((doc) => [doc.title, doc]));
      const open = byTitle.get("Chuyên viên tư vấn bất động sản")!;
      expect(open.status).toBe("published");
      expect(open.hasEnglish).toBe(true);
      expect(Date.parse(open.deadline)).toBeGreaterThan(Date.now());
      expect(Date.parse(byTitle.get("Trưởng nhóm kinh doanh (đã đóng)")!.deadline)).toBeLessThan(Date.now());
      expect(byTitle.get("Nhân viên chăm sóc khách hàng bán thời gian")!.category ?? null).toBeNull();
    });
  });
});
