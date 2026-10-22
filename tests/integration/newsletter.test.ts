import type { EventEmitter } from "node:events";
import { strFromU8, unzipSync } from "fflate";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { PublicPipelineDeps } from "../../src/endpoints/_middleware/public-pipeline";

const baseUrl = process.env.DATABASE_URL_TEST;
const PASSWORD = "Mat-khau-hop-le-123";
const SHEET = "xl/worksheets/sheet1.xml";

const allowed: PublicPipelineDeps = {
  rateLimit: async () => ({ allowed: true, remaining: 4 }),
  verifyTurnstile: async () => ({ ok: true }),
};

/**
 * BL-054 P1-T04 trên DB tạm (migration thật, cấu hình app thật): `POST /api/public/newsletter` (gọi `handleNewsletter`, rate limit / Turnstile giả),
 * khoá field consent (MINOR-1 review P1-T01) qua REST, và `GET /api/admin/newsletter-subscribers/export` qua `handleEndpoints` (quyền + file thật).
 */
describe.skipIf(!baseUrl)("integration: bản tin thị trường (đăng ký + khoá consent + xuất Excel)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_newsletter_${runId}`;
  let payload: Payload;
  let handleNewsletter: typeof import("../../src/endpoints/public/newsletter").handleNewsletter;
  let adminToken = "";
  let saleToken = "";

  const email = (label: string) => `${label}-${runId}@example.test`;

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({ collection: "staff", overrideAccess: true, data: { email: email(label), password: PASSWORD, fullName: `Test ${label}`, role, active: true } });
  }
  const login = async (label: string) => (await payload.login({ collection: "staff", data: { email: email(label), password: PASSWORD } })).token ?? "";

  function post(body: Record<string, unknown>) {
    const raw = JSON.stringify({ consent: true, locale: "vi", turnstileToken: "token", sourcePath: "/tin-tuc", ...body });
    return handleNewsletter({ headers: new Headers({ "CF-Connecting-IP": "198.51.100.31" }), text: async () => raw }, { payload, pipelineDeps: allowed });
  }

  const findByEmail = async (value: string) =>
    (await payload.find({ collection: "newsletter-subscribers", where: { email: { equals: value } }, overrideAccess: true, depth: 0 })).docs;

  const rest = (method: string, path: string, { token, body }: { token?: string; body?: unknown } = {}) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
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
    process.env.DATABASE_URL = url.toString();
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    ({ handleNewsletter } = await import("../../src/endpoints/public/newsletter"));
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    await payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI", privacyPolicyVersion: "2026-10-nl" } as never, locale: "vi", overrideAccess: true });
    await createStaff("admin", ROLES.admin);
    await createStaff("sale", ROLES.sale);
    adminToken = await login("admin");
    saleToken = await login("sale");
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

  it("đăng ký mới: 1 bản active, email chuẩn hoá, consent + phiên bản chính sách từ site-settings; gửi lại không tạo bản mới, phản hồi giống hệt", async () => {
    const target = email("moi");
    const first = await post({ email: `  ${target.toUpperCase()} ` });
    expect(first.status).toBe(200);
    const firstBody = await first.text();
    const [doc] = await findByEmail(target);
    expect(doc).toMatchObject({ status: "active", locale: "vi", privacyPolicyVersion: "2026-10-nl", sourcePath: "/tin-tuc" });
    expect(doc!.consentAt).toBeTruthy();

    const second = await post({ email: target, locale: "en" });
    expect(second.status).toBe(200);
    expect(await second.text()).toBe(firstBody);
    const docs = await findByEmail(target);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ locale: "vi", consentAt: doc!.consentAt });
  });

  it("đã huỷ -> đăng ký lại bật active + consent mới; 2 request song song cùng email -> cả hai 200, đúng 1 bản", async () => {
    const target = email("huy");
    await post({ email: target });
    const [doc] = await findByEmail(target);
    await payload.update({ collection: "newsletter-subscribers", id: doc!.id, data: { status: "unsubscribed" }, overrideAccess: true });
    expect((await post({ email: target, locale: "en", sourcePath: "/en/news" })).status).toBe(200);
    const [back] = await findByEmail(target);
    expect(back).toMatchObject({ id: doc!.id, status: "active", locale: "en", sourcePath: "/en/news" });

    const racer = email("dua");
    const results = await Promise.all([post({ email: racer }), post({ email: racer }), post({ email: racer })]);
    expect(results.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(await findByEmail(racer)).toHaveLength(1);
  });

  it("thiếu consent / email sai -> 400, không tạo bản ghi", async () => {
    expect((await post({ email: email("noconsent"), consent: false })).status).toBe(400);
    expect((await post({ email: "khong-phai-email" })).status).toBe(400);
    expect(await findByEmail(email("noconsent"))).toHaveLength(0);
  });

  it("MINOR-1: admin PATCH qua REST chỉ đổi được status; email / locale / consentAt / privacyPolicyVersion / sourcePath giữ nguyên", async () => {
    const target = email("khoa");
    await post({ email: target });
    const [doc] = await findByEmail(target);
    const response = await rest("PATCH", `/newsletter-subscribers/${doc!.id}`, {
      token: adminToken,
      body: { status: "unsubscribed", email: email("doi"), locale: "en", consentAt: "2020-01-01T00:00:00.000Z", privacyPolicyVersion: "gia", sourcePath: "/gia" },
    });
    expect(response.status).toBe(200);
    const [after] = await findByEmail(target);
    expect(after).toMatchObject({ status: "unsubscribed", email: target, locale: "vi", consentAt: doc!.consentAt, privacyPolicyVersion: "2026-10-nl", sourcePath: "/tin-tuc" });
    expect(await findByEmail(email("doi"))).toHaveLength(0);
  });

  it("xuất Excel: admin 200 (đúng cột, lọc status, audit newsletter.export); sale 403; khách 401; status lạ 400", async () => {
    expect((await rest("GET", "/admin/newsletter-subscribers/export", { token: saleToken })).status).toBe(403);
    expect((await rest("GET", "/admin/newsletter-subscribers/export")).status).toBe(401);
    expect((await rest("GET", "/admin/newsletter-subscribers/export?status=spam", { token: adminToken })).status).toBe(400);

    const response = await rest("GET", "/admin/newsletter-subscribers/export?status=unsubscribed", { token: adminToken });
    expect(response.status).toBe(200);
    const sheet = strFromU8(unzipSync(new Uint8Array(await response.arrayBuffer()))[SHEET]!);
    for (const column of ["Email", "Ngôn ngữ", "Trạng thái", "Ngày đăng ký", "Ngày đồng ý", "Phiên bản chính sách", "Trang đăng ký"]) expect(sheet).toContain(column);
    expect(sheet).toContain(email("khoa"));
    expect(sheet).toContain("Đã huỷ");
    expect(sheet).not.toContain(email("moi"));

    const audits = await payload.find({ collection: "audit-logs", where: { action: { equals: "newsletter.export" } }, overrideAccess: true, depth: 0 });
    expect(audits.totalDocs).toBe(1);
    expect(audits.docs[0]).toMatchObject({ collection: "newsletter-subscribers", meta: { filters: { status: "unsubscribed" }, rowCount: 1 } });
    expect(JSON.stringify(audits.docs[0])).not.toContain("example.test");
  });
});
