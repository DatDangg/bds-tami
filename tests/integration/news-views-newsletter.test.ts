import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

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

/**
 * BL-054 P1-T01: hai collection mới `news-views-daily` + `newsletter-subscribers` trên DB tạm chạy migration THẬT
 * (khoá unique + FK cascade do migration tạo, không phải `push`), cấu hình app thật.
 */
describe.skipIf(!baseUrl)("integration: news-views-daily + newsletter-subscribers (DB tạm, migration thật)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_nvn_${runId}`;
  const password = "Mat-khau-hop-le-123";
  let testUrl = "";
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let adminToken = "";
  let saleToken = "";
  let categoryId = "";

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
  }

  const createNews = (title: string) =>
    payload.create({
      collection: "news",
      data: { title, excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, author: admin.id } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });

  const addViews = (news: string, day: string, views = 1) =>
    payload.create({ collection: "news-views-daily", data: { news, day, views }, overrideAccess: true, depth: 0 });

  const subscribe = (email: string, extra: Record<string, unknown> = {}) =>
    payload.create({
      collection: "newsletter-subscribers",
      data: { email, locale: "vi", consentAt: new Date().toISOString(), privacyPolicyVersion: "v1", sourcePath: "/tin-tuc", ...extra } as never,
      overrideAccess: true,
      depth: 0,
    });

  const rest = (method: string, path: string, { token, body }: { token?: string; body?: unknown } = {}) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    });

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
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    adminToken = (await payload.login({ collection: "staff", data: { email: admin.email, password } })).token ?? "";
    saleToken = (await payload.login({ collection: "staff", data: { email: sale.email, password } })).token ?? "";
    const category = await payload.create({ collection: "categories", data: { name: `Thị trường ${runId}`, scope: "news" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    categoryId = String(category.id);
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

  describe("news-views-daily", () => {
    it("DB có UNIQUE (news_id, day) và FK news_id ON DELETE CASCADE", async () => {
      const indexes = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'news_views_daily'`));
      expect(indexes.rows.some((row) => String(row.indexdef).includes("UNIQUE") && String(row.indexdef).includes("(news_id, day)"))).toBe(true);
      const fk = await withDatabase((client) =>
        client.query(`SELECT confdeltype FROM pg_constraint WHERE conname = 'news_views_daily_news_id_news_id_fk'`),
      );
      expect(fk.rows[0]?.confdeltype).toBe("c");
    });

    it("cùng tin + cùng ngày ghi lần 2 bị chặn; khác ngày được; views mặc định 0, không âm", async () => {
      const news = await createNews(`Bài lượt xem ${runId}`);
      await addViews(String(news.id), "2026-10-20T17:00:00.000Z", 3);
      expect(await statusOf(addViews(String(news.id), "2026-10-20T17:00:00.000Z"))).toBeGreaterThanOrEqual(400);
      await addViews(String(news.id), "2026-10-21T17:00:00.000Z");
      const zero = await payload.create({ collection: "news-views-daily", data: { news: String(news.id), day: "2026-10-22T17:00:00.000Z" } as never, overrideAccess: true, depth: 0 });
      expect(zero.views).toBe(0);
      expect(await statusOf(addViews(String(news.id), "2026-10-23T17:00:00.000Z", -1))).toBe(400);
    });

    it("xoá hẳn tin kéo theo lượt xem của tin đó (không lỗi NOT NULL)", async () => {
      const news = await createNews(`Bài xoá hẳn ${runId}`);
      await addViews(String(news.id), "2026-10-20T17:00:00.000Z", 5);
      await payload.delete({ collection: "news", id: news.id, overrideAccess: true });
      const left = await payload.find({ collection: "news-views-daily", where: { news: { equals: news.id } }, overrideAccess: true });
      expect(left.totalDocs).toBe(0);
    });

    it("admin đọc được; sale và khách không đọc; không ai tạo / sửa / xoá qua API", async () => {
      const news = await createNews(`Bài quyền ${runId}`);
      const row = await addViews(String(news.id), "2026-10-20T17:00:00.000Z", 2);
      expect((await rest("GET", "/news-views-daily", { token: adminToken })).status).toBe(200);
      expect((await rest("GET", "/news-views-daily", { token: saleToken })).status).toBe(403);
      expect((await rest("GET", "/news-views-daily")).status).toBe(403);
      const body = { news: String(news.id), day: "2026-11-01T17:00:00.000Z", views: 9 };
      expect((await rest("POST", "/news-views-daily", { token: adminToken, body })).status).toBe(403);
      expect((await rest("POST", "/news-views-daily", { body })).status).toBe(403);
      expect((await rest("PATCH", `/news-views-daily/${row.id}`, { token: adminToken, body: { views: 100 } })).status).toBe(403);
      expect((await rest("DELETE", `/news-views-daily/${row.id}`, { token: adminToken })).status).toBe(403);
      expect(payload.collections["news-views-daily"]!.config.disableDuplicate).toBe(true);
    });
  });

  describe("newsletter-subscribers", () => {
    it("email lưu đã trim + chữ thường; trùng (khác hoa / thường) bị chặn bởi unique", async () => {
      const doc = await subscribe(`  Khach.${runId}@Example.TEST `);
      expect(doc.email).toBe(`khach.${runId}@example.test`);
      expect(doc.status).toBe("active");
      expect(await statusOf(subscribe(`KHACH.${runId}@example.test`))).toBe(400);
      const indexes = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'newsletter_subscribers'`));
      expect(indexes.rows.some((row) => String(row.indexdef).includes("UNIQUE") && String(row.indexdef).includes("(email)"))).toBe(true);
    });

    it("khách / sale / admin không tạo được qua REST", async () => {
      const body = { email: `rest-${runId}@example.test`, locale: "vi" };
      expect((await rest("POST", "/newsletter-subscribers", { body })).status).toBe(403);
      expect((await rest("POST", "/newsletter-subscribers", { token: saleToken, body })).status).toBe(403);
      expect((await rest("POST", "/newsletter-subscribers", { token: adminToken, body })).status).toBe(403);
    });

    it("admin đọc / đổi trạng thái / xoá; sale và khách không đọc, không sửa, không xoá", async () => {
      const doc = await subscribe(`quyen-${runId}@example.test`, { locale: "en" });
      expect((await rest("GET", "/newsletter-subscribers", { token: saleToken })).status).toBe(403);
      expect((await rest("GET", "/newsletter-subscribers")).status).toBe(403);
      expect((await rest("GET", `/newsletter-subscribers/${doc.id}`, { token: saleToken })).status).toBe(403);
      expect((await rest("PATCH", `/newsletter-subscribers/${doc.id}`, { token: saleToken, body: { status: "unsubscribed" } })).status).toBe(403);
      expect((await rest("DELETE", `/newsletter-subscribers/${doc.id}`, { token: saleToken })).status).toBe(403);

      const list = await rest("GET", "/newsletter-subscribers", { token: adminToken });
      expect(list.status).toBe(200);
      const updated = await payload.update({
        collection: "newsletter-subscribers",
        id: doc.id,
        data: { status: "unsubscribed" },
        user: asUser(admin),
        overrideAccess: false,
      });
      expect(updated.status).toBe("unsubscribed");
      expect(updated.locale).toBe("en");
      expect(await statusOf(payload.update({ collection: "newsletter-subscribers", id: doc.id, data: { status: "lạ" } as never, user: asUser(admin), overrideAccess: false }))).toBe(400);
      expect((await rest("DELETE", `/newsletter-subscribers/${doc.id}`, { token: adminToken })).status).toBe(200);
    });
  });

  describe("job-postings.isUrgent (migration thật)", () => {
    it("cột is_urgent mặc định false, nullable (không SET NOT NULL trên dữ liệu cũ)", async () => {
      const column = await withDatabase((client) =>
        client.query(`SELECT column_default, is_nullable FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'is_urgent'`),
      );
      expect(column.rows[0]).toMatchObject({ column_default: "false", is_nullable: "YES" });
    });
  });
});
