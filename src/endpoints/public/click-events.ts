import type { Endpoint, PayloadRequest } from "payload";
import { z } from "zod";

import { runPublicPipeline, type PublicPipelineDeps, type ValidationOutcome } from "../_middleware/public-pipeline";
import { CLICK_REF_COLLECTIONS, CLICK_TYPES } from "../../lib/click-stats/click-types";

/** Body hợp lệ chỉ vài chục byte; chặn sớm body lớn bất thường trước khi parse. */
const MAX_BODY_CHARS = 2_000;

export const clickEventBodySchema = z.object({
  type: z.enum(CLICK_TYPES),
  // Đường dẫn nội bộ: "//host" và "/\host" là URL cùng giao thức (protocol-relative) chứ không phải đường dẫn trên site.
  pagePath: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .startsWith("/")
    .refine((path) => !path.startsWith("//") && !path.startsWith("/\\"), "Phải là đường dẫn nội bộ"),
  refCollection: z.enum(CLICK_REF_COLLECTIONS).nullish(),
  refId: z.string().max(64).regex(/^[A-Za-z0-9_-]+$/).nullish(),
});

export type ClickEventInput = z.infer<typeof clickEventBodySchema>;

/** Phần của request mà endpoint cần; `Request` chuẩn và `PayloadRequest` đều đáp ứng (đọc body chỉ sau rate limit). */
export interface ClickEventRequest {
  headers: Headers;
  text: () => Promise<string>;
}

/**
 * `navigator.sendBeacon` gửi Blob có thể mang Content-Type `text/plain`, nên đọc body dạng chữ rồi tự parse JSON
 * thay vì `request.json()` (không phụ thuộc Content-Type).
 */
export async function validateClickEventBody(request: ClickEventRequest): Promise<ValidationOutcome<ClickEventInput>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return { ok: false, details: [{ message: "Nội dung quá lớn" }] };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, details: [{ message: "Nội dung không phải JSON" }] };
  }
  const parsed = clickEventBodySchema.safeParse(json);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, details: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) };
}

/**
 * Chuỗi bảo vệ (rate limit 30/phút/IP, không Turnstile) -> validate -> ghi -> 204.
 * Redis lỗi thì pipeline trả 503 (API_SPEC §2), không bỏ qua rate limit.
 */
export async function handleClickEvent(
  request: ClickEventRequest,
  saveClickEvent: (input: ClickEventInput) => Promise<void>,
  pipelineDeps?: PublicPipelineDeps,
): Promise<Response> {
  const result = await runPublicPipeline(
    {
      // Pipeline chỉ dùng header của request này để xác định IP.
      request: new Request("http://localhost/api/public/click-events", { method: "POST", headers: request.headers }),
      endpoint: "click-events",
      turnstile: false,
      validate: () => validateClickEventBody(request),
    },
    pipelineDeps,
  );
  if (!result.ok) return result.response;
  await saveClickEvent(result.value);
  return new Response(null, { status: 204 });
}

function createClickEventSaver(req: PayloadRequest) {
  return async (input: ClickEventInput): Promise<void> => {
    await req.payload.create({
      collection: "click-events",
      data: {
        type: input.type,
        pagePath: input.pagePath,
        refCollection: input.refCollection ?? undefined,
        refId: input.refId ?? undefined,
      },
      // Khách chưa đăng nhập: collection không cho ai tạo qua API, ghi bằng Local API từ code server.
      overrideAccess: true,
    });
  };
}

export const clickEventsEndpoint: Endpoint = {
  path: "/public/click-events",
  method: "post",
  handler: (req) =>
    handleClickEvent({ headers: req.headers, text: () => req.text!() }, createClickEventSaver(req)),
};
