import type { Endpoint, Payload } from "payload";

import { publicWhere } from "@/lib/content/public-queries";
import { getEnv } from "@/lib/env";
import { fail, ok } from "@/lib/http/response";
import { createOrMergeLead } from "@/lib/leads/create-or-merge";
import { hasSourceRecord, type LeadSource } from "@/lib/leads/lead-values";
import { logger } from "@/lib/logger";
import { leadInputSchema, type ApplicantLocale, type LeadInput } from "@/shared/types/api";

import { runPublicPipeline, type PublicPipelineDeps, type ValidationOutcome } from "../_middleware/public-pipeline";
import { applicantMessage, fieldMessage, localeFromAcceptLanguage, type ApplicantMessageKey } from "./job-application-messages";

const log = logger.child({ component: "leads" });

/** Body hợp lệ chỉ vài trăm byte; chặn sớm body lớn bất thường (UTM/URL đã được cắt ở schema). */
const MAX_BODY_CHARS = 16_000;
const MAX_USER_AGENT_CHARS = 500;
/** Trần theo byte khi đọc stream (UTF-8 tối đa 4 byte/ký tự); sau khi giải mã vẫn so lại theo ký tự. */
const MAX_BODY_BYTES = MAX_BODY_CHARS * 4;

/** Collection của bản ghi nguồn; khách chỉ gửi lead cho bản ghi đang công khai (tin `rented` vẫn nhận, FR-PUB-13). */
const SOURCE_COLLECTION = { rental: "rentals", property_post: "property-posts", project: "projects" } as const satisfies Partial<
  Record<LeadSource, string>
>;

/** Phần của request mà endpoint cần; `PayloadRequest` đáp ứng. Body chỉ được đọc sau rate limit. */
export interface LeadRequest {
  headers: Headers;
  text: () => Promise<string>;
  /** Stream body gốc: có thì đọc có giới hạn (body chunked không có `Content-Length` không được đọc hết vào bộ nhớ). */
  body?: ReadableStream<Uint8Array> | null;
}

export interface LeadEndpointDeps {
  payload: Payload;
  pipelineDeps?: PublicPipelineDeps;
  now?: () => Date;
  /** Gốc URL của site để dựng link vào trang quản trị trong email; mặc định `NEXT_PUBLIC_SITE_URL`. */
  siteUrl?: string;
}

/** Đọc stream và dừng ngay khi vượt `MAX_BODY_BYTES` (huỷ stream, không giữ phần thừa). */
async function readBoundedText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    bytes += value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("body quá lớn");
    }
    text += decoder.decode(value, { stream: true });
  }
}

/** Đọc body đúng một lần (Turnstile và validate dùng chung). Body hỏng/quá lớn ném lỗi: pipeline đổi thành 400. */
export function createJsonBodyReader(request: LeadRequest) {
  let pending: Promise<unknown> | undefined;
  const state: { parsed?: unknown } = {};
  const parse = async (): Promise<unknown> => {
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_CHARS) throw new Error("body quá lớn");
    const raw = request.body ? await readBoundedText(request.body) : await request.text();
    if (raw.length > MAX_BODY_CHARS) throw new Error("body quá lớn");
    return JSON.parse(raw);
  };
  return {
    json(): Promise<unknown> {
      pending ??= parse().then((value) => (state.parsed = value));
      return pending;
    },
    /** Chỉ có khi đã đọc xong: đường lỗi dùng để chọn ngôn ngữ mà không buộc phải đọc body (vd sau 429). */
    get parsed() {
      return state.parsed;
    },
  };
}

export function declaredLocale(body: unknown): ApplicantLocale | undefined {
  const value = typeof body === "object" && body !== null ? (body as { locale?: unknown }).locale : undefined;
  return value === "vi" || value === "en" ? value : undefined;
}

export function failWithKey(status: number, locale: ApplicantLocale, key: ApplicantMessageKey, details: unknown[] = []): Response {
  return fail(status, applicantMessage(locale, key), details);
}

