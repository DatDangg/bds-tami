import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PublicPipelineDeps } from "../../src/endpoints/_middleware/public-pipeline";
import type { handleJobApplication as HandleJobApplication } from "../../src/endpoints/public/job-applications";

const baseUrl = process.env.DATABASE_URL_TEST;
const hasRedis = Boolean(process.env.REDIS_URL);
const MB = 1024 * 1024;
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<<>>\nstartxref\n0\n%%EOF\n");
const EXE = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]), Buffer.alloc(512)]);
const IN_30_DAYS = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const YESTERDAY = () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
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

/** DOCX tối thiểu: file-type chỉ nhận ra docx khi đọc được `[Content_Types].xml` trong zip (entry lưu thô, không nén). */
function zipEntry(name: string, content: string): Buffer {
  const nameBytes = Buffer.from(name);
  const contentBytes = Buffer.from(content);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt32LE(contentBytes.length, 18);
  header.writeUInt32LE(contentBytes.length, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  return Buffer.concat([header, nameBytes, contentBytes]);
}
const DOCX = Buffer.concat([
  zipEntry("[Content_Types].xml", '<Types><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
  zipEntry("word/document.xml", "<w:document/>"),
]);

const turnstileOk: Pick<PublicPipelineDeps, "verifyTurnstile"> = { verifyTurnstile: async () => ({ ok: true }) };

/** DB tạm riêng (chạy migration thật) + Redis + SeaweedFS dev thật. Thiếu DATABASE_URL_TEST/REDIS_URL thì bỏ qua có chủ đích. */
describe.skipIf(!baseUrl || !hasRedis)("integration: POST /api/public/job-applications (DB tạm, Redis + S3 thật, Turnstile giả)", () => {
  const dbName = `tami_apply_${Date.now().toString(36)}`;
  const usedIps = new Set<string>();
  const createdCvNames: string[] = [];
  let payload: Payload;
  let handle: typeof HandleJobApplication;
  let checkEndpointRateLimit: PublicPipelineDeps["rateLimit"];
  let s3: S3Client;
  let privateBucket = "";
  let postings: { open: string; expired: string; draft: string; trashed: string };

  function newIp(): string {
    let ip: string;
    do {
      ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
    } while (usedIps.has(ip));
    usedIps.add(ip);
    return ip;
  }

  function buildForm(jobPostingId: string, overrides: Record<string, string | undefined> = {}, cv: { bytes: Uint8Array; name: string } | null = { bytes: PDF, name: "CV.pdf" }) {
    const form = new FormData();
    const fields: Record<string, string | undefined> = {
      jobPostingId,
      fullName: "Trần Thị Ứng Tuyển",
      phone: "0912345678",
      email: "ungtuyen@example.test",
      message: "Xin chào",
      consent: "true",
      turnstileToken: "tok",
      locale: "en",
      ...overrides,
    };
    for (const [name, value] of Object.entries(fields)) if (value !== undefined) form.append(name, value);
    if (cv) form.append("cv", new File([cv.bytes as BlobPart], cv.name, { type: "application/pdf" }));
    return form;
  }

  /** Đi thẳng handler với Turnstile giả; rate limit là Redis thật. */
  function submit(form: FormData, ip = newIp()) {
    const request = new Request("http://localhost/api/public/job-applications", { method: "POST", headers: { "CF-Connecting-IP": ip }, body: form });
    return handle({ headers: request.headers, body: request.body }, { payload, pipelineDeps: { rateLimit: checkEndpointRateLimit, ...turnstileOk } });
  }

  async function objectExists(key: string): Promise<boolean> {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: privateBucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  const count = (collection: "job-applications" | "private-files") => payload.count({ collection, overrideAccess: true }).then((result) => result.totalDocs);

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const testUrl = new URL(baseUrl!);
    testUrl.pathname = `/${dbName}`;
    process.env.DATABASE_URL = testUrl.toString();
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    ({ handleJobApplication: handle } = await import("../../src/endpoints/public/job-applications"));
    ({ checkEndpointRateLimit } = await import("../../src/lib/security/rate-limit"));
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
    const createPosting = async (title: string, data: Record<string, unknown>) =>
      (
        await payload.create({
          collection: "job-postings",
          data: {
            title,
            description: lexical("Mô tả"),
            requirements: lexical("Yêu cầu"),
            category: category.id,
            employmentType: "full_time",
            deadline: IN_30_DAYS(),
            status: "published",
            ...data,
          } as never,
          locale: "vi",
          user: { ...author, collection: "staff" as const },
          overrideAccess: true,
          depth: 0,
        })
      ).id;
    postings = {
      open: await createPosting("Nhân viên kinh doanh", {}),
      expired: await createPosting("Tin hết hạn", { deadline: YESTERDAY() }),
      draft: await createPosting("Tin nháp", { status: "draft" }),
      trashed: await createPosting("Tin đã xoá mềm", {}),
    };
    await payload.update({ collection: "job-postings", id: postings.trashed, data: { deletedAt: new Date().toISOString() } as never, overrideAccess: true, trash: true });
    await payload.updateGlobal({
      slug: "site-settings",
      data: { siteName: "TAMI HOMES", hotline: "0900000000", notificationEmails: [{ email: "hr@tami.test" }], privacyPolicyVersion: "2026-10-test" } as never,
      overrideAccess: true,
    });
  }, 120_000);

  afterAll(async () => {
    const { getRedis, closeRedis } = await import("../../src/lib/redis");
    const { ipHash } = await import("../../src/lib/security/ip-hash");
    const keys = [...usedIps].map((ip) => `rl:job-applications:${ipHash(ip)}`);
    if (keys.length > 0) await getRedis().del(...keys);
    await closeRedis();
    // Xoá hồ sơ kéo theo xoá CV (hook) -> object S3 của test không còn sót.
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

  it("hồ sơ hợp lệ -> 200 và đúng 1 hồ sơ + 1 file private (S3) + 1 job email tiếng Việt cho ứng viên en", async () => {
    const response = await submit(buildForm(postings.open));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { received: true } });

    const applications = await payload.find({ collection: "job-applications", overrideAccess: true, depth: 1, limit: 10 });
    expect(applications.totalDocs).toBe(1);
    const application = applications.docs[0]!;
    expect(application).toMatchObject({
      fullName: "Trần Thị Ứng Tuyển",
      phone: "+84912345678",
      email: "ungtuyen@example.test",
      locale: "en",
      consentVersion: "2026-10-test",
      status: "new",
    });
    expect(application.consentAt).toBeTruthy();
    // `ipHash` bị chặn đọc qua access (read: denyAll) kể cả Local API có overrideAccess=false; đọc thẳng DB.
    const stored = await payload.db.find({ collection: "job-applications", limit: 1, pagination: false });
    expect((stored.docs[0] as { ipHash?: string }).ipHash).toMatch(/^[0-9a-f]{64}$/);

    const cv = application.cv as { id: string; filename: string; mimeType: string };
    createdCvNames.push(cv.filename);
    expect(cv.filename).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(cv.mimeType).toBe("application/pdf");
    expect(await objectExists(cv.filename)).toBe(true);
    expect(await count("private-files")).toBe(1);

    const jobs = await payload.find({ collection: "payload-jobs", where: { taskSlug: { equals: "send-notification-email" } }, overrideAccess: true, limit: 10 });
    expect(jobs.totalDocs).toBe(1);
    expect(jobs.docs[0]!.input).toMatchObject({
      template: "job-application",
      to: ["hr@tami.test"],
      data: { applicantName: "Trần Thị Ứng Tuyển", jobTitle: "Nhân viên kinh doanh", language: "en" },
    });
  });

  it("đường dẫn thật của endpoint: Turnstile không xác thực được -> 400 có chữ captcha; chưa lưu thêm gì", async () => {
    const before = await count("job-applications");
    const savedSecret = process.env.TURNSTILE_SECRET_KEY;
    process.env.TURNSTILE_SECRET_KEY = "";
    try {
      const request = new Request("http://localhost/api/public/job-applications", {
        method: "POST",
        headers: { "CF-Connecting-IP": newIp() },
        body: buildForm(postings.open),
      });
      const response = await handleEndpoints({ config: payload.config, request });
      expect(response.status).toBe(400);
      expect(((await response.json()) as { error: string }).error).toBe("Captcha verification failed");
    } finally {
      if (savedSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
      else process.env.TURNSTILE_SECRET_KEY = savedSecret;
    }
    expect(await count("job-applications")).toBe(before);
  });

  it("vượt 3 lần/giờ/IP -> 429 kèm Retry-After (Redis thật, qua route đã đăng ký); lần thứ 4 chưa tới Turnstile", async () => {
    const ip = newIp();
    const send = () =>
      handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/public/job-applications", { method: "POST", headers: { "CF-Connecting-IP": ip }, body: buildForm(postings.open, { turnstileToken: "" }) }),
      });
    for (let attempt = 0; attempt < 3; attempt++) expect((await send()).status).toBe(400);
    const limited = await send();
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it.each([
    ["hết hạn", () => postings.expired],
    ["chưa xuất bản (draft)", () => postings.draft],
    ["đã xoá mềm", () => postings.trashed],
    ["không tồn tại", () => "00000000-0000-4000-8000-000000000000"],
  ])("vị trí %s -> 400, không lưu hồ sơ/CV", async (_label, pick) => {
    const [applications, files] = [await count("job-applications"), await count("private-files")];
    const response = await submit(buildForm(pick()));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("This job is no longer accepting applications");
    expect([await count("job-applications"), await count("private-files")]).toEqual([applications, files]);
  });

  it("thiếu consent -> 400; .exe đổi đuôi .pdf -> 415; body 6MB -> 413; PDF > 5MB -> 413; không lưu gì", async () => {
    const [applications, files] = [await count("job-applications"), await count("private-files")];
    expect((await submit(buildForm(postings.open, { consent: undefined }))).status).toBe(400);
    expect((await submit(buildForm(postings.open, {}, { bytes: EXE, name: "CV.pdf" }))).status).toBe(415);
    expect((await submit(buildForm(postings.open, {}, { bytes: Buffer.concat([PDF, Buffer.alloc(6 * MB)]), name: "CV.pdf" }))).status).toBe(413);
    expect((await submit(buildForm(postings.open, {}, { bytes: Buffer.concat([PDF, Buffer.alloc(5 * MB + 1 - PDF.length)]), name: "CV.pdf" }))).status).toBe(413);
    expect([await count("job-applications"), await count("private-files")]).toEqual([applications, files]);
  });

  it("PDF hỏng cấu trúc (đúng magic bytes, thiếu xref) -> 400; CV .doc (OLE2) và .docx hợp lệ -> 200", async () => {
    const files = await count("private-files");
    const truncated = await submit(buildForm(postings.open, {}, { bytes: Buffer.from("%PDF-1.4 hỏng"), name: "CV.pdf" }));
    expect(truncated.status).toBe(400);
    expect(await count("private-files")).toBe(files);

    const doc = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(1024)]);
    const accepted = await submit(buildForm(postings.open, {}, { bytes: doc, name: "CV.doc" }));
    expect(accepted.status).toBe(200);
    const saved = await payload.find({ collection: "private-files", where: { mimeType: { equals: "application/msword" } }, overrideAccess: true });
    expect(saved.totalDocs).toBe(1);
    expect(saved.docs[0]!.filename).toMatch(/^[0-9a-f-]{36}.doc$/);

    expect((await submit(buildForm(postings.open, {}, { bytes: DOCX, name: "CV.docx" }))).status).toBe(200);
    const docx = await payload.find({ collection: "private-files", where: { filename: { like: ".docx" } }, overrideAccess: true });
    expect(docx.totalDocs).toBe(1);
  });

  it("tạo hồ sơ lỗi -> CV vừa lưu bị xoá cả dòng lẫn object S3 (không mồ côi)", async () => {
    const collectionHooks = payload.collections["job-applications"]!.config.hooks;
    const failingHook = () => {
      throw new Error("lỗi giả lập khi ghi hồ sơ");
    };
    collectionHooks.beforeChange = [...(collectionHooks.beforeChange ?? []), failingHook];
    const filesBefore = await count("private-files");
    const applicationsBefore = await count("job-applications");
    try {
      const response = await submit(buildForm(postings.open, { locale: "vi" }));
      expect(response.status).toBe(500);
      expect(((await response.json()) as { error: string }).error).toBe("Hệ thống gặp lỗi, vui lòng thử lại sau");
    } finally {
      collectionHooks.beforeChange = collectionHooks.beforeChange.filter((hook) => hook !== failingHook);
    }
    expect(await count("job-applications")).toBe(applicationsBefore);
    expect(await count("private-files")).toBe(filesBefore);
  });
});
