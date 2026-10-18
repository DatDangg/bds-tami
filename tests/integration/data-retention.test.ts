import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import type { EventEmitter } from "node:events";
import pg from "pg";
import { sql } from "@payloadcms/db-postgres";
import { createLocalReq, type Payload } from "payload";
import type { OrphanObjectScanMode } from "../../src/lib/env";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { asSystemActivity } from "../../src/hooks/leads/lead-activity-hooks";
import { ANONYMIZED_PLACEHOLDER } from "../../src/lib/leads/lead-values";
import type { Lead } from "../../src/payload-types";

/**
 * Bucket private dùng chung với checkout chính và các worktree khác: test này KHÔNG được liệt kê bucket ngoài vùng prefix của chính nó (bước quét mồ côi
 * xoá theo sự vắng mặt của dòng DB). Mọi lời gọi liệt kê có prefix rỗng/ngoài vùng test (`retention-test-*` hoặc tên file CV do test tạo) làm test FAIL.
 */
const allowedExtraScanPrefixes = new Set<string>();
vi.mock("../../src/lib/private-objects/private-objects", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/private-objects/private-objects")>();
  return {
    ...original,
    listPrivateObjectsPage: (prefix: string, continuationToken?: string) => {
      if (!prefix.startsWith("retention-test-") && !allowedExtraScanPrefixes.has(prefix)) {
        throw new Error("Test không được quét bucket private dùng chung ngoài prefix của test");
      }
      return original.listPrivateObjectsPage(prefix, continuationToken);
    },
  };
});

const baseUrl = process.env.DATABASE_URL_TEST;
const hasS3 = Boolean(process.env.S3_ENDPOINT);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<<>>\nstartxref\n0\n%%EOF\n");
const NOW = new Date("2026-10-18T12:00:00.000Z");
/** Vùng quét object mồ côi không có object nào: các test khác không đụng bucket dùng chung. */
const NO_SCAN_PREFIX = `retention-test-noscan-${randomUUID()}/`;
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
/** Lùi `days` ngày so với NOW giả. */
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
/** Mốc 24 tháng: 18/10/2024 12:00Z; 12 tháng: 18/10/2025 12:00Z. */
const LEAD_CUTOFF = new Date("2024-10-18T12:00:00.000Z");
const APPLICATION_CUTOFF = new Date("2025-10-18T12:00:00.000Z");
const minutes = (date: Date, delta: number) => new Date(date.getTime() + delta * 60_000);

