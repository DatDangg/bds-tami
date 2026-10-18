import type { Access, Endpoint, PayloadRequest, Where } from "payload";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { fail, ok } from "@/lib/http/response";
import { parseTranslationEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkEndpointRateLimit, RateLimitUnavailableError } from "@/lib/security/rate-limit";
import { isTranslationEnabled, queueTranslation } from "@/hooks/translation/enqueue-translation";
import { TRANSLATABLE_COLLECTIONS, TRANSLATABLE_GLOBALS } from "@/lib/translation/allowlist";

const log = logger.child({ component: "retranslate" });

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Cùng một thông báo cho mọi trường hợp ngoài phạm vi (không có bản ghi, không đủ quyền sửa, ngoài allowlist): không để sale dò bài của người khác. */
const NOT_FOUND_MESSAGE = "Không tìm thấy nội dung";
/** Dịch lại bằng AI là thao tác của người dùng: job chạy ngay (không chờ cửa sổ debounce của hook tự dịch). */
const NO_DEBOUNCE_MS = 0;

export const GLOBALS_SEGMENT = "globals";

export type RetranslateRateLimit = typeof checkEndpointRateLimit;

async function checkRetranslateRateLimit(rateLimit: RetranslateRateLimit, userId: string): Promise<Response | null> {
  let limit: Awaited<ReturnType<RetranslateRateLimit>>;
  try {
    limit = await rateLimit("admin-retranslate", userId);
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) throw error;
    log.error({ errorName: error.name }, "không kiểm tra được giới hạn dịch lại");
    return fail(503, "Hệ thống tạm thời chưa dịch lại được, thử lại sau");
  }
  if (limit.allowed) return null;
  const limited = fail(429, "Bạn đã yêu cầu dịch lại quá nhiều lần, thử lại sau");
  limited.headers.set("Retry-After", String(limit.retryAfterSeconds));
  limited.headers.set("Cache-Control", "no-store");
  return limited;
}

/** Dịch tắt (site-settings) hoặc hạn mức tháng = 0 thì job sẽ bỏ qua êm: báo rõ thay vì "đã xếp hàng". Thiếu cấu hình dịch: 503. */
async function translationUnavailable(req: PayloadRequest): Promise<Response | null> {
  if (!(await isTranslationEnabled(req))) return fail(409, "Dịch tự động đang tắt trong Cài đặt chung");
  let budget: number;
  try {
    budget = parseTranslationEnv(process.env).TRANSLATION_MONTHLY_BUDGET_USD;
  } catch {
    return fail(503, "Dịch tự động chưa được cấu hình");
  }
  return budget > 0 ? null : fail(409, "Dịch tự động đang tắt (hạn mức dịch tháng bằng 0)");
}

/** `true`/`false` hoặc điều kiện lọc theo kết quả `access.update` của collection/global (chính quyền sửa bài của admin UI, không viết lại luật ở đây). */
async function updateScope(req: PayloadRequest, access: Access | undefined, id?: string): Promise<boolean | Where> {
  if (!access) return Boolean(req.user);
  return access({ req, id });
}

async function canEditCollectionDoc(req: PayloadRequest, slug: string, id: string): Promise<boolean> {
  const config = req.payload.collections[slug as keyof typeof req.payload.collections]?.config;
  if (!config) return false;
  const scope = await updateScope(req, config.access?.update, id);
  if (scope === false) return false;
  const found = await req.payload.find({
    collection: slug as never,
    where: scope === true ? { id: { equals: id } } : { and: [{ id: { equals: id } }, scope] },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  return found.docs.length > 0;
}

async function canEditGlobal(req: PayloadRequest, slug: string): Promise<boolean> {
  const config = req.payload.globals.config.find((global) => global.slug === slug);
  if (!config) return false;
  return (await updateScope(req, config.access?.update)) === true;
}

/**
 * Thứ tự (API_SPEC §5.1, PERMISSION §4): đăng nhập + còn hoạt động (401) -> `:collection` trong allowlist dịch và `:id` đúng dạng (404, `leads`... không bao giờ
 * tới được đây) -> rate limit 30 lần/giờ/user (429, Redis lỗi 503) -> quyền sửa bản ghi theo `access.update` của chính collection/global (admin; sale là `author`;
 * `services`/`pages`/globals chỉ admin); không có quyền hoặc không có bản ghi đều là 404 -> dịch đang tắt / hạn mức 0 (409) hoặc chưa cấu hình (503) -> audit `content.retranslate` (fail-closed: ghi lỗi thì 500, không xếp job)
 * -> xếp job `translate-content` với `force: true` -> 202.
 */
export async function handleRetranslate(
  req: PayloadRequest,
  collection: string | undefined,
  id: string | undefined,
  rateLimit: RetranslateRateLimit = checkEndpointRateLimit,
): Promise<Response> {
  if (!req.user || req.user.active !== true) return fail(401, "Chưa đăng nhập");

  const isGlobal = collection === GLOBALS_SEGMENT;
  const allowed = isGlobal ? (TRANSLATABLE_GLOBALS as readonly string[]).includes(id ?? "") : (TRANSLATABLE_COLLECTIONS as readonly string[]).includes(collection ?? "") && UUID_PATTERN.test(id ?? "");
  if (!allowed || !collection || !id) return fail(404, NOT_FOUND_MESSAGE);

  const blocked = await checkRetranslateRateLimit(rateLimit, req.user.id);
  if (blocked) return blocked;

  const editable = isGlobal ? await canEditGlobal(req, id) : await canEditCollectionDoc(req, collection, id);
  if (!editable) return fail(404, NOT_FOUND_MESSAGE);

  const unavailable = await translationUnavailable(req);
  if (unavailable) return unavailable;

  const slug = isGlobal ? id : collection;
  try {
    await writeAuditLog({
      actor: req.user,
      action: "content.retranslate",
      collection: slug,
      docId: id,
      summary: `Dịch lại bằng AI: ${slug}`,
      req,
    });
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "không ghi được audit dịch lại, huỷ yêu cầu");
    return fail(500, "Không thể yêu cầu dịch lại");
  }

  await queueTranslation(
    req,
    isGlobal ? { kind: "global", slug, force: true } : { kind: "collection", slug, docId: id, force: true },
    { debounceMs: NO_DEBOUNCE_MS },
  );
  return ok({ queued: true }, 202);
}

export const retranslateEndpoint: Endpoint = {
  path: "/admin/translations/:collection/:id",
  method: "post",
  handler: async (req) => {
    try {
      return await handleRetranslate(req, req.routeParams?.collection as string | undefined, req.routeParams?.id as string | undefined);
    } catch (error) {
      log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "dịch lại thất bại");
      return fail(500, "Không thể yêu cầu dịch lại");
    }
  },
};
