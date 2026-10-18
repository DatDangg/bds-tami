import type { EventEmitter } from "node:events";
import pg from "pg";
import { createLocalReq, type Payload, type PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/** Ngưỡng 500 tin không hạ được và tạo 501 tin quá chậm: khi bật cờ, số tin đếm được coi như vượt ngưỡng để lần lưu đổi tên đi đúng nhánh xếp job. */
const overThreshold = vi.hoisted(() => ({ on: false }));
vi.mock("../../src/lib/search/reindex-rental-search-text", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/search/reindex-rental-search-text")>();
  return { ...original, rentalsInScope: async (...args: Parameters<typeof original.rentalsInScope>) => (overThreshold.on ? 501 : original.rentalsInScope(...args)) };
});

import { ROLES } from "../../src/access/roles";
import { queueReindexJob } from "../../src/lib/search/reindex-in-hook";
import { REINDEX_RENTALS_SEARCH_SLUG } from "../../src/lib/search/reindex-job-input";

const baseUrl = process.env.DATABASE_URL_TEST;

const lexical = (text: string) => ({
  root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "paragraph", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "text", version: 1, text }] }] },
});

/**
 * Nhánh > 500 tin của hook không hạ ngưỡng được nên test gọi thẳng `queueReindexJob` (đúng đường xếp job của hook) trên DB tạm đã migrate thật:
 * enum `task_slug` có giá trị mới, truy vấn idempotent trên `payload-jobs.input` đúng cú pháp, job hiện sau commit, runner chạy job dựng lại `searchText`, field ảo cảnh báo đúng.
 */
describe.skipIf(!baseUrl)("integration: job reindex-rentals-search (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_reindex_job_${runId}`;
  let testUrl = "";
  let payload: Payload;
  let admin: { id: string; collection: "staff" } & Record<string, unknown>;
  let provinceId = "";
  let otherProvinceId = "";
  let rentalId = "";

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  const pendingJobs = () => withDatabase((client) => client.query(`SELECT "input", "processing", "has_error" FROM "payload_jobs" WHERE "task_slug" = $1 ORDER BY "created_at"`, [REINDEX_RENTALS_SEARCH_SLUG]));
  const searchTextOf = async () => (await payload.findByID({ collection: "rentals", id: rentalId, locale: "vi", fallbackLocale: false, depth: 0, overrideAccess: true, showHiddenFields: true })).searchText;
  const readProvince = (id: string, user?: typeof admin) =>
    payload.findByID({ collection: "provinces", id, depth: 0, overrideAccess: false, ...(user ? { user: user as never } : {}) });

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
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });

    admin = {
      ...(await payload.create({ collection: "staff", overrideAccess: true, data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Admin", role: ROLES.admin, active: true } })),
      collection: "staff",
    } as typeof admin;
    provinceId = (await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })).id;
    otherProvinceId = (await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })).id;
    const wardId = (await payload.create({ collection: "wards", data: { province: provinceId, code: "70101063", name: "Phường Sài Gòn", type: "phuong", slug: "sai-gon" }, overrideAccess: true })).id;
    const categoryId = (await payload.create({ collection: "categories", data: { name: "Căn hộ", scope: "rental" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id;
    rentalId = (
      await payload.create({
        collection: "rentals",
        data: { title: "Căn hộ test", description: lexical("Mô tả"), category: categoryId, province: provinceId, ward: wardId, address: "12 Đường Test", priceMonthlyVnd: 10_000_000, areaM2: 40, status: "draft", gallery: [] } as never,
        locale: "vi",
        user: admin as never,
        overrideAccess: false,
        depth: 0,
      })
    ).id;
  }, 180_000);

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

  it("xếp job bằng req trong transaction: job chỉ hiện với kết nối khác sau commit; xếp lần hai cùng phạm vi không tạo trùng; phạm vi khác thì có job riêng", async () => {
    const transactionID = await payload.db.beginTransaction();
    const req = Object.assign(await createLocalReq({}, payload), { transactionID }) as PayloadRequest;
    const jobId = await queueReindexJob(req, { provinceId });
    expect((await pendingJobs()).rowCount).toBe(0);
    expect(await queueReindexJob(req, { provinceId })).toBe(jobId);
    await payload.db.commitTransaction(transactionID!);

    const afterCommit = await pendingJobs();
    expect(afterCommit.rows).toEqual([{ input: { scope: "province", id: provinceId }, processing: false, has_error: false }]);

    // Lần lưu sau (transaction khác) gặp job đang chờ: dùng lại, không xếp thêm.
    expect(await queueReindexJob(await createLocalReq({}, payload), { provinceId })).toBe(jobId);
    expect((await pendingJobs()).rowCount).toBe(1);
    await queueReindexJob(await createLocalReq({}, payload), { wardId: "w-khac" });
    expect((await pendingJobs()).rowCount).toBe(2);
  });

  it("field ảo searchReindexPending: admin thấy true đúng bản ghi có job chờ, false bản ghi khác; không đăng nhập thì không có giá trị", async () => {
    expect((await readProvince(provinceId, admin)).searchReindexPending).toBe(true);
    expect((await readProvince(otherProvinceId, admin)).searchReindexPending).toBe(false);
    expect((await readProvince(provinceId)).searchReindexPending).toBeUndefined();
  });

  it("lần lưu đổi tên vượt ngưỡng qua payload.update: doc trả về cho admin có searchReindexPending: true ngay (form hiện cảnh báo không cần tải lại); không phải admin thì không có cờ", async () => {
    overThreshold.on = true;
    try {
      const byAdmin = await payload.update({ collection: "provinces", id: provinceId, data: { name: "TP. Hồ Chí Minh" }, user: admin as never, overrideAccess: false, depth: 0 });
      expect(byAdmin.searchReindexPending).toBe(true);
      const bySystem = await payload.update({ collection: "provinces", id: provinceId, data: { name: "Thành phố Hồ Chí Minh" }, overrideAccess: true, depth: 0 });
      expect(bySystem.searchReindexPending).toBeUndefined();
    } finally {
      overThreshold.on = false;
    }
    // Job chờ của tỉnh đã có từ test trước → hai lần lưu dùng lại, không xếp trùng.
    expect((await pendingJobs()).rows.filter((row) => row.input.scope === "province")).toHaveLength(1);
  });

  it("runner chạy job: dựng lại searchText của tin thuộc tỉnh (theo tên hiện tại), job xong bị xoá, cảnh báo tắt; job input sai kết thúc lỗi không treo", async () => {
    await withDatabase((client) => client.query(`UPDATE "rentals_locales" SET "search_text" = 'cu' WHERE "_parent_id" = $1`, [rentalId]));
    await payload.update({ collection: "provinces", id: provinceId, data: { shortName: "TP HCM" }, overrideAccess: true });
    expect(await searchTextOf()).toBe("cu");
    await payload.jobs.queue({ task: REINDEX_RENTALS_SEARCH_SLUG, input: { scope: "city", id: "x" } as never });

    await payload.jobs.run({ silent: { error: true } });

    expect(await searchTextOf()).toContain("ho chi minh");
    expect(await searchTextOf()).toContain("can ho test");
    const remaining = await pendingJobs();
    // Job tỉnh + job phường (phạm vi không có tin) xong → xoá (deleteJobOnComplete); job input sai → huỷ (has_error), không còn job chờ/chạy.
    expect(remaining.rows.filter((row) => row.has_error !== true)).toEqual([]);
    expect(remaining.rows.map((row) => row.input)).toEqual([{ scope: "city", id: "x" }]);
    expect((await readProvince(provinceId, admin)).searchReindexPending).toBe(false);
  }, 60_000);
});
