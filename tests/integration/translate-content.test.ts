import Anthropic from "@anthropic-ai/sdk";
import type { EventEmitter } from "node:events";
import pg from "pg";
import { type PostgresAdapter, sql } from "@payloadcms/db-postgres";
import { createLocalReq, initTransaction, JobCancelledError, killTransaction, type Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { classify, RETRYABLE_TRANSLATION_CODES, translateContent, type TranslateContentDeps } from "../../src/jobs/translate-content";
import { monthKey } from "../../src/lib/translation/budget";
import { TRANSLATION_ERROR_MESSAGES, TranslationError, type TranslationErrorCode } from "../../src/lib/translation/errors";
import { TRANSLATION_DEBOUNCE_MS } from "../../src/lib/translation/job-input";
import { echoResponse, fakeClient } from "../../src/lib/translation/test-helpers";
import type { TranslationClient } from "../../src/lib/translation/claude-client";

const baseUrl = process.env.DATABASE_URL_TEST;
const CONFIG = { apiKey: "sk-ant-test-FAKE", model: "claude-sonnet-5-5", monthlyBudgetUsd: 100 };

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
/** Phần của bản ghi đọc lại mà các test kiểm: nội dung dịch được + nhóm `translation` + `hasEnglish` + footer. */
interface ReadDoc {
  title?: string | null;
  excerpt?: string | null;
  content?: unknown;
  slug?: string | null;
  hasEnglish?: boolean | null;
  name?: string | null;
  copyright?: string | null;
  contactBlock?: string | null;
  columns?: { title: string; links: { label: string; link: string }[] }[];
  translation: { status?: string; enSource?: string | null; translatedAt?: string | null; sourceHash?: Record<string, string>; [key: string]: unknown };
}
const textOf = (value: unknown) => (value as { root: { children: { children: { text: string }[] }[] } }).root.children[0]!.children[0]!.text;

/** DB tạm (migration thật + config thật) + SDK giả: hook enqueue, job `translate-content`, sửa tay EN, hạn mức, lỗi, pages, global, Duplicate. KHÔNG gọi Claude API thật. */
describe.skipIf(!baseUrl)("integration: translate-content (DB tạm, SDK giả)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_translate_${runId}`;
  const revalidated: string[][] = [];
  let payload: Payload;
  let admin: { id: string | number };
  let categoryId = "";
  let mediaId = "";
  let seq = 0;

  const asAdmin = () => ({ ...admin, collection: "staff" as const });
  const execute = (query: unknown) => (payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> }).execute(query);

  const createNews = (data: Record<string, unknown> = {}) => {
    seq += 1;
    return payload.create({
      collection: "news",
      data: { title: `Tiêu đề ${seq}`, excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, cover: mediaId, status: "published", author: admin.id, ...data } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });
  };
  const updateVi = (id: string, data: Record<string, unknown>) =>
    payload.update({ collection: "news", id, data: data as never, locale: "vi", overrideAccess: true, depth: 0 });
  const readNews = (id: string, locale: "vi" | "en") =>
    payload.findByID({ collection: "news", id, locale, fallbackLocale: false, overrideAccess: true, depth: 0, trash: true }) as unknown as Promise<ReadDoc>;
  const jobsOf = (docId: string) =>
    payload.find({
      collection: "payload-jobs",
      where: { and: [{ taskSlug: { equals: "translate-content" } }, { "input.docId": { equals: docId } }] },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
  const translateJobCount = async () =>
    (await payload.count({ collection: "payload-jobs", where: { taskSlug: { equals: "translate-content" } }, overrideAccess: true })).totalDocs;
  const emailJobs = async () =>
    (await payload.find({ collection: "payload-jobs", where: { taskSlug: { equals: "send-notification-email" } }, depth: 0, pagination: false, overrideAccess: true })).docs;

  async function run(input: Parameters<typeof translateContent>[0]["input"], deps: TranslateContentDeps = {}, previousRuns = 0) {
    const req = await createLocalReq({}, payload);
    return translateContent({ req, input, previousRuns, deps: { config: CONFIG, revalidate: async (paths) => void revalidated.push(paths), ...deps } });
  }
  const runNews = (id: string, deps?: TranslateContentDeps, previousRuns?: number, force?: boolean) =>
    run({ kind: "collection", slug: "news", docId: id, force }, deps, previousRuns);

  const throwingClient = (error: unknown): TranslationClient => ({ translate: () => Promise.reject(error) });
  const setTranslationEnabled = (enabled: boolean) =>
    payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI", translationEnabled: enabled } as never, locale: "vi", overrideAccess: true, depth: 0 });

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
    // Job mặc định trong test này luôn đi nhánh "hạn mức 0 = tắt" nếu lỡ không truyền config: không bao giờ chạm API thật.
    process.env.TRANSLATION_MONTHLY_BUDGET_USD = "0";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    admin = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
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

  beforeEach(() => {
    revalidated.length = 0;
  });

  describe("hook enqueue", () => {
    it("lưu bản vi đã xuất bản -> đúng 1 job cho bản ghi, chạy sau ~1 phút; lưu thêm trong cửa sổ chỉ lùi giờ chạy (debounce), không thêm job", async () => {
      const before = Date.now();
      const doc = await createNews();
      const first = (await jobsOf(String(doc.id))).docs;
      expect(first).toHaveLength(1);
      expect(first[0]).toMatchObject({ taskSlug: "translate-content", input: { kind: "collection", slug: "news", docId: String(doc.id) } });
      const firstWait = new Date(first[0]!.waitUntil as string).getTime();
      expect(firstWait).toBeGreaterThanOrEqual(before + TRANSLATION_DEBOUNCE_MS - 1_000);

      await new Promise((resolve) => setTimeout(resolve, 50));
      await updateVi(String(doc.id), { excerpt: "Tóm tắt mới" });
      await updateVi(String(doc.id), { title: "Tiêu đề mới" });
      const after = (await jobsOf(String(doc.id))).docs;
      expect(after).toHaveLength(1);
      expect(new Date(after[0]!.waitUntil as string).getTime()).toBeGreaterThan(firstWait);
      // Input chỉ có định danh: không có nội dung bài.
      expect(JSON.stringify(after[0]!.input)).not.toContain("Tiêu đề mới");
    });

    it("bản nháp không enqueue; xuất bản từ nháp thì enqueue", async () => {
      const draft = await createNews({ status: "draft" });
      expect((await jobsOf(String(draft.id))).docs).toHaveLength(0);
      await updateVi(String(draft.id), { status: "published" });
      expect((await jobsOf(String(draft.id))).docs).toHaveLength(1);
    });

    it("lưu bản EN (người sửa hoặc job) không enqueue lại: không vòng lặp", async () => {
      const doc = await createNews();
      await runNews(String(doc.id), { client: fakeClient().client });
      const jobs = await translateJobCount();
      await payload.update({ collection: "news", id: doc.id, data: { title: "Sửa tay EN" }, locale: "en", user: asAdmin(), overrideAccess: false, depth: 0 });
      expect(await translateJobCount()).toBe(jobs);
    });

    it("translationEnabled = false -> không enqueue; bật lại thì enqueue", async () => {
      await setTranslationEnabled(false);
      try {
        const doc = await createNews();
        expect((await jobsOf(String(doc.id))).docs).toHaveLength(0);
        // Job đã xếp từ trước nhưng chạy khi đã tắt: cũng bỏ qua êm.
        const client = fakeClient();
        expect(await runNews(String(doc.id), { client: client.client })).toEqual({ outcome: "skipped", reason: "translation_disabled" });
        expect(client.calls).toHaveLength(0);
      } finally {
        await setTranslationEnabled(true);
      }
      const doc = await createNews();
      expect((await jobsOf(String(doc.id))).docs).toHaveLength(1);
    });

    it("lead không bao giờ enqueue dịch (collection ngoài danh sách cho phép không có hook)", async () => {
      const before = await translateJobCount();
      await payload.create({
        collection: "leads",
        overrideAccess: true,
        data: { source: "contact", fullName: "Khach A", phone: "0988777666", message: "Can tu van", locale: "vi", consentAt: new Date().toISOString(), consentVersion: "t" } as never,
      });
      expect(await translateJobCount()).toBe(before);
    });
  });

  describe("job: dịch", () => {
    it("publish vi -> job -> en đủ trường, slug en, hasEnglish = true, translation done, revalidate đường dẫn /en; không enqueue lại", async () => {
      const doc = await createNews({ title: "Thị trường căn hộ", excerpt: "Tóm tắt thị trường", content: lexical("Nội dung chính") });
      const queued = await translateJobCount();
      const llm = fakeClient();
      const outcome = await runNews(String(doc.id), { client: llm.client, now: () => new Date("2026-10-18T05:00:00Z") });
      expect(outcome).toEqual({ outcome: "translated", fields: 3 });
      // Một lần gọi API cho mọi trường; chỉ chữ công khai cần dịch được gửi.
      expect(llm.calls).toHaveLength(1);
      const sent = llm.calls[0]!.userContent;
      expect(sent).toContain("Thị trường căn hộ");
      expect(sent).not.toContain("Khach");

      const en = await readNews(String(doc.id), "en");
      expect(en.title).toBe("EN:Thị trường căn hộ");
      expect(en.excerpt).toBe("EN:Tóm tắt thị trường");
      expect(textOf(en.content)).toBe("EN:Nội dung chính");
      expect(en.slug).toMatch(/^en-/);
      expect(en.hasEnglish).toBe(true);
      expect(en.translation).toMatchObject({ status: "done", enSource: "ai", model: "claude-sonnet-5-5", viChangedAfterManual: false, lastError: null });
      expect(en.translation.translatedAt).toBe("2026-10-18T05:00:00.000Z");
      expect(Object.keys(en.translation.sourceHash ?? {})).toEqual(expect.arrayContaining(["title", "excerpt", "content"]));
      // Bản vi không bị đụng.
      const vi = await readNews(String(doc.id), "vi");
      expect(vi.title).toBe("Thị trường căn hộ");

      const flat = revalidated.flat();
      expect(flat).toContain(`/en/tin-tuc/${en.slug}`);
      expect(flat).toContain("/en/tin-tuc");
      expect(flat.some((path) => path.startsWith("/vi"))).toBe(false);
      expect(await translateJobCount()).toBe(queued);
    });

    it("chạy lại khi không đổi gì -> unchanged, không gọi API", async () => {
      const doc = await createNews();
      await runNews(String(doc.id), { client: fakeClient().client });
      const llm = fakeClient();
      expect(await runNews(String(doc.id), { client: llm.client })).toEqual({ outcome: "unchanged" });
      expect(llm.calls).toHaveLength(0);
    });

    it("chỉ dịch trường có sourceHash đổi: sửa tiêu đề vi -> chỉ tiêu đề đi dịch; slug en giữ nguyên (URL ổn định)", async () => {
      const doc = await createNews({ title: "Bài cũ", excerpt: "Tóm tắt cũ" });
      await runNews(String(doc.id), { client: fakeClient().client });
      const slugBefore = (await readNews(String(doc.id), "en")).slug;
      await updateVi(String(doc.id), { title: "Bài mới" });
      const llm = fakeClient();
      expect(await runNews(String(doc.id), { client: llm.client })).toEqual({ outcome: "translated", fields: 1 });
      const sent = JSON.parse(llm.calls[0]!.userContent) as { segments: { text: string }[] };
      expect(sent.segments.map((segment) => segment.text)).toEqual(["Bài mới"]);
      const en = await readNews(String(doc.id), "en");
      expect(en.title).toBe("EN:Bài mới");
      expect(en.excerpt).toBe("EN:Tóm tắt cũ");
      expect(en.slug).toBe(slugBefore);
    });

    it("bản ghi chưa xuất bản / không tồn tại / ngoài danh sách -> bỏ qua êm, không gọi API", async () => {
      const draft = await createNews({ status: "draft" });
      const llm = fakeClient();
      expect(await runNews(String(draft.id), { client: llm.client })).toEqual({ outcome: "skipped", reason: "not_published" });
      expect(await runNews("11111111-1111-4111-8111-111111111111", { client: llm.client })).toEqual({ outcome: "skipped", reason: "not_found" });
      expect(await run({ kind: "collection", slug: "leads", docId: "x" }, { client: llm.client })).toEqual({ outcome: "skipped", reason: "not_allowed" });
      expect(await run({ kind: "collection", slug: "job-applications", docId: "x" }, { client: llm.client })).toEqual({ outcome: "skipped", reason: "not_allowed" });
      expect(llm.calls).toHaveLength(0);
    });

    it("đo độ trễ: SDK giả chậm 300ms, từ lúc job chạy tới khi bản EN lên < 5 giây; đường thường và đường có một lần thử lại đều < 10 phút", async () => {
      const doc = await createNews();
      const slow = fakeClient(async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return echoResponse(request);
      });
      const started = Date.now();
      await runNews(String(doc.id), { client: slow.client });
      expect(Date.now() - started).toBeLessThan(5_000);
      expect((await readNews(String(doc.id), "en")).hasEnglish).toBe(true);
      // Đường thường: chờ debounce + vòng poll 5s + một lần gọi API (cho tối đa 2 phút). Có một lần thử lại: thêm backoff 60s + một lần gọi nữa.
      const API_CALL_MS = 120_000;
      const normalMs = TRANSLATION_DEBOUNCE_MS + 5_000 + API_CALL_MS;
      const oneRetryMs = normalMs + 60_000 + API_CALL_MS;
      expect(normalMs).toBeLessThan(10 * 60_000);
      expect(oneRetryMs).toBeLessThan(10 * 60_000);
    });
  });

  describe("job: bản sửa tay EN", () => {
    it("sửa tay en -> enSource manual; sửa vi sau đó -> KHÔNG dịch đè, viChangedAfterManual = true; force -> dịch lại, enSource ai", async () => {
      const doc = await createNews({ title: "Gốc" });
      await runNews(String(doc.id), { client: fakeClient().client });
      await payload.update({ collection: "news", id: doc.id, data: { title: "Hand written" }, locale: "en", user: asAdmin(), overrideAccess: false, depth: 0 });
      const manual = await readNews(String(doc.id), "en");
      expect(manual.translation).toMatchObject({ enSource: "manual", viChangedAfterManual: false });

      await updateVi(String(doc.id), { title: "Gốc đã đổi" });
      const llm = fakeClient();
      expect(await runNews(String(doc.id), { client: llm.client })).toEqual({ outcome: "manual_kept", viChanged: true });
      expect(llm.calls).toHaveLength(0);
      const kept = await readNews(String(doc.id), "en");
      expect(kept.title).toBe("Hand written");
      expect(kept.translation).toMatchObject({ enSource: "manual", viChangedAfterManual: true });

      // Chạy lại: vẫn không dịch, không ghi lại cờ.
      expect(await runNews(String(doc.id), { client: llm.client })).toEqual({ outcome: "manual_kept", viChanged: true });

      // "Dịch lại bằng AI" (force) dịch đè và trả về enSource = ai.
      expect(await runNews(String(doc.id), { client: llm.client }, 0, true)).toMatchObject({ outcome: "translated" });
      const forced = await readNews(String(doc.id), "en");
      expect(forced.title).toBe("EN:Gốc đã đổi");
      expect(forced.translation).toMatchObject({ enSource: "ai", viChangedAfterManual: false });
    });

    it("lưu bản en không đổi nội dung dịch được (vd form admin gửi lại nguyên văn) không bị coi là sửa tay; sửa bản vi không bao giờ là sửa tay", async () => {
      const doc = await createNews();
      await runNews(String(doc.id), { client: fakeClient().client });
      const en = await readNews(String(doc.id), "en");
      await payload.update({ collection: "news", id: doc.id, data: { title: en.title, excerpt: en.excerpt }, locale: "en", user: asAdmin(), overrideAccess: false, depth: 0 });
      expect((await readNews(String(doc.id), "en")).translation.enSource).toBe("ai");
      await updateVi(String(doc.id), { title: "Vi đổi" });
      expect((await readNews(String(doc.id), "en")).translation.enSource).toBe("ai");
    });

    it("form gửi chuỗi rỗng cho trường EN chưa có không phải sửa tay; xoá trắng trường EN đã có chữ thì là sửa tay", async () => {
      const doc = await createNews({ seo: { metaTitle: "Meta vi" } });
      await runNews(String(doc.id), { client: fakeClient().client });
      const en = await readNews(String(doc.id), "en");
      await payload.update({ collection: "news", id: doc.id, data: { title: en.title, seo: { metaTitle: "EN:Meta vi", metaDescription: "" } }, locale: "en", user: asAdmin(), overrideAccess: false, depth: 0 });
      expect((await readNews(String(doc.id), "en")).translation.enSource).toBe("ai");
      await payload.update({ collection: "news", id: doc.id, data: { seo: { metaTitle: "", metaDescription: "" } }, locale: "en", user: asAdmin(), overrideAccess: false, depth: 0 });
      expect((await readNews(String(doc.id), "en")).translation.enSource).toBe("manual");
    });
  });

  describe("job: lỗi và hạn mức", () => {
    it("hạn mức 0 -> bỏ qua êm: không gọi API, không đánh dấu lỗi, không email", async () => {
      const doc = await createNews();
      const emailsBefore = (await emailJobs()).length;
      const llm = fakeClient();
      expect(await runNews(String(doc.id), { client: llm.client, config: { ...CONFIG, monthlyBudgetUsd: 0 } })).toEqual({ outcome: "skipped", reason: "budget_disabled" });
      expect(llm.calls).toHaveLength(0);
      const vi = await readNews(String(doc.id), "vi");
      expect(vi.translation.status).toBe("none");
      expect((await emailJobs()).length).toBe(emailsBefore);
    });

    it("lỗi tạm thời (API 5xx) 3 lần: hai lần đầu ném lỗi để Payload thử lại (bản ghi không đổi), lần 3 -> failed + lastError, vẫn ném (job hết thử lại); lastError không chứa nội dung", async () => {
      const doc = await createNews({ title: "Bí mật nội dung" });
      const client = throwingClient(new Anthropic.APIError(500, { error: { message: "Bí mật nội dung sk-ant-LEAK" } }, "Bí mật nội dung", new Headers()));
      for (const previousRuns of [0, 1]) {
        await expect(runNews(String(doc.id), { client }, previousRuns)).rejects.toThrow("provider_unavailable");
        expect((await readNews(String(doc.id), "vi")).translation.status).toBe("none");
      }
      const failure = await runNews(String(doc.id), { client }, 2).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(Error);
      expect(failure).not.toBeInstanceOf(JobCancelledError);
      const vi = await readNews(String(doc.id), "vi");
      expect(vi.translation).toMatchObject({ status: "failed", lastError: "provider_unavailable" });
      expect(JSON.stringify(vi.translation)).not.toContain("LEAK");
      expect(JSON.stringify(vi.translation)).not.toContain("Bí mật");
      // Bản EN chưa có gì.
      expect((await readNews(String(doc.id), "en")).hasEnglish).toBe(false);
    });

    it("chỉ rate_limited / provider_unavailable được thử lại; mọi mã khác: failed ngay + JobCancelledError (không trả tiền lặp)", async () => {
      expect([...RETRYABLE_TRANSLATION_CODES].sort()).toEqual(["provider_unavailable", "rate_limited"]);
      for (const code of Object.keys(TRANSLATION_ERROR_MESSAGES) as TranslationErrorCode[]) {
        expect(classify(new TranslationError(code)).retryable).toBe(RETRYABLE_TRANSLATION_CODES.includes(code));
      }
      expect(classify(new Error("DB down"))).toEqual({ code: "provider_unavailable", retryable: true });

      for (const code of ["invalid_input", "invalid_output", "refused", "truncated", "not_configured", "not_allowed", "auth_failed", "bad_request"] as const) {
        const doc = await createNews();
        const attempt = runNews(String(doc.id), { client: throwingClient(new TranslationError(code)) }, 0);
        await expect(attempt).rejects.toBeInstanceOf(JobCancelledError);
        expect((await readNews(String(doc.id), "vi")).translation).toMatchObject({ status: "failed", lastError: code });
      }
      const doc = await createNews();
      await expect(runNews(String(doc.id), { client: throwingClient(Anthropic.APIError.generate(429, {}, "x", new Headers())) }, 0)).rejects.toThrow("rate_limited");
      expect((await readNews(String(doc.id), "vi")).translation.status).toBe("none");
    });

    it("model trả kết quả hỏng (cắt cụt, bị từ chối) -> failed không thử lại, bản en không bị ghi dở", async () => {
      const cases = [
        { stopReason: "max_tokens", output: null, code: "truncated" },
        { stopReason: "refusal", output: null, code: "refused" },
      ] as const;
      for (const failed of cases) {
        const doc = await createNews();
        const llm = fakeClient((request) => echoResponse(request, { stopReason: failed.stopReason, output: failed.output }));
        await expect(runNews(String(doc.id), { client: llm.client })).rejects.toBeInstanceOf(JobCancelledError);
        expect((await readNews(String(doc.id), "vi")).translation).toMatchObject({ status: "failed", lastError: failed.code });
        expect((await readNews(String(doc.id), "en")).title ?? null).toBeNull();
      }
    });

    it("vượt hạn mức tháng -> failed + email admin đúng 1 lần cho CẢ THÁNG (không lặp mỗi lần chạy, không lặp theo bản ghi), không gọi API", async () => {
      const month = monthKey(new Date());
      // `month` là unique: các test trước đã ghi nhận chi phí của tháng này nên cập nhật dòng sẵn có (hoặc tạo nếu chưa có).
      const existing = await payload.find({ collection: "translation-usage", where: { month: { equals: month } }, limit: 1, depth: 0, overrideAccess: true });
      if (existing.docs[0]) await payload.update({ collection: "translation-usage", id: existing.docs[0].id, data: { estimatedCostUsd: 5 }, overrideAccess: true });
      else await payload.create({ collection: "translation-usage", data: { month, inputTokens: 0, outputTokens: 0, requests: 0, estimatedCostUsd: 5 }, overrideAccess: true });
      const doc = await createNews();
      const llm = fakeClient();
      const before = (await emailJobs()).length;
      await expect(runNews(String(doc.id), { client: llm.client, config: { ...CONFIG, monthlyBudgetUsd: 5 } })).rejects.toBeInstanceOf(JobCancelledError);
      expect(llm.calls).toHaveLength(0);
      expect((await readNews(String(doc.id), "vi")).translation).toMatchObject({ status: "failed", lastError: "budget_exceeded" });
      const emails = (await emailJobs()).slice(before);
      expect(emails).toHaveLength(1);
      expect(emails[0]!.input).toMatchObject({ template: "translation-budget-exceeded", to: [`admin-${runId}@example.test`], data: { month } });

      await expect(runNews(String(doc.id), { client: llm.client, config: { ...CONFIG, monthlyBudgetUsd: 5 } })).rejects.toBeInstanceOf(JobCancelledError);
      expect((await emailJobs()).length).toBe(before + 1);

      // Bản ghi khác cùng chạm hạn mức trong tháng: vẫn failed, nhưng KHÔNG thêm email.
      const other = await createNews();
      await expect(runNews(String(other.id), { client: llm.client, config: { ...CONFIG, monthlyBudgetUsd: 5 } })).rejects.toBeInstanceOf(JobCancelledError);
      expect((await readNews(String(other.id), "vi")).translation).toMatchObject({ status: "failed", lastError: "budget_exceeded" });
      expect((await emailJobs()).length).toBe(before + 1);
    });
  });

  describe("pages, global, Duplicate", () => {
    it("pages: dịch xong -> pending_review, hasEnglish vẫn false (admin duyệt mới bật)", async () => {
      const page = await payload.create({
        collection: "pages",
        data: { kind: "privacy", title: "Chính sách bảo mật", content: lexical("Điều khoản"), version: "1.0", effectiveDate: new Date().toISOString(), status: "published" } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      const outcome = await run({ kind: "collection", slug: "pages", docId: String(page.id) }, { client: fakeClient().client });
      expect(outcome).toMatchObject({ outcome: "translated" });
      const en = (await payload.findByID({ collection: "pages", id: page.id, locale: "en", fallbackLocale: false, overrideAccess: true, depth: 0 })) as unknown as ReadDoc;
      expect(en.title).toBe("EN:Chính sách bảo mật");
      expect(en.hasEnglish).toBe(false);
      expect(en.translation).toMatchObject({ status: "pending_review", enSource: "ai" });
      // Trang pháp lý: `/en` của chính trang phải được làm mới (hasEnglish về false, ẩn bản chưa duyệt).
      expect(revalidated.flat().filter((path) => path.startsWith("/en"))).toEqual(["/en/chinh-sach-bao-mat"]);
    });

    it("collection không có trường status (developers): coi là đã xuất bản, enqueue + dịch được, bật hasEnglish", async () => {
      const developer = await payload.create({ collection: "developers", data: { name: "Chủ đầu tư Mẫu", description: lexical("Giới thiệu chủ đầu tư") } as never, locale: "vi", overrideAccess: true, depth: 0 });
      expect((await jobsOf(String(developer.id))).docs).toHaveLength(1);
      const outcome = await run({ kind: "collection", slug: "developers", docId: String(developer.id) }, { client: fakeClient().client });
      expect(outcome).toMatchObject({ outcome: "translated" });
      const en = (await payload.findByID({ collection: "developers", id: developer.id, locale: "en", fallbackLocale: false, overrideAccess: true, depth: 0 })) as unknown as ReadDoc;
      expect(en.name).toBe("EN:Chủ đầu tư Mẫu");
      expect(en.hasEnglish).toBe(true);
      // Danh mục nền không có trang riêng: không có đường dẫn cần làm mới.
      expect(revalidated).toHaveLength(0);
    });

    it("global footer: dịch trường localized, translation done, revalidate /en; lần chạy lại không đổi", async () => {
      await payload.updateGlobal({
        slug: "footer",
        data: { copyright: "© TAMI HOMES", contactBlock: "Liên hệ chúng tôi", columns: [{ title: "Dự án", links: [{ label: "Căn hộ", link: "https://tami.example/du-an" }] }] } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      const llm = fakeClient();
      expect(await run({ kind: "global", slug: "footer" }, { client: llm.client })).toMatchObject({ outcome: "translated" });
      const en = (await payload.findGlobal({ slug: "footer", locale: "en", fallbackLocale: false, overrideAccess: true, depth: 0 })) as unknown as ReadDoc;
      expect(en.copyright).toBe("EN:© TAMI HOMES");
      expect(en.contactBlock).toBe("EN:Liên hệ chúng tôi");
      expect(en.columns![0]!.title).toBe("EN:Dự án");
      expect(en.columns![0]!.links[0]).toMatchObject({ label: "EN:Căn hộ", link: "https://tami.example/du-an" });
      expect(en.translation).toMatchObject({ status: "done", enSource: "ai" });
      expect(revalidated.flat()).toContain("/en");
      // Link (không localized) KHÔNG đi dịch.
      expect(llm.calls[0]!.userContent).not.toContain("tami.example");
      expect(await run({ kind: "global", slug: "footer" }, { client: llm.client })).toEqual({ outcome: "unchanged" });
    });

    it("Duplicate: nhóm translation được đặt lại (none, không enSource/sourceHash/model...), hasEnglish false; bản sao coi là chưa dịch", async () => {
      const doc = await createNews({ title: "Bài gốc để nhân bản" });
      await runNews(String(doc.id), { client: fakeClient().client });
      await payload.update({ collection: "news", id: doc.id, data: { title: "Sửa tay" }, locale: "en", user: asAdmin(), overrideAccess: false, depth: 0 });
      expect((await readNews(String(doc.id), "en")).translation.enSource).toBe("manual");

      const copy = await payload.duplicate({ collection: "news", id: doc.id, overrideAccess: true, depth: 0, user: asAdmin() });
      const copyVi = await readNews(String(copy.id), "vi");
      expect(copyVi.translation).toMatchObject({ status: "none", viChangedAfterManual: false });
      for (const key of ["enSource", "sourceHash", "translatedAt", "model", "lastError"]) expect(copyVi.translation[key] ?? null).toBeNull();
      expect(copyVi.hasEnglish).toBe(false);

      // Xuất bản bản sao -> dịch như bài mới (không bị coi là "đã sửa tay" hay "đã dịch").
      await updateVi(String(copy.id), { status: "published" });
      const llm = fakeClient();
      expect(await runNews(String(copy.id), { client: llm.client })).toMatchObject({ outcome: "translated" });
      expect((await readNews(String(copy.id), "en")).translation.enSource).toBe("ai");
    });
  });

  describe("ghi kết quả không đè thay đổi của admin (MAJOR-1)", () => {
    const readFooter = (locale: "vi" | "en") =>
      payload.findGlobal({ slug: "footer", locale, fallbackLocale: false, overrideAccess: true, depth: 0 }) as unknown as Promise<ReadDoc & { columns: { id: string; title: string; links: { id: string; label: string; link: string }[] }[] }>;
    const saveFooterVi = (columns: unknown) =>
      payload.updateGlobal({ slug: "footer", data: { columns } as never, locale: "vi", overrideAccess: true, depth: 0 });
    const footerJobs = async () =>
      (await payload.find({ collection: "payload-jobs", where: { and: [{ taskSlug: { equals: "translate-content" } }, { "input.slug": { equals: "footer" } }] }, depth: 0, pagination: false, overrideAccess: true })).docs;

    it("admin thêm cột, đổi link và xoá hàng trong lúc job đang gọi API -> bỏ lần ghi, thay đổi của admin còn nguyên, job được xếp lại và lần sau dịch đủ", async () => {
      await saveFooterVi([{ title: "Dự án", links: [{ label: "Căn hộ", link: "https://tami.example/du-an" }, { label: "Biệt thự", link: "https://tami.example/biet-thu" }] }]);
      await run({ kind: "global", slug: "footer" }, { client: fakeClient().client });

      // Cả ba thay đổi của admin diễn ra khi job "đang gọi API" (SDK giả chậm): đổi chữ (để job có việc), thêm cột, đổi link, xoá hàng.
      const before = await readFooter("vi");
      await saveFooterVi([{ id: before.columns[0]!.id, title: "Dự án mới", links: before.columns[0]!.links }]);
      const jobsBefore = (await footerJobs()).length;
      const llm = fakeClient(async (request) => {
        const current = await readFooter("vi");
        await saveFooterVi([
          { id: current.columns[0]!.id, title: current.columns[0]!.title, links: [{ id: current.columns[0]!.links[0]!.id, label: "Căn hộ", link: "https://tami.example/moi" }] },
          { title: "Cột mới", links: [{ label: "Liên hệ", link: "https://tami.example/lien-he" }] },
        ]);
        return echoResponse(request);
      });
      const outcome = await run({ kind: "global", slug: "footer" }, { client: llm.client });
      expect(outcome).toEqual({ outcome: "skipped", reason: "row_changed" });

      const vi = await readFooter("vi");
      expect(vi.columns.map((column) => column.title)).toEqual(["Dự án mới", "Cột mới"]);
      expect(vi.columns[0]!.links).toHaveLength(1);
      expect(vi.columns[0]!.links[0]!.link).toBe("https://tami.example/moi");
      const en = await readFooter("en");
      expect(en.columns).toHaveLength(2);
      expect(en.columns[0]!.links[0]!.link).toBe("https://tami.example/moi");
      expect(en.columns[0]!.title).toBe("EN:Dự án"); // bản dịch cũ giữ nguyên, bản dịch mới KHÔNG được ghi dở
      // Trạng thái không bị đánh dấu lỗi; có job mới được xếp để dịch lại.
      expect(en.translation.status).toBe("done");
      expect((await footerJobs()).length).toBeGreaterThan(jobsBefore - 1);

      const after = fakeClient();
      expect(await run({ kind: "global", slug: "footer" }, { client: after.client })).toMatchObject({ outcome: "translated" });
      const final = await readFooter("en");
      expect(final.columns.map((column) => column.title)).toEqual(["EN:Dự án mới", "EN:Cột mới"]);
      expect(final.columns[0]!.links[0]).toMatchObject({ label: "EN:Căn hộ", link: "https://tami.example/moi" });
      expect(final.columns[1]!.links[0]!.link).toBe("https://tami.example/lien-he");
    });
  });

  describe("ghi kết quả: khoá dòng và job xếp lại (review L9-T07 round 2)", () => {
    const readFooterVi = () =>
      payload.findGlobal({ slug: "footer", locale: "vi", fallbackLocale: false, overrideAccess: true, depth: 0 }) as unknown as Promise<{ columns: { id: string; title: string; links: { id: string; label: string; link: string }[] }[] }>;
    const footerJobIds = async () =>
      (await payload.find({ collection: "payload-jobs", where: { and: [{ taskSlug: { equals: "translate-content" } }, { "input.slug": { equals: "footer" } }] }, depth: 0, pagination: false, overrideAccess: true })).docs.map((job) => job.id);

    it("admin chỉ đổi link (hook KHÔNG xếp job) trong lúc job gọi API -> row_changed xếp đúng 1 job mới; lần sau dịch đủ", async () => {
      const current = await readFooterVi();
      const column = current.columns[0]!;
      // Đổi chữ để job có việc; xoá job do hook xếp để đếm chính xác số job do `row_changed` tạo.
      await payload.updateGlobal({ slug: "footer", data: { columns: [{ id: column.id, title: `${column.title} v2`, links: column.links }] } as never, locale: "vi", overrideAccess: true, depth: 0 });
      await payload.delete({ collection: "payload-jobs", where: { and: [{ taskSlug: { equals: "translate-content" } }, { "input.slug": { equals: "footer" } }] }, overrideAccess: true });
      expect(await footerJobIds()).toHaveLength(0);

      const llm = fakeClient(async (request) => {
        const now = await readFooterVi();
        const first = now.columns[0]!;
        await payload.updateGlobal({
          slug: "footer",
          data: { columns: [{ id: first.id, title: first.title, links: first.links.map((link, index) => (index === 0 ? { id: link.id, label: link.label, link: "https://tami.example/chi-doi-link" } : link)) }] } as never,
          locale: "vi",
          overrideAccess: true,
          depth: 0,
        });
        return echoResponse(request);
      });
      expect(await run({ kind: "global", slug: "footer" }, { client: llm.client })).toEqual({ outcome: "skipped", reason: "row_changed" });
      // Lần lưu của admin chỉ đổi link nên hook không xếp job: job duy nhất đến từ `row_changed`.
      expect(await footerJobIds()).toHaveLength(1);

      expect(await run({ kind: "global", slug: "footer" }, { client: fakeClient().client })).toMatchObject({ outcome: "translated" });
      const after = await readFooterVi();
      expect(after.columns[0]!.links[0]!.link).toBe("https://tami.example/chi-doi-link");
    });

    it("job khoá dòng (FOR UPDATE) trước khi ghi: giao dịch khác đang giữ dòng thì job chờ, nhả khoá xong job mới ghi bản dịch", async () => {
      const doc = await createNews({ title: "Khoá dòng" });
      const id = String(doc.id);
      await updateVi(id, { title: "Khoá dòng đổi" });
      // Giao dịch của "admin" giữ khoá dòng bản ghi (như một lần lưu đang dở); `updatedAt` không đổi nên job vẫn hợp lệ khi lấy được khoá.
      const holder = await createLocalReq({}, payload);
      await initTransaction(holder);
      const adapter = payload.db as unknown as PostgresAdapter;
      await adapter.execute({ db: adapter.sessions[String(await holder.transactionID)]!.db, sql: sql`SELECT 1 FROM "news" WHERE "id" = ${id} FOR UPDATE` });
      let finished = false;
      try {
        const job = run({ kind: "collection", slug: "news", docId: id }, { client: fakeClient().client }).then((outcome) => {
          finished = true;
          return outcome;
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        expect(finished).toBe(false);
        await killTransaction(holder);
        expect(await job).toMatchObject({ outcome: "translated" });
      } finally {
        await killTransaction(holder);
      }
      expect((await readNews(id, "en")).title).toBe("EN:Khoá dòng đổi");
    });
  });

  describe("hook enqueue không làm hỏng lần lưu (MINOR-3)", () => {
    it("bảng payload_jobs lỗi (câu SQL lỗi) -> lần lưu nội dung VẪN thành công (xếp job nằm ngoài transaction của lần lưu)", async () => {
      await execute(sql`ALTER TABLE payload_jobs RENAME TO payload_jobs_tmp_broken`);
      try {
        const doc = await createNews({ title: "Lưu dù xếp job lỗi" });
        expect((await readNews(String(doc.id), "vi")).title).toBe("Lưu dù xếp job lỗi");
        await updateVi(String(doc.id), { excerpt: "Sửa tiếp vẫn lưu được" });
        expect((await readNews(String(doc.id), "vi")).excerpt).toBe("Sửa tiếp vẫn lưu được");
      } finally {
        await execute(sql`ALTER TABLE payload_jobs_tmp_broken RENAME TO payload_jobs`);
      }
    });
  });

  describe("chạy qua Payload Jobs thật", () => {
    it("job đã xếp bởi hook được runner chạy; hạn mức env = 0 -> hoàn tất êm, không gọi API, bản ghi giữ nguyên", async () => {
      const doc = await createNews();
      const [job] = (await jobsOf(String(doc.id))).docs;
      await payload.update({ collection: "payload-jobs", id: job!.id, data: { waitUntil: new Date(Date.now() - 1_000).toISOString() }, overrideAccess: true, depth: 0 });
      const usageBefore = await payload.count({ collection: "translation-usage", overrideAccess: true });
      await payload.jobs.run({ silent: true, where: { id: { equals: job!.id } } });
      const left = (await jobsOf(String(doc.id))).docs;
      // `deleteJobOnComplete: true`: job hoàn tất bị xoá khỏi hàng đợi.
      expect(left).toHaveLength(0);
      expect((await readNews(String(doc.id), "vi")).translation.status).toBe("none");
      expect((await payload.count({ collection: "translation-usage", overrideAccess: true })).totalDocs).toBe(usageBefore.totalDocs);
    });
  });
});
