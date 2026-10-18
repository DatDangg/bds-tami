import { randomUUID } from "node:crypto";
import { APIError, ValidationError, type Endpoint, type Payload } from "payload";

import { isPastDeadline } from "@/lib/careers/deadline";
import { getEnv } from "@/lib/env";
import { fail, ok } from "@/lib/http/response";
import { logger } from "@/lib/logger";
import { inspectUpload, PRIVATE_FILE_POLICY, type InspectedUpload } from "@/lib/upload/validate-file";
import { API_ERROR_CODES, type ApiErrorCode, type ApplicantLocale, type JobApplicationFields } from "@/shared/types/api";

import { runPublicPipeline, type PublicPipelineDeps } from "../_middleware/public-pipeline";
import {
  BodyTooLargeError,
  createMultipartReader,
  readDeclaredLocale,
  validateSubmission,
  type JobApplicationSubmission,
  type MultipartSource,
} from "./job-application-body";
import { applicantMessage, localeFromAcceptLanguage, type ApplicantMessageKey } from "./job-application-messages";

const log = logger.child({ component: "job-applications" });

export interface JobApplicationDeps {
  payload: Payload;
  pipelineDeps?: PublicPipelineDeps;
  now?: () => Date;
  /** Gốc URL của site để dựng link vào trang quản trị trong email; mặc định `NEXT_PUBLIC_SITE_URL`. */
  siteUrl?: string;
}

interface OpenPosting {
  id: string;
  title: string;
}

/** Chỉ tin `published`, chưa xoá mềm (find mặc định bỏ bản trong thùng rác), chưa quá hạn. Mọi trường hợp khác -> null. */
async function findOpenPosting(payload: Payload, id: string, now: Date): Promise<OpenPosting | null> {
  const found = await payload.find({
    collection: "job-postings",
    where: { and: [{ id: { equals: id } }, { status: { equals: "published" } }] },
    limit: 1,
    depth: 0,
    locale: "vi",
    fallbackLocale: false,
    overrideAccess: true,
    select: { title: true, deadline: true },
  });
  const posting = found.docs[0];
  if (!posting || isPastDeadline(posting.deadline, now)) return null;
  return { id: posting.id, title: posting.title ?? "" };
}

function failWithKey(status: number, locale: ApplicantLocale, key: ApplicantMessageKey, details: unknown[] = [], code?: ApiErrorCode): Response {
  return fail(status, applicantMessage(locale, key), details, code);
}

/** Lỗi do file CV: kèm `details` field `cv` để client gắn vào ô CV (tin hết hạn là lỗi khác, có `code: "postingClosed"`). */
function failCv(status: number, locale: ApplicantLocale, key: ApplicantMessageKey): Response {
  const message = applicantMessage(locale, key);
  return fail(status, message, [{ field: "cv", message }]);
}

/** Pipeline dùng thông điệp tiếng Việt cố định; dịch lại theo ngôn ngữ ứng viên, giữ chữ "captcha" (client nhận lỗi captcha qua chữ này). */
async function localizePipelineFailure(
  response: Response,
  reader: ReturnType<typeof createMultipartReader>,
  headers: Headers,
): Promise<Response> {
  const locale =
    (reader.parsed && readDeclaredLocale(reader.parsed)) || localeFromAcceptLanguage(headers.get("accept-language"));
  if (reader.failure instanceof BodyTooLargeError) return failWithKey(413, locale, "bodyTooLarge");
  if (response.status === 429) {
    const limited = failWithKey(429, locale, "rateLimited");
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) limited.headers.set("Retry-After", retryAfter);
    return limited;
  }
  if (response.status === 503) return failWithKey(503, locale, "unavailable");
  const body = (await response.json()) as { error?: string; details?: unknown[] };
  if (/captcha/i.test(body.error ?? "")) return failWithKey(400, locale, "captcha");
  return failWithKey(400, locale, "invalidInput", body.details ?? []);
}

