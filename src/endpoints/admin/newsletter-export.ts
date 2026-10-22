import type { Endpoint, PayloadRequest, Where } from "payload";

import { isAdmin } from "@/access";
import { NEWSLETTER_STATUS_LABELS, NEWSLETTER_STATUSES, type NewsletterStatus } from "@/collections/NewsletterSubscribers";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createXlsxStream, type CellValue } from "@/lib/export/xlsx-stream";
import { buildAttachmentDisposition } from "@/lib/http/content-disposition";
import { fail } from "@/lib/http/response";
import { logger } from "@/lib/logger";
import { checkEndpointRateLimit } from "@/lib/security/rate-limit";
import type { NewsletterSubscriber } from "@/payload-types";

import { afterCursor, checkExportRateLimit, formatTime, XLSX_CONTENT_TYPE, type LeadsExportRateLimit } from "./leads-export";

const log = logger.child({ component: "newsletter-export" });

/** Trần số dòng một lần xuất (cùng mức xuất lead): vượt thì từ chối, không kéo cả bảng qua một request. */
export const MAX_NEWSLETTER_EXPORT_ROWS = 20_000;
const PAGE_SIZE = 500;

export const NEWSLETTER_EXPORT_COLUMNS = ["Email", "Ngôn ngữ", "Trạng thái", "Ngày đăng ký", "Ngày đồng ý", "Phiên bản chính sách", "Trang đăng ký"] as const;

const LOCALE_NAMES: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh" };

const SUBSCRIBER_SELECT = { email: true, locale: true, status: true, createdAt: true, consentAt: true, privacyPolicyVersion: true, sourcePath: true } as const;

type ExportedSubscriber = Pick<NewsletterSubscriber, "id" | "email" | "locale" | "status" | "createdAt" | "consentAt" | "privacyPolicyVersion" | "sourcePath">;

export function toNewsletterExportRow(subscriber: ExportedSubscriber): CellValue[] {
  return [
    subscriber.email,
    LOCALE_NAMES[subscriber.locale] ?? subscriber.locale,
    NEWSLETTER_STATUS_LABELS[subscriber.status] ?? subscriber.status,
    formatTime(subscriber.createdAt),
    formatTime(subscriber.consentAt),
    subscriber.privacyPolicyVersion,
    subscriber.sourcePath,
  ];
}

type ParsedStatus = { ok: true; status?: NewsletterStatus } | { ok: false };

/** `?status=active|unsubscribed` (tuỳ chọn; rỗng = không lọc). Giá trị khác -> 400, không đoán. */
export function parseNewsletterExportStatus(params: URLSearchParams): ParsedStatus {
  const raw = params.get("status")?.trim();
  if (!raw) return { ok: true };
  return (NEWSLETTER_STATUSES as readonly string[]).includes(raw) ? { ok: true, status: raw as NewsletterStatus } : { ok: false };
}

/** Keyset `(createdAt, id)` như xuất lead: không offset, dừng đúng `total` dòng đã ghi vào audit. */
async function* exportRows(req: PayloadRequest, where: Where, total: number, pageSize: number): AsyncGenerator<CellValue[]> {
  let emitted = 0;
  let cursor: { createdAt: string; id: string } | undefined;
  while (emitted < total) {
    const docs = (
      await req.payload.find({
        collection: "newsletter-subscribers",
        where: cursor ? { and: [where, afterCursor(cursor)] } : where,
        select: SUBSCRIBER_SELECT,
        sort: ["createdAt", "id"],
        limit: pageSize,
        pagination: false,
        depth: 0,
        user: req.user,
        overrideAccess: false,
      })
    ).docs;
    if (docs.length === 0) return;
    for (const subscriber of docs) {
      if (emitted >= total) return;
      emitted += 1;
      yield toNewsletterExportRow(subscriber);
    }
    if (docs.length < pageSize) return;
    const last = docs[docs.length - 1]!;
    cursor = { createdAt: last.createdAt, id: last.id };
  }
}

function exportFileName(now: Date): string {
  const stamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `tami-ban-tin-${stamp}.xlsx`;
}

/**
 * Thứ tự (PERMISSION §5, như xuất lead): đăng nhập + còn hoạt động (401) -> admin (403; sale không xuất) -> `status` hợp lệ (400)
 * -> rate limit chung `admin-export-excel` 10 lần/giờ/user (429, Redis lỗi 503) TRƯỚC mọi truy vấn -> đếm (quá trần 422)
 * -> audit `newsletter.export` (bộ lọc + số dòng, không email; fail-closed: ghi lỗi thì 500, không có file) -> stream.
 * Đọc bằng `overrideAccess: false` với user admin: quyền collection vẫn được kiểm lại ở tầng truy vấn.
 */
export async function handleNewsletterExport(
  req: PayloadRequest,
  rateLimit: LeadsExportRateLimit = checkEndpointRateLimit,
  maxRows: number = MAX_NEWSLETTER_EXPORT_ROWS,
  pageSize: number = PAGE_SIZE,
): Promise<Response> {
  if (!req.user || req.user.active !== true) return fail(401, "Chưa đăng nhập");
  if (!isAdmin({ req })) return fail(403, "Không có quyền");

  const parsed = parseNewsletterExportStatus(new URL(req.url ?? "http://localhost").searchParams);
  if (!parsed.ok) return fail(400, "Bộ lọc không hợp lệ", [{ path: ["status"], message: "Trạng thái không hợp lệ" }]);

  const blocked = await checkExportRateLimit(rateLimit, req.user.id);
  if (blocked) return blocked;

  const where: Where = parsed.status ? { status: { equals: parsed.status } } : {};
  const { totalDocs } = await req.payload.count({ collection: "newsletter-subscribers", where, user: req.user, overrideAccess: false });
  if (totalDocs > maxRows) {
    return fail(422, `Quá nhiều email (${totalDocs}); tối đa ${maxRows} dòng mỗi lần, hãy lọc theo trạng thái`);
  }

  try {
    await writeAuditLog({
      actor: req.user,
      action: "newsletter.export",
      collection: "newsletter-subscribers",
      summary: "Xuất danh sách đăng ký bản tin ra Excel",
      meta: { filters: parsed.status ? { status: parsed.status } : {}, rowCount: totalDocs },
      req,
    });
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "không ghi được audit xuất bản tin, huỷ lượt xuất");
    return fail(500, "Không thể xuất danh sách");
  }

  return new Response(createXlsxStream(NEWSLETTER_EXPORT_COLUMNS, exportRows(req, where, totalDocs, pageSize)), {
    status: 200,
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": buildAttachmentDisposition(exportFileName(new Date())),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const newsletterExportEndpoint: Endpoint = {
  path: "/admin/newsletter-subscribers/export",
  method: "get",
  handler: async (req) => {
    try {
      return await handleNewsletterExport(req);
    } catch (error) {
      log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "xuất bản tin thất bại");
      return fail(500, "Không thể xuất danh sách");
    }
  },
};
