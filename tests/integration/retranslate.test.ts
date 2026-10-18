import type { EventEmitter } from "node:events";
import pg from "pg";
import { sql } from "@payloadcms/db-postgres";
import { createLocalReq, handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { handleRetranslate } from "../../src/endpoints/admin/retranslate";
import { translateContent } from "../../src/jobs/translate-content";
import { fakeClient } from "../../src/lib/translation/test-helpers";

const baseUrl = process.env.DATABASE_URL_TEST;
const PASSWORD = "Mat-khau-hop-le-123";
const RANDOM_UUID = "11111111-2222-4333-8444-555555555555";

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

/** DB tạm (migration thật): `POST /api/admin/translations/:collection/:id` + duyệt bản EN trang pháp lý (hook `approveEnglish`). Không gọi Claude API (chỉ xếp job). */
describe.skipIf(!baseUrl)("integration: dịch lại bằng AI + duyệt EN trang pháp lý", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_retranslate_${runId}`;
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let saleA: Awaited<ReturnType<typeof createStaff>>;
  let saleB: Awaited<ReturnType<typeof createStaff>>;
  let tokens: { admin: string; saleA: string };
  let categoryId = "";
  let mediaId = "";
  let seq = 0;

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES]) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: PASSWORD, fullName: `Test ${label}`, role, active: true },
    });
  }
  const login = async (label: string) => (await payload.login({ collection: "staff", data: { email: `${label}-${runId}@example.test`, password: PASSWORD } })).token!;
  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });
  const execute = (query: unknown) => (payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> }).execute(query);

  const createNews = (author: string | number) => {
    seq += 1;
    return payload.create({
      collection: "news",
      data: { title: `Tin ${seq}`, excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, cover: mediaId, status: "published", author } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });
  };
  const retranslate = (segment: string, id: string, token?: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api/admin/translations/${segment}/${id}`, { method: "POST", headers: token ? { Authorization: `JWT ${token}` } : {} }),
    });
  const audits = async (action: string, docId?: string) =>
    (await payload.find({ collection: "audit-logs", where: { and: [{ action: { equals: action } }, ...(docId ? [{ docId: { equals: docId } }] : [])] }, overrideAccess: true, depth: 0, pagination: false })).docs;
  const translateJobs = async (slug: string, docId?: string) =>
    (
      await payload.find({
        collection: "payload-jobs",
        where: { and: [{ taskSlug: { equals: "translate-content" } }, { "input.slug": { equals: slug } }, ...(docId ? [{ "input.docId": { equals: docId } }] : [])] },
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
    ).docs;

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
    // Endpoint kiểm cấu hình dịch (hạn mức > 0); job KHÔNG chạy trong file này (chỉ xếp), nên không gọi API thật.
    process.env.TRANSLATION_MONTHLY_BUDGET_USD = "100";
    process.env.ANTHROPIC_API_KEY ||= "sk-ant-test-FAKE";
    process.env.TRANSLATION_MODEL ||= "claude-sonnet-5-5";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    admin = await createStaff("admin", ROLES.admin);
    saleA = await createStaff("sale-a", ROLES.sale);
    saleB = await createStaff("sale-b", ROLES.sale);
    tokens = { admin: await login("admin"), saleA: await login("sale-a") };
    await payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    categoryId = (await payload.create({ collection: "categories", data: { name: "Thị trường", scope: "news" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id as string;
    mediaId = (await execute(sql`INSERT INTO "media" (mime_type) VALUES ('image/jpeg') RETURNING id`)).rows[0]!.id as string;
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

  describe("POST /api/admin/translations/:collection/:id", () => {
    it("chưa đăng nhập -> 401, không xếp job, không audit", async () => {
      const doc = await createNews(saleA.id);
      const before = (await translateJobs("news", String(doc.id))).length;
      expect((await retranslate("news", String(doc.id))).status).toBe(401);
      expect((await translateJobs("news", String(doc.id))).length).toBe(before);
      expect(await audits("content.retranslate", String(doc.id))).toHaveLength(0);
    });

    it("sale dịch lại bài của người khác -> 404 (không lộ bài tồn tại), không xếp job, không audit", async () => {
      const doc = await createNews(saleB.id);
      const before = (await translateJobs("news", String(doc.id))).length;
      const response = await retranslate("news", String(doc.id), tokens.saleA);
      expect(response.status).toBe(404);
      expect((await translateJobs("news", String(doc.id))).length).toBe(before);
      expect(await audits("content.retranslate", String(doc.id))).toHaveLength(0);
      // Cùng thông báo với bài không tồn tại.
      const missing = await retranslate("news", RANDOM_UUID, tokens.saleA);
      expect(missing.status).toBe(404);
      expect(await missing.json()).toEqual(await response.json());
    });

    it("sale dịch lại bài của mình -> 202 { queued: true }, job force:true, audit content.retranslate", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      const response = await retranslate("news", id, tokens.saleA);
      expect(response.status).toBe(202);
      expect(await response.json()).toEqual({ success: true, data: { queued: true } });
      const jobs = await translateJobs("news", id);
      const forced = jobs.filter((job) => (job.input as { force?: boolean }).force === true);
      expect(forced).toHaveLength(1);
      expect(forced[0]!.input).toMatchObject({ kind: "collection", slug: "news", docId: id, force: true });
      const logs = await audits("content.retranslate", id);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ collection: "news" });
    });

    it("job hook đang chờ (không force) -> nâng lên force và chạy ngay, không thêm job", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      const pending = await translateJobs("news", id);
      expect(pending).toHaveLength(1);
      expect((pending[0]!.input as { force?: boolean }).force).toBeFalsy();
      expect((await retranslate("news", id, tokens.admin)).status).toBe(202);
      const after = await translateJobs("news", id);
      expect(after).toHaveLength(1);
      expect(after[0]!.input).toMatchObject({ force: true });
      expect(new Date(after[0]!.waitUntil as string).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it("admin dịch lại bài của sale -> 202", async () => {
      const doc = await createNews(saleB.id);
      expect((await retranslate("news", String(doc.id), tokens.admin)).status).toBe(202);
    });

    it("collection ngoài allowlist (leads, staff, audit-logs) -> 404, không audit", async () => {
      const before = (await audits("content.retranslate")).length;
      for (const collection of ["leads", "staff", "audit-logs", "job-applications"]) {
        expect((await retranslate(collection, RANDOM_UUID, tokens.admin)).status).toBe(404);
      }
      expect((await retranslate("news", "khong-phai-uuid", tokens.admin)).status).toBe(404);
      expect((await audits("content.retranslate")).length).toBe(before);
    });

    it("bản ghi không tồn tại -> 404; services/pages chỉ admin (sale 404, admin tới được nhánh tồn tại)", async () => {
      expect((await retranslate("news", RANDOM_UUID, tokens.admin)).status).toBe(404);
      expect((await retranslate("services", RANDOM_UUID, tokens.saleA)).status).toBe(404);
      expect((await retranslate("pages", RANDOM_UUID, tokens.saleA)).status).toBe(404);
    });

    it("global: admin -> 202 (job kind global, force); sale -> 404; global ngoài allowlist -> 404", async () => {
      const response = await retranslate("globals", "footer", tokens.admin);
      expect(response.status).toBe(202);
      const jobs = await translateJobs("footer");
      expect(jobs.some((job) => (job.input as { kind?: string; force?: boolean }).kind === "global" && (job.input as { force?: boolean }).force === true)).toBe(true);
      expect((await audits("content.retranslate", "footer")).length).toBe(1);
      expect((await retranslate("globals", "footer", tokens.saleA)).status).toBe(404);
      expect((await retranslate("globals", "payload-jobs", tokens.admin)).status).toBe(404);
    });

    it("bài đã xoá mềm -> 404, không audit, không job", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      await payload.update({ collection: "news", id, data: { deletedAt: new Date().toISOString() } as never, overrideAccess: true, depth: 0 });
      const before = (await translateJobs("news", id)).length;
      expect((await retranslate("news", id, tokens.admin)).status).toBe(404);
      expect((await translateJobs("news", id)).length).toBe(before);
      expect(await audits("content.retranslate", id)).toHaveLength(0);
    });

    it("dịch đang tắt (site-settings) hoặc hạn mức tháng = 0 -> 409 rõ ràng, không 202, không job, không audit", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      const before = (await translateJobs("news", id)).length;
      const setEnabled = (enabled: boolean) => payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI", translationEnabled: enabled } as never, locale: "vi", overrideAccess: true, depth: 0 });
      await setEnabled(false);
      try {
        const off = await retranslate("news", id, tokens.admin);
        expect(off.status).toBe(409);
        expect((await off.json()).error).toContain("đang tắt");
      } finally {
        await setEnabled(true);
      }
      const budget = process.env.TRANSLATION_MONTHLY_BUDGET_USD;
      process.env.TRANSLATION_MONTHLY_BUDGET_USD = "0";
      try {
        expect((await retranslate("news", id, tokens.admin)).status).toBe(409);
      } finally {
        process.env.TRANSLATION_MONTHLY_BUDGET_USD = budget;
      }
      expect((await translateJobs("news", id)).length).toBe(before);
      expect(await audits("content.retranslate", id)).toHaveLength(0);
    });

    it("ghi audit lỗi -> 500 và KHÔNG xếp job (fail-closed)", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      const before = (await translateJobs("news", id)).length;
      await execute(sql`ALTER TABLE audit_logs RENAME TO audit_logs_tmp_broken`);
      try {
        expect((await retranslate("news", id, tokens.admin)).status).toBe(500);
      } finally {
        await execute(sql`ALTER TABLE audit_logs_tmp_broken RENAME TO audit_logs`);
      }
      expect((await translateJobs("news", id)).length).toBe(before);
      expect(await audits("content.retranslate", id)).toHaveLength(0);
    });

    it("rate limit: vượt hạn mức -> 429 + Retry-After, không xếp job; Redis lỗi -> 503", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      const req = await createLocalReq({ user: asUser(saleA) }, payload);
      const jobsBefore = (await translateJobs("news", id)).length;
      const limited = await handleRetranslate(req, "news", id, async () => ({ allowed: false, retryAfterSeconds: 120 }));
      expect(limited.status).toBe(429);
      expect(limited.headers.get("Retry-After")).toBe("120");
      const { RateLimitUnavailableError } = await import("../../src/lib/security/rate-limit");
      const down = await handleRetranslate(req, "news", id, async () => {
        throw new RateLimitUnavailableError(new Error("redis"));
      });
      expect(down.status).toBe(503);
      expect((await translateJobs("news", id)).length).toBe(jobsBefore);
      expect(await audits("content.retranslate", id)).toHaveLength(0);
    });
  });

  describe("duyệt bản EN trang pháp lý (BR-08)", () => {
    async function createPendingPage(kind: "privacy" | "terms") {
      // `kind` duy nhất: dọn trang cùng loại của test trước.
      await payload.delete({ collection: "pages", where: { kind: { equals: kind } }, overrideAccess: true, trash: true });
      const page = await payload.create({
        collection: "pages",
        data: { kind, title: "Chính sách", content: lexical("Nội dung"), version: "1.0", effectiveDate: "2026-10-01T00:00:00.000Z", status: "published" } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      await payload.update({ collection: "pages", id: page.id, data: { title: "Policy", content: lexical("Content") } as never, locale: "en", overrideAccess: true, depth: 0 });
      await payload.update({ collection: "pages", id: page.id, data: { translation: { status: "pending_review", enSource: "ai" } } as never, locale: "vi", overrideAccess: true, depth: 0 });
      return String(page.id);
    }
    const readPage = (id: string) => payload.findByID({ collection: "pages", id, locale: "vi", overrideAccess: true, depth: 0 });
    const approve = (id: string, token?: string) =>
      handleEndpoints({
        config: payload.config,
        request: new Request(`http://localhost/api/admin/translations/pages/${id}/approve`, { method: "POST", headers: token ? { Authorization: `JWT ${token}` } : {} }),
      });
    /** Admin lưu form (giá trị `hasEnglish` do form gửi lên): không phải lệnh duyệt. */
    const saveForm = (id: string, data: Record<string, unknown>) =>
      payload.update({ collection: "pages", id, data: data as never, locale: "vi", user: asUser(admin), overrideAccess: false, depth: 0 });
    const runTranslation = async (slug: "pages" | "news", id: string, force: boolean, revalidated: string[][] = []) =>
      translateContent({
        req: await createLocalReq({}, payload),
        input: { kind: "collection", slug, docId: id, force },
        previousRuns: 0,
        deps: { config: { apiKey: "sk-ant-test-FAKE", model: "claude-sonnet-5-5", monthlyBudgetUsd: 100 }, client: fakeClient().client, revalidate: async (paths) => void revalidated.push(paths) },
      });

    it("admin gọi lệnh duyệt -> hasEnglish true, audit content.approve_translation, pending_review -> done; lưu lại không ghi audit thêm", async () => {
      const id = await createPendingPage("privacy");
      expect((await readPage(id)).hasEnglish).toBe(false);
      const response = await approve(id, tokens.admin);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: { id, hasEnglish: true } });
      const page = await readPage(id);
      expect(page.hasEnglish).toBe(true);
      expect(page.translation).toMatchObject({ status: "done", enSource: "ai" });
      const logs = await audits("content.approve_translation", id);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ collection: "pages" });
      await saveForm(id, { version: "1.1" });
      expect(await audits("content.approve_translation", id)).toHaveLength(1);
      // Đã duyệt rồi: duyệt lại là 409.
      expect((await approve(id, tokens.admin)).status).toBe(409);
    });

    it("quyền: chưa đăng nhập 401, sale 403, id sai dạng 400, không có trang 404; không audit", async () => {
      const id = await createPendingPage("terms");
      expect((await approve(id)).status).toBe(401);
      expect((await approve(id, tokens.saleA)).status).toBe(403);
      expect((await approve("khong-phai-uuid", tokens.admin)).status).toBe(400);
      expect((await approve(RANDOM_UUID, tokens.admin)).status).toBe(404);
      expect((await readPage(id)).hasEnglish).toBe(false);
      expect(await audits("content.approve_translation", id)).toHaveLength(0);
    });

    it("lưu form có hasEnglish true mà KHÔNG có lệnh duyệt (Local API / REST) -> vẫn false, vẫn pending_review, không audit", async () => {
      const id = await createPendingPage("privacy");
      await saveForm(id, { hasEnglish: true, version: "1.1" });
      const page = await readPage(id);
      expect(page.hasEnglish).toBe(false);
      expect(page.version).toBe("1.1");
      expect(page.translation).toMatchObject({ status: "pending_review" });
      expect(await audits("content.approve_translation", id)).toHaveLength(0);
      const viaRest = await handleEndpoints({
        config: payload.config,
        request: new Request(`http://localhost/api/pages/${id}?locale=vi`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `JWT ${tokens.admin}` },
          body: JSON.stringify({ hasEnglish: true }),
        }),
      });
      expect(viaRest.status).toBe(200);
      expect((await readPage(id)).hasEnglish).toBe(false);
      expect(await audits("content.approve_translation", id)).toHaveLength(0);
    });

    it("trang đã duyệt, AI dịch lại (force) -> hasEnglish false + pending_review, làm mới /en và /vi; form cũ còn hasEnglish true lưu lại KHÔNG tự duyệt; duyệt bằng lệnh -> true + audit lần 2", async () => {
      const id = await createPendingPage("privacy");
      expect((await approve(id, tokens.admin)).status).toBe(200);

      const revalidated: string[][] = [];
      expect(await runTranslation("pages", id, true, revalidated)).toMatchObject({ outcome: "translated" });
      const lowered = await readPage(id);
      expect(lowered.hasEnglish).toBe(false);
      expect(lowered.translation).toMatchObject({ status: "pending_review", enSource: "ai" });
      expect(revalidated.flat()).toEqual(expect.arrayContaining(["/en/chinh-sach-bao-mat", "/vi/chinh-sach-bao-mat"]));

      // Form mở sẵn từ trước khi job hạ: còn mang hasEnglish = true, admin chỉ nâng phiên bản rồi Lưu.
      await saveForm(id, { version: "1.2", hasEnglish: true });
      const afterSave = await readPage(id);
      expect(afterSave.hasEnglish).toBe(false);
      expect(afterSave.translation).toMatchObject({ status: "pending_review" });
      expect(await audits("content.approve_translation", id)).toHaveLength(1);

      expect((await approve(id, tokens.admin)).status).toBe(200);
      const approved = await readPage(id);
      expect(approved.hasEnglish).toBe(true);
      expect(approved.translation).toMatchObject({ status: "done" });
      expect(await audits("content.approve_translation", id)).toHaveLength(2);
    });

    it("trang đã duyệt, admin sửa bản Việt (tự dịch, job không force) -> hasEnglish false + pending_review", async () => {
      const id = await createPendingPage("terms");
      expect((await approve(id, tokens.admin)).status).toBe(200);
      await saveForm(id, { content: lexical("Nội dung đã sửa") });
      expect(await runTranslation("pages", id, false)).toMatchObject({ outcome: "translated" });
      const page = await readPage(id);
      expect(page.hasEnglish).toBe(false);
      expect(page.translation).toMatchObject({ status: "pending_review", enSource: "ai" });
    });

    /** Trang chưa từng được dịch: bản EN do admin nhập tay (status none, không enSource). */
    async function createManualEnglishPage(kind: "privacy" | "terms", english: Record<string, unknown> = { title: "Policy", content: lexical("Content") }) {
      await payload.delete({ collection: "pages", where: { kind: { equals: kind } }, overrideAccess: true, trash: true });
      const page = await payload.create({
        collection: "pages",
        data: { kind, title: "Chính sách", content: lexical("Nội dung"), version: "1.0", effectiveDate: "2026-10-01T00:00:00.000Z", status: "published" } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      if (Object.keys(english).length > 0) await payload.update({ collection: "pages", id: page.id, data: english as never, locale: "en", overrideAccess: true, depth: 0 });
      return String(page.id);
    }

    it("bản EN admin sửa tay (status none) -> duyệt được: hasEnglish true, audit, status done", async () => {
      const id = await createManualEnglishPage("privacy");
      expect((await readPage(id)).translation).toMatchObject({ status: "none" });
      expect((await approve(id, tokens.admin)).status).toBe(200);
      const page = await readPage(id);
      expect(page.hasEnglish).toBe(true);
      expect(page.translation).toMatchObject({ status: "done" });
      expect(await audits("content.approve_translation", id)).toHaveLength(1);
    });

    it("thiếu trường EN bắt buộc -> 422 kèm danh sách trường, không đổi gì, không audit", async () => {
      const id = await createManualEnglishPage("terms", { title: "Terms" });
      const response = await approve(id, tokens.admin);
      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.details).toEqual([{ path: ["content"], message: expect.any(String) }]);
      const page = await readPage(id);
      expect(page.hasEnglish).toBe(false);
      expect(page.translation).toMatchObject({ status: "none" });
      expect(await audits("content.approve_translation", id)).toHaveLength(0);
      const empty = await createManualEnglishPage("privacy", {});
      const noEnglish = await approve(empty, tokens.admin);
      expect(noEnglish.status).toBe(422);
      expect((await noEnglish.json()).details.map((detail: { path: string[] }) => detail.path[0])).toEqual(["title", "content"]);
    });

    it("dịch tự động tắt (site-settings) -> vẫn duyệt được bản EN nhập tay", async () => {
      const id = await createManualEnglishPage("privacy");
      const setEnabled = (enabled: boolean) => payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI", translationEnabled: enabled } as never, locale: "vi", overrideAccess: true, depth: 0 });
      await setEnabled(false);
      try {
        expect((await approve(id, tokens.admin)).status).toBe(200);
      } finally {
        await setEnabled(true);
      }
      expect((await readPage(id)).hasEnglish).toBe(true);
    });

    it("ghi audit lỗi -> 500 và lần duyệt rollback (hasEnglish vẫn false, status không đổi)", async () => {
      const id = await createPendingPage("terms");
      await execute(sql`ALTER TABLE audit_logs RENAME TO audit_logs_tmp_broken`);
      try {
        expect((await approve(id, tokens.admin)).status).toBe(500);
      } finally {
        await execute(sql`ALTER TABLE audit_logs_tmp_broken RENAME TO audit_logs`);
      }
      const page = await readPage(id);
      expect(page.hasEnglish).toBe(false);
      expect(page.translation).toMatchObject({ status: "pending_review" });
      expect(await audits("content.approve_translation", id)).toHaveLength(0);
    });

    it("trang đã xoá mềm -> 404, không đổi", async () => {
      const id = await createPendingPage("privacy");
      await payload.update({ collection: "pages", id, data: { deletedAt: new Date().toISOString() } as never, overrideAccess: true, depth: 0 });
      expect((await approve(id, tokens.admin)).status).toBe(404);
      expect(await audits("content.approve_translation", id)).toHaveLength(0);
    });

    it("collection khác (news) vẫn tự bật hasEnglish khi dịch xong và đủ trường EN", async () => {
      const doc = await createNews(saleA.id);
      const id = String(doc.id);
      expect(await runTranslation("news", id, false)).toMatchObject({ outcome: "translated" });
      expect(((await payload.findByID({ collection: "news", id, locale: "vi", overrideAccess: true, depth: 0 })) as { hasEnglish?: boolean }).hasEnglish).toBe(true);
    });

    it("cấu hình: hasEnglish của pages chỉ đọc trong form (duyệt qua nút), như mọi collection khác", () => {
      const hasEnglishOf = (slug: "pages" | "news") =>
        payload.collections[slug].config.fields.find((field) => "name" in field && field.name === "hasEnglish") as { admin?: { readOnly?: boolean } };
      expect(hasEnglishOf("pages").admin?.readOnly).toBe(true);
      expect(hasEnglishOf("news").admin?.readOnly).toBe(true);
    });
  });
});