/** DB tạm (migration thật) + SeaweedFS dev thật: job `data-retention` (BR-31) — ẩn danh lead, hồ sơ + xoá CV, CV mồ côi, audit/job log. */
describe.skipIf(!baseUrl || !hasS3)("integration: job data-retention", () => {
  const dbName = `tami_retention_${Date.now().toString(36)}`;
  let payload: Payload;
  let s3: S3Client;
  let privateBucket = "";
  let postingId = "";
  let phoneSeed = 0;

  const exec = (query: unknown) => (payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> }).execute(query);
  const run = async (options: { dryRun?: boolean; now?: Date; scanPrefix?: string; mode?: OrphanObjectScanMode; maxDelete?: number } = {}) => {
    const { runDataRetention } = await import("../../src/lib/retention/run-data-retention");
    // Mặc định quét vùng không có object nào: bucket private dùng chung với worktree/test khác, không được xoá object không do test này tạo.
    return runDataRetention({ payload, now: options.now ?? NOW, dryRun: options.dryRun, orphanObjectScanPrefix: options.scanPrefix ?? NO_SCAN_PREFIX, orphanObjectScanMode: options.mode ?? "delete", orphanObjectMaxDelete: options.maxDelete });
  };

  async function createLead(lastActivityAt: Date, extra: Record<string, unknown> = {}) {
    phoneSeed += 1;
    return payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        source: "contact",
        fullName: `Khach Cu ${phoneSeed}`,
        phone: `09777${String(phoneSeed).padStart(5, "0")}`,
        email: `khach${phoneSeed}@example.test`,
        message: "Can tu van can ho",
        locale: "vi",
        consentAt: lastActivityAt.toISOString(),
        consentVersion: "2026-10-test",
        createdAt: lastActivityAt.toISOString(),
        lastActivityAt: lastActivityAt.toISOString(),
        utm: { source: "facebook" },
        ...extra,
      } as never,
    }) as Promise<Lead>;
  }
  const reloadLead = (id: string) => payload.findByID({ collection: "leads", id, overrideAccess: true, depth: 0, trash: true }) as Promise<Lead>;

  async function createCv() {
    return payload.create({
      collection: "private-files",
      data: {},
      file: { data: PDF, mimetype: "application/pdf", name: "cv.pdf", size: PDF.byteLength },
      overrideAccess: true,
      depth: 0,
    });
  }
  const ageFile = (id: string, createdAt: Date) => exec(sql`UPDATE "private_files" SET "created_at" = ${createdAt.toISOString()} WHERE "id" = ${id}`);

  async function createApplication(createdAt: Date, cvId: string) {
    return payload.create({
      collection: "job-applications",
      overrideAccess: true,
      depth: 0,
      data: {
        jobPosting: postingId,
        fullName: "Nguyen Van Ung Vien",
        phone: "0912345678",
        email: "ungvien@example.test",
        message: "Xin chao, toi muon ung tuyen",
        cv: cvId,
        consentAt: createdAt.toISOString(),
        consentVersion: "2026-10-test",
        locale: "vi",
        status: "hired",
        note: "Ung vien tot, goi lai thu 6",
        ipHash: "ip-hash-gia",
        createdAt: createdAt.toISOString(),
      } as never,
    });
  }
  const reloadApplication = (id: string) => payload.findByID({ collection: "job-applications", id, overrideAccess: true, depth: 0 });
  const fileRow = async (id: string) => (await payload.find({ collection: "private-files", where: { id: { equals: id } }, overrideAccess: true, depth: 0 })).docs[0];

  /** Giả lập S3 từ chối xoá object ở TẦNG CLIENT (mọi `DeleteObjectCommand`: cả client của job lẫn adapter của plugin); lệnh khác chạy thật. */
  function failS3Deletes() {
    const realSend = S3Client.prototype.send as (this: S3Client, command: unknown) => Promise<unknown>;
    return vi.spyOn(S3Client.prototype, "send").mockImplementation(function (this: S3Client, command: unknown) {
      return command instanceof DeleteObjectCommand ? Promise.reject(new Error("s3 down")) : realSend.call(this, command);
    } as never);
  }

  async function objectExists(key: string): Promise<boolean> {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: privateBucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async function createAuditLog(createdAt: Date, summary: string) {
    return payload.create({ collection: "audit-logs", overrideAccess: true, data: { action: "lead.assign", summary, createdAt: createdAt.toISOString() } as never });
  }
  async function createFailedJob(updatedAt: Date, extra: Record<string, unknown> = {}) {
    const job = await payload.create({
      collection: "payload-jobs",
      overrideAccess: true,
      data: { taskSlug: "send-notification-email", queue: "default", hasError: true, processing: false, input: { template: "lead-new", to: ["khach-pii@example.test"] }, ...extra } as never,
    });
    await exec(sql`UPDATE "payload_jobs" SET "updated_at" = ${updatedAt.toISOString()} WHERE "id" = ${job.id}`);
    await exec(sql`INSERT INTO "payload_jobs_log" ("_order", "_parent_id", "id", "executed_at", "completed_at", "task_slug", "task_i_d", "state") VALUES (1, ${job.id}, ${`log-${job.id}`}, now(), now(), 'send-notification-email', '1', 'failed')`);
    return job.id;
  }
  const jobExists = async (id: string) => (await payload.count({ collection: "payload-jobs", where: { id: { equals: id } }, overrideAccess: true })).totalDocs === 1;
  const logCount = async (jobId: string) => Number((await exec(sql`SELECT count(*)::int AS n FROM "payload_jobs_log" WHERE "_parent_id" = ${jobId}`)).rows[0]!.n);

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
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    privateBucket = process.env.S3_BUCKET_PRIVATE ?? "";
    s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
    });
    const author = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `hr-${Date.now().toString(36)}@example.test`, password: "Mat-khau-hop-le-123", fullName: "HR", role: "admin", active: true },
    });
    const category = await payload.create({ collection: "categories", data: { name: "Kinh doanh", scope: "job" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    const posting = await payload.create({
      collection: "job-postings",
      data: {
        title: "Nhân viên kinh doanh",
        description: lexical("Mô tả"),
        requirements: lexical("Yêu cầu"),
        category: category.id,
        employmentType: "full_time",
        deadline: new Date(NOW.getTime() + 30 * 86_400_000).toISOString(),
        status: "published",
      } as never,
      locale: "vi",
      user: { ...author, collection: "staff" as const },
      overrideAccess: true,
      depth: 0,
    });
    postingId = posting.id;
  }, 180_000);

  afterAll(async () => {
    await payload?.delete({ collection: "job-applications", where: { id: { exists: true } }, overrideAccess: true }).catch(() => {});
    await payload?.delete({ collection: "private-files", where: { id: { exists: true } }, overrideAccess: true }).catch(() => {});
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

  it("lead quá 24 tháng (theo lastActivityAt, hoặc createdAt khi thiếu, kể cả đã xoá mềm) bị ẩn danh; lead mới và lead đã ẩn danh giữ nguyên; số liệu còn", async () => {
    const expired = await createLead(minutes(LEAD_CUTOFF, -1), { status: "won" });
    const noActivityDate = await createLead(minutes(LEAD_CUTOFF, -5));
    await exec(sql`UPDATE "leads" SET "last_activity_at" = NULL WHERE "id" = ${noActivityDate.id}`);
    const trashed = await createLead(daysAgo(900));
    await payload.update({ collection: "leads", id: trashed.id, data: { deletedAt: daysAgo(10).toISOString() } as never, overrideAccess: true, trash: true });
    const fresh = await createLead(minutes(LEAD_CUTOFF, 1));
    const already = await createLead(daysAgo(900));
    await payload.update({ collection: "leads", id: already.id, data: { anonymizedAt: daysAgo(400).toISOString() } as never, overrideAccess: true });
    const alreadyBefore = await reloadLead(already.id);
    const activitiesBefore = (await payload.count({ collection: "lead-activities", overrideAccess: true })).totalDocs;
    const leadsBefore = (await payload.count({ collection: "leads", overrideAccess: true, trash: true })).totalDocs;

    const outcome = await run();
    expect(outcome.leadsAnonymized).toBe(3);

    for (const lead of [expired, noActivityDate, trashed]) {
      const after = await reloadLead(lead.id);
      expect(after).toMatchObject({ fullName: ANONYMIZED_PLACEHOLDER, phone: ANONYMIZED_PLACEHOLDER, phoneNormalized: ANONYMIZED_PLACEHOLDER, email: null, message: null });
      expect(after.anonymizedAt).toBe(NOW.toISOString());
      expect(after).toMatchObject({ code: lead.code, source: "contact", status: lead.status, locale: "vi", utm: { source: "facebook" } });
      expect(after.lastActivityAt ?? null).toBe(lead.id === noActivityDate.id ? null : lead.lastActivityAt);
    }
    expect((await reloadLead(expired.id)).status).toBe("won");
    expect((await reloadLead(trashed.id)).deletedAt).toBeTruthy();
    const freshAfter = await reloadLead(fresh.id);
    expect(freshAfter).toMatchObject({ fullName: fresh.fullName, phone: fresh.phone, email: fresh.email, message: fresh.message });
    expect(freshAfter.anonymizedAt ?? null).toBeNull();
    expect(await reloadLead(already.id)).toEqual(alreadyBefore);
    // Lead sát mốc không được làm nhiễu các test sau (handler dùng đồng hồ thật, mốc dịch vài phút).
    await exec(sql`UPDATE "leads" SET "last_activity_at" = ${NOW.toISOString()} WHERE "id" = ${fresh.id}`);
    // Không xoá cứng lead và không đụng lịch sử chăm sóc.
    expect((await payload.count({ collection: "leads", overrideAccess: true, trash: true })).totalDocs).toBe(leadsBefore);
    expect((await payload.count({ collection: "lead-activities", overrideAccess: true })).totalDocs).toBe(activitiesBefore);
  });

  it("dryRun chỉ đếm: không đổi bản ghi, không xoá file/log, không ghi audit; chạy thật sau đó khớp số đếm; chạy lại không làm gì (idempotent)", async () => {
    const lead = await createLead(daysAgo(1000));
    const cv = await createCv();
    const application = await createApplication(daysAgo(500), cv.id);
    const orphan = await createCv();
    await ageFile(orphan.id, daysAgo(3));
    const oldAudit = await createAuditLog(daysAgo(800), "Cu hon 24 thang");
    const failedJob = await createFailedJob(daysAgo(30));
    const auditsBefore = (await payload.count({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, overrideAccess: true })).totalDocs;

    const dry = await run({ dryRun: true });
    expect(dry).toEqual({ dryRun: true, leadsAnonymized: 1, applicationsAnonymized: 1, cvFilesDeleted: 1, orphanCvsDeleted: 1, orphanObjectsDeleted: 0, orphanObjectsFound: 0, failedRecords: 0, auditLogsDeleted: 1, failedJobsDeleted: 1 });
    expect((await reloadLead(lead.id)).anonymizedAt ?? null).toBeNull();
    expect((await reloadApplication(application.id)).anonymizedAt ?? null).toBeNull();
    expect(await fileRow(cv.id)).toBeDefined();
    expect(await objectExists(cv.filename as string)).toBe(true);
    expect(await objectExists(orphan.filename as string)).toBe(true);
    expect(await payload.count({ collection: "audit-logs", where: { id: { equals: oldAudit.id } }, overrideAccess: true })).toMatchObject({ totalDocs: 1 });
    expect(await jobExists(failedJob)).toBe(true);
    expect((await payload.count({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, overrideAccess: true })).totalDocs).toBe(auditsBefore);

    const real = await run();
    expect(real).toEqual({ ...dry, dryRun: false });
    expect(await run()).toEqual({ dryRun: false, leadsAnonymized: 0, applicationsAnonymized: 0, cvFilesDeleted: 0, orphanCvsDeleted: 0, orphanObjectsDeleted: 0, orphanObjectsFound: 0, auditLogsDeleted: 0, failedJobsDeleted: 0, failedRecords: 0 });
    // Lần chạy không đổi gì không ghi thêm audit: chỉ đúng 1 audit cho lần chạy thật.
    expect((await payload.count({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, overrideAccess: true })).totalDocs).toBe(auditsBefore + 1);
  });

  it("hồ sơ quá 12 tháng: ẩn danh bằng giá trị thay thế, cv = null, xoá bản ghi private-files và object S3; hồ sơ mới + CV của nó + tin tuyển dụng giữ nguyên", async () => {
    const expiredCv = await createCv();
    const expired = await createApplication(minutes(APPLICATION_CUTOFF, -1), expiredCv.id);
    const freshCv = await createCv();
    const fresh = await createApplication(minutes(APPLICATION_CUTOFF, 1), freshCv.id);
    expect(await objectExists(expiredCv.filename as string)).toBe(true);
    const postingsBefore = (await payload.count({ collection: "job-postings", overrideAccess: true })).totalDocs;

    const outcome = await run();
    expect(outcome.applicationsAnonymized).toBe(1);
    expect(outcome.cvFilesDeleted).toBe(1);

    const after = await reloadApplication(expired.id);
    expect(after).toMatchObject({
      fullName: ANONYMIZED_PLACEHOLDER,
      phone: ANONYMIZED_PLACEHOLDER,
      email: ANONYMIZED_PLACEHOLDER,
      message: null,
      note: null,
      cv: null,
      status: "hired",
      locale: "vi",
    });
    expect(after.anonymizedAt).toBe(NOW.toISOString());
    expect(await fileRow(expiredCv.id)).toBeUndefined();
    expect(await objectExists(expiredCv.filename as string)).toBe(false);

    const freshAfter = await reloadApplication(fresh.id);
    expect(freshAfter).toMatchObject({ fullName: "Nguyen Van Ung Vien", phone: "0912345678", email: "ungvien@example.test", cv: freshCv.id });
    expect(await objectExists(freshCv.filename as string)).toBe(true);
    expect((await payload.count({ collection: "job-postings", overrideAccess: true })).totalDocs).toBe(postingsBefore);
  });

  it("CV mồ côi: chỉ xoá file cũ hơn 24 giờ mà không hồ sơ nào trỏ tới; giữ CV mới và CV đang được dùng", async () => {
    const orphan = await createCv();
    await ageFile(orphan.id, daysAgo(2));
    const recentOrphan = await createCv();
    await ageFile(recentOrphan.id, new Date(NOW.getTime() - 3_600_000));
    const usedCv = await createCv();
    await createApplication(daysAgo(10), usedCv.id);
    await ageFile(usedCv.id, daysAgo(10));

    const outcome = await run();
    expect(outcome.orphanCvsDeleted).toBe(1);
    expect(await fileRow(orphan.id)).toBeUndefined();
    expect(await objectExists(orphan.filename as string)).toBe(false);
    for (const kept of [recentOrphan, usedCv]) {
      expect(await fileRow(kept.id)).toBeDefined();
      expect(await objectExists(kept.filename as string)).toBe(true);
    }
  });

  it("audit-logs quá 24 tháng bị xoá; bản mới giữ; job lỗi quá 7 ngày bị xoá cùng log, job lỗi mới và job không lỗi giữ; audit của lần chạy không chứa PII", async () => {
    const mark = randomUUID().slice(0, 8);
    const old = await createAuditLog(new Date("2024-10-18T11:59:00.000Z"), `old-${mark}`);
    const recent = await createAuditLog(new Date("2024-10-18T12:01:00.000Z"), `recent-${mark}`);
    const oldFailed = await createFailedJob(daysAgo(8));
    const recentFailed = await createFailedJob(daysAgo(6));
    const oldHealthy = await createFailedJob(daysAgo(30), { hasError: false });
    expect(await logCount(oldFailed)).toBe(1);
    await createLead(daysAgo(1000), { fullName: "Nguyen Thi Rieng Tu" });

    const outcome = await run();
    expect(outcome).toMatchObject({ auditLogsDeleted: 1, failedJobsDeleted: 1, leadsAnonymized: 1 });
    const auditExists = async (id: string) => (await payload.count({ collection: "audit-logs", where: { id: { equals: id } }, overrideAccess: true })).totalDocs === 1;
    expect(await auditExists(old.id)).toBe(false);
    expect(await auditExists(recent.id)).toBe(true);
    expect(await jobExists(oldFailed)).toBe(false);
    expect(await logCount(oldFailed)).toBe(0);
    expect(await jobExists(recentFailed)).toBe(true);
    expect(await jobExists(oldHealthy)).toBe(true);

    const [entry] = (await payload.find({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, sort: "-createdAt", limit: 1, overrideAccess: true, depth: 0 })).docs;
    expect(entry!.meta).toEqual({ leadsAnonymized: 1, applicationsAnonymized: 0, cvFilesDeleted: 0, orphanCvsDeleted: 0, orphanObjectsDeleted: 0, orphanObjectsFound: 0, auditLogsDeleted: 1, failedJobsDeleted: 1, failedRecords: 0, failedSteps: [] });
    expect(entry!.actor ?? null).toBeNull();
    expect(JSON.stringify(entry)).not.toMatch(/Nguyen|khach-pii|example\.test/);
  });

  it("S3 từ chối xoá (lỗi ở tầng S3, plugin nuốt lỗi của nó): hồ sơ KHÔNG bị ẩn danh, CV + dòng private-files + object còn nguyên; bước khác vẫn chạy; job báo lỗi; lần sau chạy lại xong", async () => {
    const lead = await createLead(daysAgo(1000));
    const cv = await createCv();
    const application = await createApplication(daysAgo(500), cv.id);
    const s3Failure = failS3Deletes();
    try {
      await expect(run()).rejects.toThrow(/purge-applications/);
    } finally {
      s3Failure.mockRestore();
    }
    expect((await reloadLead(lead.id)).anonymizedAt).toBeTruthy(); // bước khác vẫn chạy
    const stuck = await reloadApplication(application.id);
    expect(stuck.anonymizedAt ?? null).toBeNull();
    expect(stuck).toMatchObject({ cv: cv.id, fullName: "Nguyen Van Ung Vien" });
    expect(await fileRow(cv.id)).toBeDefined();
    expect(await objectExists(cv.filename as string)).toBe(true);

    expect(await run()).toMatchObject({ applicationsAnonymized: 1, cvFilesDeleted: 1 });
    expect((await reloadApplication(application.id)).cv).toBeNull();
    expect(await fileRow(cv.id)).toBeUndefined();
    expect(await objectExists(cv.filename as string)).toBe(false);
  });

  it("CV mồ côi + S3 từ chối xoá: dòng private-files và object còn (không mồ côi object), job báo lỗi; lần sau xoá được", async () => {
    const orphan = await createCv();
    await ageFile(orphan.id, daysAgo(3));
    const s3Failure = failS3Deletes();
    try {
      await expect(run()).rejects.toThrow(/purge-orphan-cvs/);
    } finally {
      s3Failure.mockRestore();
    }
    expect(await fileRow(orphan.id)).toBeDefined();
    expect(await objectExists(orphan.filename as string)).toBe(true);

    expect(await run()).toMatchObject({ orphanCvsDeleted: 1 });
    expect(await fileRow(orphan.id)).toBeUndefined();
    expect(await objectExists(orphan.filename as string)).toBe(false);
  });

  it("lead lỗi (poison) không chặn lead khác; audit/log vẫn ghi số đã ẩn danh trước khi job báo lỗi; lần sau xử lý nốt lead lỗi", async () => {
    const poison = await createLead(daysAgo(1100));
    const others = [await createLead(daysAgo(1000)), await createLead(daysAgo(1001))];
    const original = payload.update.bind(payload);
    payload.update = ((options: { collection: string; id?: string }) =>
      options.collection === "leads" && options.id === poison.id ? Promise.reject(new Error("dữ liệu cũ không hợp lệ")) : original(options as never)) as never;
    try {
      await expect(run()).rejects.toThrow(/anonymize-leads/);
    } finally {
      payload.update = original as never;
    }
    for (const lead of others) expect((await reloadLead(lead.id)).anonymizedAt).toBeTruthy();
    expect((await reloadLead(poison.id)).anonymizedAt ?? null).toBeNull();
    const [entry] = (await payload.find({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, sort: "-createdAt", limit: 1, overrideAccess: true, depth: 0 })).docs;
    expect(entry!.meta).toMatchObject({ leadsAnonymized: 2 });

    expect(await run()).toMatchObject({ leadsAnonymized: 1 });
    expect((await reloadLead(poison.id)).anonymizedAt).toBeTruthy();
  });

  it("ẩn danh lead xoá thêm ipHash/userAgent/pageUrl, query của referrer và nội dung note/call; giữ loại/thời gian activity, email_sent, utm, mergedCount", async () => {
    const lead = await createLead(daysAgo(1000), {
      ipHash: "ip-hash-gia",
      userAgent: "Mozilla/5.0 (test)",
      pageUrl: "https://tami.example/lien-he?ten=Nguyen+Van+A",
      referrer: "https://www.google.com/search?q=Nguyen+Van+A+0912345678",
      mergedCount: 2,
    });
    const req = await createLocalReq({}, payload);
    const addActivity = (type: "note" | "call" | "email_sent", content: string) =>
      asSystemActivity(req, () => payload.create({ collection: "lead-activities", data: { lead: lead.id, type, content }, depth: 0, overrideAccess: true, req }));
    const note = await addActivity("note", "Khach Nguyen Van A, goi 0912345678 sau 5h");
    const call = await addActivity("call", "Goi lan 2, khach hen cuoi tuan");
    const email = await addActivity("email_sent", "Đã nhắc admin: chưa giao sau 30 phút làm việc");
    // Activity mới đẩy lastActivityAt về hiện tại: đặt lại quá hạn cho lead này.
    await exec(sql`UPDATE "leads" SET "last_activity_at" = ${daysAgo(1000).toISOString()} WHERE "id" = ${lead.id}`);

    expect((await run()).leadsAnonymized).toBe(1);

    const after = await reloadLead(lead.id);
    expect(after).toMatchObject({ ipHash: null, userAgent: null, pageUrl: null, referrer: "https://www.google.com", mergedCount: 2, utm: { source: "facebook" }, source: "contact" });
    const activities = (await payload.find({ collection: "lead-activities", where: { lead: { equals: lead.id } }, overrideAccess: true, depth: 0, pagination: false })).docs;
    expect(activities).toHaveLength(3);
    const byId = new Map(activities.map((activity) => [activity.id, activity]));
    expect(byId.get(note.id)).toMatchObject({ type: "note", content: ANONYMIZED_PLACEHOLDER, createdAt: note.createdAt });
    expect(byId.get(call.id)).toMatchObject({ type: "call", content: ANONYMIZED_PLACEHOLDER, createdAt: call.createdAt });
    expect(byId.get(email.id)).toMatchObject({ type: "email_sent", content: "Đã nhắc admin: chưa giao sau 30 phút làm việc" });
    expect(JSON.stringify(activities)).not.toMatch(/Nguyen|0912345678/);
  });

  it("hồ sơ mà CV đã mất từ trước (xoá file rồi commit lỗi) vẫn ẩn danh được khi chạy lại", async () => {
    const cv = await createCv();
    const application = await createApplication(daysAgo(500), cv.id);
    // Mô phỏng: object + dòng private-files đã mất nhưng hồ sơ còn trỏ (FK ON DELETE SET NULL đặt cv = null, hồ sơ chưa ẩn danh).
    await payload.delete({ collection: "private-files", id: cv.id, overrideAccess: true });
    expect((await reloadApplication(application.id)).cv ?? null).toBeNull();
    expect(await run()).toMatchObject({ applicationsAnonymized: 1, cvFilesDeleted: 0 });
    expect((await reloadApplication(application.id)).anonymizedAt).toBe(NOW.toISOString());
  });

  it("ba lần chạy chồng nhau (khoá advisory + đọc lại trong transaction): mỗi bản ghi chỉ xử lý một lần, không lỗi", async () => {
    const lead = await createLead(daysAgo(1000));
    const cv = await createCv();
    const application = await createApplication(daysAgo(500), cv.id);
    const orphan = await createCv();
    await ageFile(orphan.id, daysAgo(3));

    const outcomes = await Promise.all([run(), run(), run()]);
    const sum = (key: "leadsAnonymized" | "applicationsAnonymized" | "cvFilesDeleted" | "orphanCvsDeleted") => outcomes.reduce((total, outcome) => total + outcome[key], 0);
    expect([sum("leadsAnonymized"), sum("applicationsAnonymized"), sum("cvFilesDeleted"), sum("orphanCvsDeleted")]).toEqual([1, 1, 1, 1]);
    expect((await reloadLead(lead.id)).anonymizedAt).toBe(NOW.toISOString());
    expect((await reloadApplication(application.id)).cv).toBeNull();
    expect(await objectExists(cv.filename as string)).toBe(false);
    expect(await objectExists(orphan.filename as string)).toBe(false);
  });

  it("handler của task: input dryRun được chuyển xuống job", async () => {
    const { dataRetentionTask } = await import("../../src/jobs/data-retention");
    const lead = await createLead(new Date(Date.now() - 800 * 86_400_000));
    const req = await createLocalReq({}, payload);
    // Handler chạy qua cấu hình thật (không prefix): tắt bước quét bucket để không đụng object dùng chung (mock ở đầu file là lớp chặn thứ hai).
    const previousMode = process.env.RETENTION_ORPHAN_OBJECT_SCAN;
    process.env.RETENTION_ORPHAN_OBJECT_SCAN = "off";
    const handler = dataRetentionTask.handler as unknown as (args: { input: { dryRun?: boolean }; req: typeof req }) => Promise<{ output: { dryRun: boolean; leadsAnonymized: number } }>;
    const dry = await handler({ input: { dryRun: true }, req });
    expect(dry.output).toMatchObject({ dryRun: true, leadsAnonymized: 1 });
    expect((await reloadLead(lead.id)).anonymizedAt ?? null).toBeNull();
    const real = await handler({ input: {}, req });
    expect(real.output).toMatchObject({ dryRun: false, leadsAnonymized: 1 });
    expect((await reloadLead(lead.id)).anonymizedAt).toBeTruthy();
    if (previousMode === undefined) delete process.env.RETENTION_ORPHAN_OBJECT_SCAN;
    else process.env.RETENTION_ORPHAN_OBJECT_SCAN = previousMode;
  });

  describe("hook beforeDelete của private-files: mọi đường xoá dùng chung, S3 lỗi thì dòng DB còn", () => {
    it("admin xoá hồ sơ ứng tuyển khi S3 lỗi: xoá hồ sơ bị rollback, CV + dòng private-files + object còn; lần sau xoá được cả hai", async () => {
      const cv = await createCv();
      const application = await createApplication(daysAgo(1), cv.id);
      const s3Failure = failS3Deletes();
      try {
        await expect(payload.delete({ collection: "job-applications", id: application.id, overrideAccess: true })).rejects.toThrow();
      } finally {
        s3Failure.mockRestore();
      }
      expect(await reloadApplication(application.id)).toBeDefined();
      expect(await fileRow(cv.id)).toBeDefined();
      expect(await objectExists(cv.filename as string)).toBe(true);

      await payload.delete({ collection: "job-applications", id: application.id, overrideAccess: true });
      expect(await fileRow(cv.id)).toBeUndefined();
      expect(await objectExists(cv.filename as string)).toBe(false);
    });

    it("xoá thẳng private-files theo id khi S3 lỗi (admin UI / removeOrphanCv): ném lỗi, dòng + object còn; lần sau xoá được", async () => {
      const cv = await createCv();
      const s3Failure = failS3Deletes();
      try {
        await expect(payload.delete({ collection: "private-files", id: cv.id, overrideAccess: true })).rejects.toThrow();
      } finally {
        s3Failure.mockRestore();
      }
      expect(await fileRow(cv.id)).toBeDefined();
      expect(await objectExists(cv.filename as string)).toBe(true);

      await payload.delete({ collection: "private-files", id: cv.id, overrideAccess: true });
      expect(await fileRow(cv.id)).toBeUndefined();
      expect(await objectExists(cv.filename as string)).toBe(false);
    });

    it("object đã xoá rồi commit lỗi (dòng private-files + con trỏ hồ sơ còn, object mất): lần chạy sau ẩn danh hồ sơ và xoá dòng, cvFilesDeleted = 1", async () => {
      const cv = await createCv();
      const application = await createApplication(daysAgo(500), cv.id);
      await s3.send(new DeleteObjectCommand({ Bucket: privateBucket, Key: cv.filename as string }));
      expect(await objectExists(cv.filename as string)).toBe(false);
      expect(await fileRow(cv.id)).toBeDefined();

      expect(await run()).toMatchObject({ applicationsAnonymized: 1, cvFilesDeleted: 1 });
      expect((await reloadApplication(application.id)).anonymizedAt).toBe(NOW.toISOString());
      expect(await fileRow(cv.id)).toBeUndefined();
    });
  });

  describe("quét object mồ côi (bucket ↔ DB)", () => {
    // LastModified là giờ thật của S3 nên "cũ hơn ngưỡng" mô phỏng bằng `now` lùi: now = hiện tại + 25h thì object vừa tạo đã quá ngưỡng 24h.
    const FUTURE_NOW = () => new Date(Date.now() + 25 * 3_600_000);
    const put = (key: string) => s3.send(new PutObjectCommand({ Bucket: privateBucket, Key: key, Body: PDF, ContentType: "application/pdf" }));

    it("dry-run đếm đúng; chạy thật chỉ xoá object không có dòng DB; object chưa quá ngưỡng thì giữ", async () => {
      const prefix = `retention-test-orphans-${randomUUID()}/`;
      const keys = [`${prefix}a.pdf`, `${prefix}b.pdf`];
      await Promise.all(keys.map(put));
      const kept = await createCv(); // có dòng DB: quét đúng vùng của nó phải giữ lại
      const keptApplication = await createApplication(daysAgo(1), kept.id); // có hồ sơ trỏ tới nên bước purge-orphan-cvs cũng không xoá
      allowedExtraScanPrefixes.add(kept.filename as string);
      try {
        expect(await run({ dryRun: true, now: FUTURE_NOW(), scanPrefix: prefix })).toMatchObject({ orphanObjectsFound: 2, orphanObjectsDeleted: 0 });
        for (const key of keys) expect(await objectExists(key)).toBe(true);

        expect(await run({ now: new Date(), scanPrefix: prefix })).toMatchObject({ orphanObjectsFound: 0, orphanObjectsDeleted: 0 }); // chưa quá 24h
        for (const key of keys) expect(await objectExists(key)).toBe(true);

        expect(await run({ now: FUTURE_NOW(), scanPrefix: kept.filename as string })).toMatchObject({ orphanObjectsDeleted: 0 });
        expect(await objectExists(kept.filename as string)).toBe(true);

        expect(await run({ now: FUTURE_NOW(), scanPrefix: prefix })).toMatchObject({ orphanObjectsFound: 2, orphanObjectsDeleted: 2 });
        for (const key of keys) expect(await objectExists(key)).toBe(false);
        expect(await objectExists(kept.filename as string)).toBe(true);
      } finally {
        await payload.delete({ collection: "job-applications", id: keptApplication.id, overrideAccess: true }).catch(() => {});
      }
    });

    it("S3 từ chối xoá object mồ côi: job báo lỗi, object còn, audit ghi số bản ghi lỗi và bước lỗi; lần sau xoá được", async () => {
      const prefix = `retention-test-orphans-${randomUUID()}/`;
      const key = `${prefix}c.pdf`;
      await put(key);
      const s3Failure = failS3Deletes();
      try {
        await expect(run({ now: FUTURE_NOW(), scanPrefix: prefix })).rejects.toThrow(/purge-orphan-objects/);
      } finally {
        s3Failure.mockRestore();
      }
      expect(await objectExists(key)).toBe(true);
      const [entry] = (await payload.find({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, sort: "-createdAt", limit: 1, overrideAccess: true, depth: 0 })).docs;
      expect(entry!.meta).toMatchObject({ failedSteps: expect.arrayContaining(["purge-orphan-objects"]) });
      expect((entry!.meta as { failedRecords: number }).failedRecords).toBeGreaterThanOrEqual(1);

      expect(await run({ now: FUTURE_NOW(), scanPrefix: prefix })).toMatchObject({ orphanObjectsDeleted: 1 });
      expect(await objectExists(key)).toBe(false);
    });

    it("chế độ off bỏ qua bước (không liệt kê); dry-run chỉ đếm + ghi audit, không xoá; delete mới xoá", async () => {
      const prefix = `retention-test-orphans-${randomUUID()}/`;
      const key = `${prefix}d.pdf`;
      await put(key);
      const sendSpy = vi.spyOn(S3Client.prototype, "send");
      expect(await run({ now: FUTURE_NOW(), scanPrefix: prefix, mode: "off" })).toMatchObject({ orphanObjectsFound: 0, orphanObjectsDeleted: 0 });
      expect(sendSpy.mock.calls.some(([command]) => (command as { constructor: { name: string } }).constructor.name === "ListObjectsV2Command")).toBe(false);
      sendSpy.mockRestore();
      expect(await objectExists(key)).toBe(true);

      expect(await run({ now: FUTURE_NOW(), scanPrefix: prefix, mode: "dry-run" })).toMatchObject({ orphanObjectsFound: 1, orphanObjectsDeleted: 0 });
      expect(await objectExists(key)).toBe(true);
      const [entry] = (await payload.find({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, sort: "-createdAt", limit: 1, overrideAccess: true, depth: 0 })).docs;
      expect(entry!.meta).toMatchObject({ orphanObjectsFound: 1, orphanObjectsDeleted: 0 });

      expect(await run({ now: FUTURE_NOW(), scanPrefix: prefix, mode: "delete" })).toMatchObject({ orphanObjectsFound: 1, orphanObjectsDeleted: 1 });
      expect(await objectExists(key)).toBe(false);
    });

    it("ngưỡng an toàn: quá số lượng tối đa thì KHÔNG xoá gì và job báo lỗi (failedSteps trong audit)", async () => {
      const prefix = `retention-test-orphans-${randomUUID()}/`;
      const keys = [`${prefix}e1.pdf`, `${prefix}e2.pdf`];
      await Promise.all(keys.map(put));
      await expect(run({ now: FUTURE_NOW(), scanPrefix: prefix, maxDelete: 1 })).rejects.toThrow(/purge-orphan-objects/);
      for (const key of keys) expect(await objectExists(key)).toBe(true);
      const [entry] = (await payload.find({ collection: "audit-logs", where: { action: { equals: "system.data_retention" } }, sort: "-createdAt", limit: 1, overrideAccess: true, depth: 0 })).docs;
      expect(entry!.meta).toMatchObject({ failedSteps: expect.arrayContaining(["purge-orphan-objects"]), orphanObjectsFound: 2, orphanObjectsDeleted: 0 });

      expect(await run({ now: FUTURE_NOW(), scanPrefix: prefix, maxDelete: 2 })).toMatchObject({ orphanObjectsDeleted: 2 });
      for (const key of keys) expect(await objectExists(key)).toBe(false);
    });

    it("ngưỡng tỉ lệ: từ 10 mồ côi trở lên mà chiếm > 20% số object đã liệt kê thì không xoá (DB rỗng/nhầm DB/restore cũ)", async () => {
      const prefix = `retention-test-orphans-${randomUUID()}/`;
      const keys = Array.from({ length: 12 }, (_, index) => `${prefix}r${index}.pdf`);
      await Promise.all(keys.map(put));
      try {
        await expect(run({ now: FUTURE_NOW(), scanPrefix: prefix })).rejects.toThrow(/purge-orphan-objects/);
        expect(await Promise.all(keys.map(objectExists))).toEqual(keys.map(() => true));
      } finally {
        await Promise.all(keys.map((key) => s3.send(new DeleteObjectCommand({ Bucket: privateBucket, Key: key }))));
      }
    });
  });
});
