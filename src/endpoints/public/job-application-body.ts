import { jobApplicationFieldsSchema, type ApplicantLocale, type JobApplicationFields } from "@/shared/types/api";

import type { ValidationOutcome } from "../_middleware/public-pipeline";
import { applicantMessage, fieldMessage } from "./job-application-messages";

const MB = 1024 * 1024;
/** CV tối đa 5MB (ERD §4.11) + chỗ cho các trường chữ và đường biên multipart. File vượt 5MB nhưng lọt trần này do `inspectUpload` trả 413. */
export const MAX_MULTIPART_BYTES = 5 * MB + 256 * 1024;

/** Body vượt trần: dừng đọc ngay, không giữ cả body trong bộ nhớ. */
export class BodyTooLargeError extends Error {
  constructor() {
    super("Body multipart vượt giới hạn");
    this.name = "BodyTooLargeError";
  }
}

export interface MultipartSource {
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
}

async function readBounded(source: MultipartSource, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(source.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError();
  if (!source.body) return new Uint8Array();
  const reader = source.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      // Content-Length thiếu hoặc nói dối (chunked): vẫn chặn theo số byte thực nhận.
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Đọc multipart đúng một lần (Turnstile và validate dùng chung) và có trần dung lượng.
 * `parsed` chỉ có khi đã đọc xong: đường lỗi dùng nó để chọn ngôn ngữ mà không buộc phải đọc body (vd sau 429).
 */
export function createMultipartReader(source: MultipartSource) {
  let pending: Promise<FormData> | undefined;
  const state: { parsed?: FormData; failure?: unknown } = {};
  const parse = async (): Promise<FormData> => {
    const bytes = await readBounded(source, MAX_MULTIPART_BYTES);
    const contentType = source.headers.get("content-type") ?? "";
    return new Response(bytes as BodyInit, { headers: { "content-type": contentType } }).formData();
  };
  return {
    form(): Promise<FormData> {
      pending ??= parse().then(
        (form) => (state.parsed = form),
        (error: unknown) => {
          state.failure = error;
          throw error;
        },
      );
      return pending;
    },
    get parsed() {
      return state.parsed;
    },
    get failure() {
      return state.failure;
    },
  };
}

const TEXT_FIELDS = ["jobPostingId", "fullName", "phone", "email", "message", "consent", "locale"] as const;
/** Trường tuỳ chọn: ô trống của form HTML gửi chuỗi rỗng, coi như không gửi. */
const EMPTY_AS_ABSENT = new Set(["message", "locale"]);

function readTextFields(form: FormData): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const name of TEXT_FIELDS) {
    const value = form.get(name);
    result[name] = typeof value === "string" && !(value === "" && EMPTY_AS_ABSENT.has(name)) ? value : undefined;
  }
  return result;
}

/** Ngôn ngữ ứng viên khai trong form; giá trị lạ hoặc thiếu thì không dùng được. */
export function readDeclaredLocale(form: FormData): ApplicantLocale | undefined {
  const value = form.get("locale");
  return value === "vi" || value === "en" ? value : undefined;
}

export interface JobApplicationSubmission {
  fields: JobApplicationFields;
  cv: File;
}

/** Zod cho trường chữ + có file `cv` không rỗng. Thông điệp lỗi theo ngôn ngữ ứng viên; không echo giá trị đã nhập. */
export function validateSubmission(form: FormData, fallbackLocale: ApplicantLocale): ValidationOutcome<JobApplicationSubmission> {
  const locale = readDeclaredLocale(form) ?? fallbackLocale;
  const details: { field: string; message: string }[] = [];
  const parsed = jobApplicationFieldsSchema.safeParse(readTextFields(form));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      details.push({ field, message: fieldMessage(locale, field) });
    }
  }
  const cv = form.get("cv");
  if (!(cv instanceof File) || cv.size === 0) {
    details.push({ field: "cv", message: applicantMessage(locale, "cvMissing") });
  }
  if (!parsed.success || !(cv instanceof File) || cv.size === 0) return { ok: false, details };
  return { ok: true, value: { fields: parsed.data, cv } };
}
