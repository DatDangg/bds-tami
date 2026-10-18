import type { Endpoint, PayloadRequest } from "payload";

import { isAdmin } from "@/access";
import { APPROVE_ENGLISH_CONTEXT_KEY } from "@/hooks/pages/approve-english";
import { missingEnglishFields } from "@/hooks/require-english-fields";
import { fail, ok } from "@/lib/http/response";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "approve-english" });

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_REQUIRED_FIELDS = ["title", "content"] as const;

/**
 * Duyệt bản EN của trang pháp lý (BR-08), đường DUY NHẤT bật `hasEnglish` của `pages` (hook `guardEnglishApproval` giữ nguyên giá trị với mọi request khác).
 * Duyệt được MỌI bản EN khi `hasEnglish` còn tắt: bản AI chờ duyệt, bản admin sửa/dán tay, kể cả khi dịch tự động đang tắt.
 * Thứ tự: đăng nhập + còn hoạt động (401) -> admin (403, kể cả id không tồn tại) -> id UUID (400) -> trang tồn tại, chưa xoá mềm (404)
 * -> `hasEnglish` đã bật (409) -> bản EN đủ trường bắt buộc (422 kèm danh sách trường thiếu, không phải 500) -> update có cờ duyệt. Audit
 * `content.approve_translation` và chuyển status `done` do hook `approveEnglish` làm cùng transaction (fail-closed: audit lỗi thì lần duyệt rollback, 500).
 */
export async function handleApproveEnglish(req: PayloadRequest, id: string | undefined): Promise<Response> {
  if (!req.user || req.user.active !== true) return fail(401, "Chưa đăng nhập");
  if (!isAdmin({ req })) return fail(403, "Không có quyền");
  if (!id || !UUID_PATTERN.test(id)) return fail(400, "Mã trang không hợp lệ");

  const page = await req.payload.findByID({ collection: "pages", id, depth: 0, overrideAccess: true, disableErrors: true });
  if (!page) return fail(404, "Không tìm thấy trang");
  if (page.hasEnglish === true) return fail(409, "Bản tiếng Anh đã được duyệt");

  const english = (await req.payload.findByID({ collection: "pages", id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
  const missing = missingEnglishFields(requiredEnglishFields(req), english);
  if (missing.length > 0) {
    return fail(
      422,
      "Bản tiếng Anh chưa đủ nội dung để duyệt",
      missing.map((path) => ({ path: [path], message: "Cần nhập bản tiếng Anh trước khi duyệt." })),
    );
  }

  const updated = await req.payload.update({
    collection: "pages",
    id,
    data: { hasEnglish: true },
    req,
    user: req.user,
    overrideAccess: false,
    depth: 0,
    context: { [APPROVE_ENGLISH_CONTEXT_KEY]: true },
  });
  return ok({ id: updated.id, hasEnglish: updated.hasEnglish === true });
}

function requiredEnglishFields(req: PayloadRequest): readonly string[] {
  const custom = req.payload.collections.pages.config.custom as { englishRequiredFields?: readonly string[] } | undefined;
  return custom?.englishRequiredFields ?? DEFAULT_REQUIRED_FIELDS;
}

export const approveEnglishEndpoint: Endpoint = {
  path: "/admin/translations/pages/:id/approve",
  method: "post",
  handler: async (req) => {
    try {
      return await handleApproveEnglish(req, req.routeParams?.id as string | undefined);
    } catch (error) {
      log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "duyệt bản EN thất bại");
      return fail(500, "Không thể duyệt bản tiếng Anh");
    }
  },
};