/** Pipeline dùng thông điệp tiếng Việt cố định; dịch lại theo ngôn ngữ khách, giữ chữ "captcha" (client nhận lỗi captcha qua chữ này). */
export async function localizePipelineFailure(response: Response, locale: ApplicantLocale): Promise<Response> {
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

async function validateBody(reader: ReturnType<typeof createJsonBodyReader>, fallback: ApplicantLocale): Promise<ValidationOutcome<LeadInput>> {
  const body = await reader.json();
  const locale = declaredLocale(body) ?? fallback;
  const parsed = leadInputSchema.safeParse(body);
  if (parsed.success) return { ok: true, value: parsed.data };
  // Không echo giá trị đã nhập: chỉ tên trường + thông điệp theo ngôn ngữ khách.
  const fields = new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")));
  return { ok: false, details: [...fields].map((field) => ({ field, message: fieldMessage(locale, field) })) };
}

/** Bản ghi nguồn phải đang công khai (không nháp, không xoá mềm; tin cho thuê `rented` vẫn nhận). Một truy vấn, không kéo dữ liệu về. */
async function isPublicSource(payload: Payload, input: LeadInput): Promise<boolean> {
  if (!hasSourceRecord(input.source) || !input.sourceId) return true;
  const collection = SOURCE_COLLECTION[input.source];
  const found = await payload.find({
    collection,
    where: { and: [publicWhere(collection, "vi"), { id: { equals: input.sourceId } }] },
    limit: 1,
    depth: 0,
    select: {},
    overrideAccess: true,
    trash: false,
  });
  return found.docs.length > 0;
}

async function readConsentSettings(payload: Payload): Promise<{ consentVersion: string; notificationEmails: string[] }> {
  const settings = await payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true });
  const consentVersion = settings.privacyPolicyVersion?.trim();
  if (!consentVersion) log.warn("site-settings chưa có privacyPolicyVersion, ghi consentVersion = unknown");
  return {
    consentVersion: consentVersion || "unknown",
    notificationEmails: (settings.notificationEmails ?? []).map((row) => row.email),
  };
}

async function processLead(deps: LeadEndpointDeps, request: LeadRequest, input: LeadInput, ipHash: string): Promise<Response> {
  if (!(await isPublicSource(deps.payload, input))) {
    return failWithKey(400, input.locale, "invalidInput", [{ field: "sourceId", message: fieldMessage(input.locale, "sourceId") }]);
  }
  const settings = await readConsentSettings(deps.payload);
  const userAgent = request.headers.get("user-agent")?.slice(0, MAX_USER_AGENT_CHARS);
  await createOrMergeLead(deps.payload, input, {
    ipHash,
    userAgent: userAgent || undefined,
    consentVersion: settings.consentVersion,
    notificationEmails: settings.notificationEmails,
    siteUrl: (deps.siteUrl ?? getEnv().NEXT_PUBLIC_SITE_URL).replace(/\/+$/, ""),
    now: (deps.now ?? (() => new Date()))(),
  });
  // Cùng một phản hồi cho tạo mới và gộp: không lộ SĐT này đã từng gửi (API_SPEC §3.1).
  return ok({ received: true });
}

/**
 * Thứ tự (PERMISSION §5): rate limit 5/10 phút/IP -> Turnstile -> validate zod (consent `true`, SĐT VN) -> nguồn đang công khai
 * -> chống trùng 7 ngày + tạo/gộp + tự giao + xếp email (một transaction). Lỗi bất ngờ trả 500 chung, log chỉ có tên lỗi (không PII).
 */
export async function handleLead(request: LeadRequest, deps: LeadEndpointDeps): Promise<Response> {
  const reader = createJsonBodyReader(request);
  const headerLocale = localeFromAcceptLanguage(request.headers.get("accept-language"));
  const result = await runPublicPipeline(
    {
      request: new Request("http://localhost/api/public/leads", { method: "POST", headers: request.headers }),
      endpoint: "leads",
      turnstile: {
        readToken: async () => {
          const body = await reader.json();
          return typeof body === "object" && body !== null ? (body as { turnstileToken?: unknown }).turnstileToken : undefined;
        },
      },
      validate: () => validateBody(reader, headerLocale),
    },
    deps.pipelineDeps,
  );
  if (!result.ok) return localizePipelineFailure(result.response, declaredLocale(reader.parsed) ?? headerLocale);
  try {
    return await processLead(deps, request, result.value, result.ipHash);
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "xử lý lead thất bại");
    return failWithKey(500, result.value.locale, "serverError");
  }
}

export const leadsEndpoint: Endpoint = {
  path: "/public/leads",
  method: "post",
  handler: (req) => handleLead({ headers: req.headers, text: () => req.text!(), body: req.body }, { payload: req.payload }),
};
