import type { Payload } from "payload";
import { APIError, ValidationError } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicPipelineDeps } from "../_middleware/public-pipeline";
// Logger thật ghi ra stdout; test kiểm nội dung log qua mock.
const log = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { child: () => log, ...log } }));

import { handleJobApplication } from "./job-applications";

const MB = 1024 * 1024;
const POSTING_ID = "7f1c0f0e-2b0a-4c53-9d0e-2d6e1f0a9b11";
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const EXE = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]), Buffer.alloc(512)]);
const OLE2_DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(1024)]);
const CANDIDATE_NAME = "Nguyễn Văn Ứng Viên";
const CANDIDATE_EMAIL = "ung.vien@example.test";
const CANDIDATE_PHONE = "0901234567";

const baseFields = {
  jobPostingId: POSTING_ID,
  fullName: CANDIDATE_NAME,
  phone: CANDIDATE_PHONE,
  email: CANDIDATE_EMAIL,
  message: "Tôi quan tâm vị trí này",
  consent: "true",
  turnstileToken: "token",
  locale: "vi",
};

interface Submission {
  fields?: Record<string, string | undefined>;
  cv?: { bytes: Uint8Array; name: string; type: string } | null;
  headers?: Record<string, string>;
}

/** Stream từng khúc 64KB như body HTTP thật (body dựng thẳng từ FormData của undici lỗi khi bị cancel giữa chừng). */
function chunkedBody(bytes: Uint8Array): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.byteLength) return controller.close();
      controller.enqueue(bytes.subarray(offset, offset + 65_536));
      offset += 65_536;
    },
  });
}

async function makeRequest({ fields = {}, cv = { bytes: PDF, name: "CV.pdf", type: "application/pdf" }, headers = {} }: Submission = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({ ...baseFields, ...fields })) {
    if (value !== undefined) form.append(name, value);
  }
  if (cv) form.append("cv", new File([cv.bytes as BlobPart], cv.name, { type: cv.type }));
  const encoded = new Response(form);
  const bytes = new Uint8Array(await encoded.arrayBuffer());
  const reqHeaders = new Headers({ "CF-Connecting-IP": "198.51.100.7", "Content-Type": encoded.headers.get("content-type") ?? "" });
  for (const [name, value] of Object.entries(headers)) reqHeaders.set(name, value);
  return { headers: reqHeaders, body: chunkedBody(bytes) };
}

const IN_30_DAYS = () => new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
const YESTERDAY_MORNING = () => new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();

interface FakeOptions {
  posting?: { id: string; title: string; deadline: string } | null;
  applicationFails?: Error;
  notificationEmails?: { email: string }[];
  privacyPolicyVersion?: string | null;
  queueFails?: boolean;
}

function fakePayload(options: FakeOptions = {}) {
  const { posting = { id: POSTING_ID, title: "Nhân viên kinh doanh", deadline: IN_30_DAYS() } } = options;
  const calls = {
    find: vi.fn<(args: unknown) => Promise<{ docs: unknown[] }>>(async () => ({ docs: posting ? [posting] : [] })),
    create: vi.fn(async (args: { collection: string }) => {
      if (args.collection === "private-files") return { id: "cv-1" };
      if (options.applicationFails) throw options.applicationFails;
      return { id: "app-1" };
    }),
    delete: vi.fn<(args: unknown) => Promise<object>>(async () => ({})),
    findGlobal: vi.fn(async () => ({
      privacyPolicyVersion: options.privacyPolicyVersion === undefined ? "2026-10" : options.privacyPolicyVersion,
      notificationEmails: options.notificationEmails ?? [{ email: "hr@tami.test" }],
    })),
    queue: vi.fn<(args: unknown) => Promise<{ id: string }>>(async () => {
      if (options.queueFails) throw new Error("redis down: 0901234567");
      return { id: "job-1" };
    }),
  };
  const payload = {
    find: calls.find,
    create: calls.create,
    delete: calls.delete,
    findGlobal: calls.findGlobal,
    jobs: { queue: calls.queue },
  } as unknown as Payload;
  return { payload, calls };
}

const allowed = (): PublicPipelineDeps => ({
  rateLimit: vi.fn(async () => ({ allowed: true as const, remaining: 2 })),
  verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
});

const NOW = new Date("2026-10-17T10:00:00.000Z");