/** Nhận diện bằng magic bytes: đuôi/Content-Type client gửi không có giá trị. Trả `Response` lỗi (413/415/400) thay vì ném. */
async function inspectCv(bytes: Uint8Array, locale: ApplicantLocale): Promise<InspectedUpload | Response> {
  try {
    return await inspectUpload(bytes, PRIVATE_FILE_POLICY);
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    const key = error.status === 413 ? "cvTooLarge" : error.status === 415 ? "cvUnsupported" : "cvMissing";
    return failCv(error.status, locale, key);
  }
}

/** Payload còn kiểm cấu trúc file (vd PDF thiếu xref/%%EOF): lỗi đó là do file của ứng viên, trả 400 chứ không phải 500. */
async function storeCv(
  payload: Payload,
  bytes: Uint8Array,
  inspected: InspectedUpload,
  locale: ApplicantLocale,
): Promise<string | Response> {
  try {
    return await createCvFile(payload, bytes, inspected);
  } catch (error) {
    if (error instanceof ValidationError) return failCv(400, locale, "cvInvalid");
    throw error;
  }
}

async function createCvFile(payload: Payload, bytes: Uint8Array, inspected: InspectedUpload): Promise<string> {
  const stored = await payload.create({
    collection: "private-files",
    data: {},
    file: {
      data: Buffer.from(bytes),
      mimetype: inspected.mime,
      name: `${randomUUID()}.${inspected.extension}`,
      size: bytes.byteLength,
    },
    depth: 0,
    overrideAccess: true,
  });
  return stored.id;
}

/** S3 không rollback theo DB: tạo hồ sơ lỗi thì phải xoá CV vừa lưu (dòng `private-files` + object; hook `beforeDelete` xoá object và ném nếu S3 lỗi) để không mồ côi dữ liệu cá nhân; lỗi thì log, job `data-retention` dọn sau. */
async function removeOrphanCv(payload: Payload, cvId: string): Promise<void> {
  try {
    await payload.delete({ collection: "private-files", id: cvId, overrideAccess: true });
  } catch (error) {
    log.error({ cvId, errorName: error instanceof Error ? error.name : "unknown" }, "không xoá được CV mồ côi sau khi tạo hồ sơ lỗi");
  }
}

async function readSiteSettings(payload: Payload): Promise<{ consentVersion: string; notificationEmails: string[] }> {
  const settings = await payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true });
  const consentVersion = settings.privacyPolicyVersion?.trim();
  if (!consentVersion) log.warn("site-settings chưa có privacyPolicyVersion, ghi consentVersion = unknown");
  return {
    consentVersion: consentVersion || "unknown",
    notificationEmails: (settings.notificationEmails ?? []).map((row) => row.email),
  };
}

async function createApplication(
  payload: Payload,
  args: { fields: JobApplicationFields; postingId: string; cvId: string; consentVersion: string; ipHash: string; now: Date },
): Promise<string> {
  const { fields } = args;
  const created = await payload.create({
    collection: "job-applications",
    data: {
      jobPosting: args.postingId,
      status: "new",
      fullName: fields.fullName,
      phone: fields.phone,
      email: fields.email,
      ...(fields.message ? { message: fields.message } : {}),
      cv: args.cvId,
      consentAt: args.now.toISOString(),
      consentVersion: args.consentVersion,
      locale: fields.locale,
      ipHash: args.ipHash,
    },
    depth: 0,
    // Collection không cho ai tạo qua API (PERMISSION §3.3): khách chỉ vào được bằng endpoint này, sau Turnstile + rate limit.
    overrideAccess: true,
  });
  return created.id;
}

/**
 * Hồ sơ đã lưu thì khách đã nộp xong: lỗi hàng đợi chỉ ghi log (không trả lỗi để khách khỏi nộp lại thành hồ sơ trùng).
 * Log không có tên/email người nộp.
 */
