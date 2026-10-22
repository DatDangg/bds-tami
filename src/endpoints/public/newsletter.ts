import { ValidationError, type Endpoint, type Payload } from "payload";
import { z } from "zod";

import { ok } from "@/lib/http/response";
import { logger } from "@/lib/logger";
import { applicantLocaleSchema, type ApplicantLocale } from "@/shared/types/api";

import { runPublicPipeline, type PublicPipelineDeps, type ValidationOutcome } from "../_middleware/public-pipeline";
import { fieldMessage, localeFromAcceptLanguage } from "./job-application-messages";
import { createJsonBodyReader, declaredLocale, failWithKey, localizePipelineFailure, type LeadRequest } from "./leads";

const log = logger.child({ component: "newsletter" });

const MAX_SOURCE_PATH_CHARS = 500;

/** Chỉ nhận đường dẫn trong site (`/…`, không `//host`); sai hoặc quá dài thì bỏ (trường phụ, không đáng từ chối cả lượt đăng ký). */
const sourcePathSchema = z
  .unknown()
  .transform((value) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value.slice(0, MAX_SOURCE_PATH_CHARS) : undefined));

/** Body `POST /api/public/newsletter` (API_SPEC §3.12). Email cắt khoảng trắng + chữ thường trước khi kiểm, để unique chặn được bản trùng hoa/thường. */
export const newsletterInputSchema = z.object({
  email: z.preprocess((value) => (typeof value === "string" ? value.trim().toLowerCase() : value), z.email().max(254)),
  consent: z.literal(true),
  locale: applicantLocaleSchema.default("vi"),
  sourcePath: sourcePathSchema,
});

export type NewsletterInput = z.infer<typeof newsletterInputSchema>;

export interface NewsletterEndpointDeps {
  payload: Payload;
  pipelineDeps?: PublicPipelineDeps;
  now?: () => Date;
}

async function validateBody(reader: ReturnType<typeof createJsonBodyReader>, fallback: ApplicantLocale): Promise<ValidationOutcome<NewsletterInput>> {
  const body = await reader.json();
  const locale = declaredLocale(body) ?? fallback;
  const parsed = newsletterInputSchema.safeParse(body);
  if (parsed.success) return { ok: true, value: parsed.data };
  // Không echo email đã nhập: chỉ tên trường + thông điệp theo ngôn ngữ khách.
  const fields = new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")));
  return { ok: false, details: [...fields].map((field) => ({ field, message: fieldMessage(locale, field) })) };
}

async function readPolicyVersion(payload: Payload): Promise<string> {
  const settings = await payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true });
  const version = settings.privacyPolicyVersion?.trim();
  if (!version) log.warn("site-settings chưa có privacyPolicyVersion, ghi privacyPolicyVersion = unknown");
  return version || "unknown";
}

/** Lỗi unique của `email` (2 request cùng email chạy song song): bản kia đã tạo xong, coi như đã đăng ký. */
function isDuplicateEmail(error: unknown): boolean {
  return error instanceof ValidationError && error.data.errors.some((issue) => issue.path === "email");
}

/**
 * Đăng ký / bật lại. Email đã `active`: không đổi gì (giữ bằng chứng đồng ý lần đầu). `unsubscribed`: bật lại `active` + ghi consent mới.
 * Ghi bằng `overrideAccess` vì collection khoá tạo qua REST và khoá sửa các field consent (chỉ đường này được ghi).
 */
async function subscribe(payload: Payload, input: NewsletterInput, now: Date): Promise<void> {
  const consent = {
    locale: input.locale,
    consentAt: now.toISOString(),
    privacyPolicyVersion: await readPolicyVersion(payload),
    sourcePath: input.sourcePath ?? null,
  };
  const existing = await payload.find({
    collection: "newsletter-subscribers",
    where: { email: { equals: input.email } },
    select: { status: true },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const found = existing.docs[0];
  if (found) {
    if (found.status === "active") return;
    await payload.update({ collection: "newsletter-subscribers", id: found.id, data: { ...consent, status: "active" }, depth: 0, overrideAccess: true });
    return;
  }
  try {
    await payload.create({ collection: "newsletter-subscribers", data: { ...consent, email: input.email, status: "active" }, depth: 0, overrideAccess: true });
  } catch (error) {
    if (!isDuplicateEmail(error)) throw error;
  }
}

/**
 * Thứ tự (PERMISSION §5, như form lead): rate limit `newsletter` 5/10 phút/IP -> Turnstile -> validate zod (email, `consent === true`)
 * -> tạo / bật lại. Mọi trường hợp đăng ký được (mới, đã có, bật lại, đua nhau) trả CÙNG một phản hồi: không lộ email đã đăng ký.
 * Lỗi bất ngờ trả 500 chung, log chỉ có tên lỗi (không email).
 */
export async function handleNewsletter(request: LeadRequest, deps: NewsletterEndpointDeps): Promise<Response> {
  const reader = createJsonBodyReader(request);
  const headerLocale = localeFromAcceptLanguage(request.headers.get("accept-language"));
  const result = await runPublicPipeline(
    {
      request: new Request("http://localhost/api/public/newsletter", { method: "POST", headers: request.headers }),
      endpoint: "newsletter",
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
    await subscribe(deps.payload, result.value, (deps.now ?? (() => new Date()))());
    return ok({ received: true });
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "đăng ký bản tin thất bại");
    return failWithKey(500, result.value.locale, "serverError");
  }
}

export const newsletterEndpoint: Endpoint = {
  path: "/public/newsletter",
  method: "post",
  handler: (req) => handleNewsletter({ headers: req.headers, text: () => req.text!(), body: req.body }, { payload: req.payload }),
};