async function submit(submission: Submission = {}, options: FakeOptions = {}, pipelineDeps = allowed()) {
  const fake = fakePayload(options);
  const response = await handleJobApplication(await makeRequest(submission), {
    payload: fake.payload,
    pipelineDeps,
    now: () => NOW,
    siteUrl: "https://tami.test/",
  });
  return { response, body: (await response.json()) as Record<string, unknown>, ...fake, pipelineDeps };
}

describe("POST /api/public/job-applications (handler)", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    for (const fn of Object.values(log)) fn.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hồ sơ hợp lệ -> 200, CV lưu private tên ngẫu nhiên, hồ sơ có consent/locale/ipHash, 1 email tiếng Việt tới notificationEmails", async () => {
    const { response, body, calls } = await submit();
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: { received: true } });

    const cvCall = calls.create.mock.calls.find(([args]) => args.collection === "private-files")![0] as unknown as {
      file: { name: string; mimetype: string; size: number };
    };
    expect(cvCall.file.name).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(cvCall.file.mimetype).toBe("application/pdf");

    const applicationCall = calls.create.mock.calls.find(([args]) => args.collection === "job-applications")![0] as unknown as {
      data: Record<string, unknown>;
    };
    expect(applicationCall.data).toMatchObject({
      jobPosting: POSTING_ID,
      status: "new",
      fullName: CANDIDATE_NAME,
      phone: "+84901234567",
      email: CANDIDATE_EMAIL,
      cv: "cv-1",
      consentVersion: "2026-10",
      locale: "vi",
      consentAt: NOW.toISOString(),
    });
    expect(applicationCall.data.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(applicationCall.data)).not.toContain("198.51.100.7");

    expect(calls.queue).toHaveBeenCalledTimes(1);
    const queued = (calls.queue.mock.calls[0] as unknown as [{ task: string; input: { template: string; to: string[]; data: Record<string, string> } }])[0];
    expect(queued.task).toBe("send-notification-email");
    expect(queued.input).toMatchObject({
      template: "job-application",
      to: ["hr@tami.test"],
      data: {
        applicantName: CANDIDATE_NAME,
        jobTitle: "Nhân viên kinh doanh",
        language: "vi",
        applicationUrl: "https://tami.test/admin/collections/job-applications/app-1",
      },
    });
  });

  it("locale mặc định vi khi bỏ trống; en được lưu và đưa vào email", async () => {
    const missing = await submit({ fields: { locale: undefined } });
    expect(missing.response.status).toBe(200);
    expect(missing.calls.create.mock.calls[1]![0]).toMatchObject({ data: { locale: "vi" } });

    const english = await submit({ fields: { locale: "en" } });
    expect(english.calls.create.mock.calls[1]![0]).toMatchObject({ data: { locale: "en" } });
    expect(english.calls.queue.mock.calls[0]![0]).toMatchObject({ input: { data: { language: "en" } } });
  });

  it("thứ tự: rate limit -> Turnstile -> (validate) ; 429 giữ Retry-After, không đọc body, không chạm DB", async () => {
    const deps = allowed();
    deps.rateLimit = vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 1800 }));
    const { response, calls } = await submit({}, {}, deps);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("1800");
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(calls.find).not.toHaveBeenCalled();
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("Turnstile sai -> 400 có chữ captcha (vi và en), không lưu gì", async () => {
    const deps = allowed();
    deps.verifyTurnstile = vi.fn(async () => ({ ok: false as const, reason: "invalid-token" as const }));
    const vi400 = await submit({}, {}, deps);
    expect(vi400.response.status).toBe(400);
    expect(vi400.body.error).toMatch(/captcha/i);
    expect(vi400.calls.create).not.toHaveBeenCalled();
    const en400 = await submit({ fields: { locale: "en" } }, {}, deps);
    expect(en400.body.error).toBe("Captcha verification failed");
  });

  it("lỗi theo locale của ứng viên (en) cho dữ liệu sai", async () => {
    const { response, body } = await submit({ fields: { locale: "en", email: "không-phải-email" } });
    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid data");
    expect(body.details).toEqual([{ field: "email", message: "Invalid value" }]);
  });

  it("thiếu consent hoặc consent khác 'true' -> 400, không lưu", async () => {
    for (const consent of [undefined, "false", "on", "1"]) {
      const { response, body, calls } = await submit({ fields: { consent } });
      expect(response.status).toBe(400);
      expect(body.details).toEqual([{ field: "consent", message: "Bạn cần đồng ý với chính sách bảo mật" }]);
      expect(calls.create).not.toHaveBeenCalled();
    }
  });

  it.each([
    ["thiếu họ tên", { fullName: "" }],
    ["SĐT không phải Việt Nam", { phone: "12345" }],
    ["jobPostingId không phải UUID", { jobPostingId: "1; DROP TABLE" }],
    ["message quá 2000 ký tự", { message: "a".repeat(2001) }],
    ["locale lạ", { locale: "fr" }],
  ])("%s -> 400", async (_label, fields) => {
    const { response, calls } = await submit({ fields });
    expect(response.status).toBe(400);
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("thiếu file cv -> 400", async () => {
    const { response, body } = await submit({ cv: null });
    expect(response.status).toBe(400);
    expect(body.details).toEqual([{ field: "cv", message: "Vui lòng đính kèm CV" }]);
  });

  it("vị trí hết hạn / không tồn tại, chưa xuất bản hoặc đã xoá mềm (find trả rỗng) -> 400, không lưu CV", async () => {
    const expired = await submit({}, { posting: { id: POSTING_ID, title: "x", deadline: YESTERDAY_MORNING() } });
    expect(expired.response.status).toBe(400);
    expect(expired.body.error).toBe("Vị trí tuyển dụng này không còn nhận hồ sơ");
    expect(expired.body.details).toEqual([]);
    // Mã máy đọc được: client (ApplyForm) dựa vào đây thay cho quy ước "400 không có details".
    expect(expired.body).toMatchObject({ code: "postingClosed" });
    expect(expired.calls.create).not.toHaveBeenCalled();

    const missing = await submit({}, { posting: null });
    expect(missing.response.status).toBe(400);
    expect(missing.body).toMatchObject({ code: "postingClosed" });
    expect(missing.calls.create).not.toHaveBeenCalled();
  });

  it("truy vấn vị trí chỉ lấy bản published (find mặc định bỏ bản xoá mềm), overrideAccess", async () => {
    const { calls } = await submit();
    expect(calls.find.mock.calls[0]![0]).toMatchObject({
      collection: "job-postings",
      where: { and: [{ id: { equals: POSTING_ID } }, { status: { equals: "published" } }] },
      overrideAccess: true,
    });
    expect((calls.find.mock.calls[0]![0] as { trash?: boolean }).trash).toBeUndefined();
  });

  it("file .exe đổi đuôi .pdf (Content-Type pdf) -> 415, không lưu", async () => {
    const { response, calls } = await submit({ cv: { bytes: EXE, name: "CV.pdf", type: "application/pdf" } });
    expect(response.status).toBe(415);
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("PDF 5MB + 1 byte (lọt trần body) -> 413 theo loại file; en -> thông điệp tiếng Anh", async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(5 * MB + 1 - PDF.length)]);
    const { response, body, calls } = await submit({ fields: { locale: "en" }, cv: { bytes: big, name: "CV.pdf", type: "application/pdf" } });
    expect(response.status).toBe(413);
    expect(body.error).toBe("CV exceeds 5MB");
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("body 6MB -> 413 ngay khi đọc (không đọc hết), không chạm DB", async () => {
    const huge = Buffer.concat([PDF, Buffer.alloc(6 * MB)]);
    const { response, calls } = await submit({ cv: { bytes: huge, name: "CV.pdf", type: "application/pdf" } });
    expect(response.status).toBe(413);
    expect(calls.find).not.toHaveBeenCalled();
    expect(calls.create).not.toHaveBeenCalled();
  });

  it("Content-Length khai báo vượt trần -> 413 mà không đọc stream", async () => {
    const request = await makeRequest({ headers: { "Content-Length": String(50 * MB) } });
    const fake = fakePayload();
    const response = await handleJobApplication(request, { payload: fake.payload, pipelineDeps: allowed(), now: () => NOW, siteUrl: "https://tami.test" });
    expect(response.status).toBe(413);
    expect(fake.calls.create).not.toHaveBeenCalled();
  });

  it("CV .doc (OLE2) được nhận, lưu với MIME msword", async () => {
    const { response, calls } = await submit({ cv: { bytes: OLE2_DOC, name: "CV.doc", type: "application/msword" } });
    expect(response.status).toBe(200);
    const file = (calls.create.mock.calls[0]![0] as unknown as { file: { name: string; mimetype: string } }).file;
    expect(file).toMatchObject({ mimetype: "application/msword" });
    expect(file.name).toMatch(/\.doc$/);
  });

  it("tạo hồ sơ lỗi -> xoá CV vừa lưu (không mồ côi), 500 chung, log không chứa PII", async () => {
    const failure = new Error(`insert lỗi cho ${CANDIDATE_EMAIL} ${CANDIDATE_PHONE} ${CANDIDATE_NAME}`);
    const { response, body, calls } = await submit({}, { applicationFails: failure });
    expect(response.status).toBe(500);
    expect(body.error).toBe("Hệ thống gặp lỗi, vui lòng thử lại sau");
    expect(JSON.stringify(body)).not.toContain(CANDIDATE_EMAIL);
    expect(calls.delete).toHaveBeenCalledExactlyOnceWith({ collection: "private-files", id: "cv-1", overrideAccess: true });
    expect(calls.queue).not.toHaveBeenCalled();
    const logged = JSON.stringify([...log.error.mock.calls, ...log.warn.mock.calls, ...log.info.mock.calls]);
    for (const secret of [CANDIDATE_EMAIL, CANDIDATE_PHONE, CANDIDATE_NAME, "198.51.100.7"]) {
      expect(logged).not.toContain(secret);
    }
  });

  it("xoá CV mồ côi cũng lỗi -> ghi log cvId + tên lỗi (không PII), vẫn trả 500", async () => {
    const fake = fakePayload({ applicationFails: new Error(`x ${CANDIDATE_EMAIL}`) });
    fake.calls.delete.mockRejectedValueOnce(new Error(`s3 ${CANDIDATE_EMAIL}`));
    const response = await handleJobApplication(await makeRequest(), { payload: fake.payload, pipelineDeps: allowed(), now: () => NOW, siteUrl: "https://tami.test" });
    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith({ cvId: "cv-1", errorName: "Error" }, expect.any(String));
    expect(JSON.stringify(log.error.mock.calls)).not.toContain(CANDIDATE_EMAIL);
  });

  it("hàng đợi email lỗi -> hồ sơ đã lưu vẫn 200 (khách không nộp lại), log không PII", async () => {
    const { response, calls } = await submit({}, { queueFails: true });
    expect(response.status).toBe(200);
    expect(calls.delete).not.toHaveBeenCalled();
    expect(JSON.stringify(log.error.mock.calls)).not.toContain(CANDIDATE_PHONE);
  });

  it("chưa cấu hình notificationEmails -> vẫn lưu, không xếp email; thiếu privacyPolicyVersion -> consentVersion 'unknown' + cảnh báo", async () => {
    const { response, calls } = await submit({}, { notificationEmails: [], privacyPolicyVersion: null });
    expect(response.status).toBe(200);
    expect(calls.queue).not.toHaveBeenCalled();
    expect(calls.create.mock.calls[1]![0]).toMatchObject({ data: { consentVersion: "unknown" } });
    expect(log.warn).toHaveBeenCalled();
  });

  it("Payload từ chối cấu trúc file (PDF hỏng) -> 400 cvInvalid, không phải 500, và không tạo hồ sơ", async () => {
    const fake = fakePayload();
    fake.calls.create.mockRejectedValueOnce(new ValidationError({ errors: [{ message: "Invalid PDF file.", path: "file" }] }));
    const response = await handleJobApplication(await makeRequest({ fields: { locale: "en" } }), { payload: fake.payload, pipelineDeps: allowed(), now: () => NOW, siteUrl: "https://tami.test" });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; details: unknown[] };
    expect(body.error).toBe("The CV file is corrupted or unreadable, please choose another file");
    // Lỗi CV gắn vào ô CV và KHÔNG mang code postingClosed (client không nhầm CV hỏng với tin hết hạn).
    expect(body.details).toEqual([{ field: "cv", message: body.error }]);
    expect(body).not.toHaveProperty("code");
    expect(fake.calls.create).toHaveBeenCalledTimes(1);
  });

  it("lỗi bất ngờ của Payload (APIError) khi lưu CV -> 500, không rò thông điệp gốc", async () => {
    const fake = fakePayload();
    fake.calls.create.mockRejectedValueOnce(new APIError(`s3 lỗi ${CANDIDATE_EMAIL}`, 500));
    const response = await handleJobApplication(await makeRequest(), { payload: fake.payload, pipelineDeps: allowed(), now: () => NOW, siteUrl: "https://tami.test" });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(CANDIDATE_EMAIL);
  });
});