async function queueAdminEmail(
  deps: JobApplicationDeps,
  args: { recipients: string[]; applicationId: string; posting: OpenPosting; fields: JobApplicationFields },
): Promise<void> {
  if (args.recipients.length === 0) {
    log.warn({ applicationId: args.applicationId }, "site-settings.notificationEmails trống, bỏ qua email hồ sơ ứng tuyển");
    return;
  }
  try {
    const siteUrl = (deps.siteUrl ?? getEnv().NEXT_PUBLIC_SITE_URL).replace(/\/+$/, "");
    await deps.payload.jobs.queue({
      task: "send-notification-email",
      input: {
        template: "job-application",
        to: args.recipients,
        data: {
          applicantName: args.fields.fullName,
          jobTitle: args.posting.title || "(chưa có tiêu đề)",
          language: args.fields.locale,
          applicationUrl: `${siteUrl}/admin/collections/job-applications/${args.applicationId}`,
        },
      },
    });
  } catch (error) {
    log.error({ applicationId: args.applicationId, errorName: error instanceof Error ? error.name : "unknown" }, "không xếp được email hồ sơ ứng tuyển");
  }
}

async function processApplication(
  deps: JobApplicationDeps,
  submission: JobApplicationSubmission,
  ipHash: string,
): Promise<Response> {
  const { fields, cv } = submission;
  const now = (deps.now ?? (() => new Date()))();
  const posting = await findOpenPosting(deps.payload, fields.jobPostingId, now);
  if (!posting) return failWithKey(400, fields.locale, "postingClosed", [], API_ERROR_CODES.postingClosed);

  const bytes = new Uint8Array(await cv.arrayBuffer());
  const inspected = await inspectCv(bytes, fields.locale);
  if (inspected instanceof Response) return inspected;

  const { consentVersion, notificationEmails } = await readSiteSettings(deps.payload);
  const cvId = await storeCv(deps.payload, bytes, inspected, fields.locale);
  if (cvId instanceof Response) return cvId;
  let applicationId: string;
  try {
    applicationId = await createApplication(deps.payload, { fields, postingId: posting.id, cvId, consentVersion, ipHash, now });
  } catch (error) {
    await removeOrphanCv(deps.payload, cvId);
    throw error;
  }
  await queueAdminEmail(deps, { recipients: notificationEmails, applicationId, posting, fields });
  return ok({ received: true });
}

/**
 * Thứ tự (PERMISSION §5): rate limit 3/giờ/IP -> Turnstile -> validate (zod + có CV) -> vị trí còn nhận hồ sơ -> kiểm CV theo
 * nội dung -> lưu CV private -> tạo hồ sơ -> xếp email. Lỗi bất ngờ trả 500 chung, log chỉ có tên lỗi (không dữ liệu ứng viên).
 */
export async function handleJobApplication(request: MultipartSource, deps: JobApplicationDeps): Promise<Response> {
  const reader = createMultipartReader(request);
  const result = await runPublicPipeline(
    {
      request: new Request("http://localhost/api/public/job-applications", { method: "POST", headers: request.headers }),
      endpoint: "job-applications",
      turnstile: { readToken: async () => (await reader.form()).get("turnstileToken") },
      validate: async () =>
        validateSubmission(await reader.form(), localeFromAcceptLanguage(request.headers.get("accept-language"))),
    },
    deps.pipelineDeps,
  );
  if (!result.ok) return localizePipelineFailure(result.response, reader, request.headers);
  try {
    return await processApplication(deps, result.value, result.ipHash);
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "xử lý hồ sơ ứng tuyển thất bại");
    return failWithKey(500, result.value.fields.locale, "serverError");
  }
}

export const jobApplicationsEndpoint: Endpoint = {
  path: "/public/job-applications",
  method: "post",
  handler: (req) => handleJobApplication({ headers: req.headers, body: req.body ?? null }, { payload: req.payload }),
};
