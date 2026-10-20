import type { Endpoint, PayloadRequest, Where } from "payload";

import { isAdmin } from "@/access";
import { SOURCE_LABELS, STATUS_LABELS } from "@/collections/Leads";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createXlsxStream, type CellValue } from "@/lib/export/xlsx-stream";
import { buildAttachmentDisposition } from "@/lib/http/content-disposition";
import { fail } from "@/lib/http/response";
import { buildLeadExportWhere, parseLeadExportFilters } from "@/lib/leads/export-filters";
import { ANONYMIZED_PLACEHOLDER } from "@/lib/leads/lead-values";
import { logger } from "@/lib/logger";
import { checkEndpointRateLimit, RateLimitUnavailableError } from "@/lib/security/rate-limit";
import type { Lead } from "@/payload-types";

const log = logger.child({ component: "leads-export" });

/** Trần số dòng một lần xuất: vượt thì từ chối và bảo thu hẹp bộ lọc, thay vì kéo cả bảng lead qua một request. */
export const MAX_EXPORT_ROWS = 20_000;
const PAGE_SIZE = 500;
const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const COLUMNS = [
  "Mã lead",
  "Họ tên",
  "Số điện thoại",
  "Email",
  "Lời nhắn",
  "Nguồn",
  "Trạng thái",
  "Lý do không thành",
  "Sale phụ trách",
  "Ngày tạo",
  "Ngày giao",
  "Hoạt động gần nhất",
  "Ngôn ngữ",
] as const;

const LEAD_SELECT = {
  code: true,
  fullName: true,
  phone: true,
  email: true,
  message: true,
  source: true,
  status: true,
  lostReason: true,
  assignedTo: true,
  createdAt: true,
  assignedAt: true,
  lastActivityAt: true,
  locale: true,
  anonymizedAt: true,
} as const;

type ExportedLead = Pick<Lead, "id" | "code" | "fullName" | "phone" | "email" | "message" | "source" | "status" | "lostReason" | "assignedTo" | "createdAt" | "assignedAt" | "lastActivityAt" | "locale" | "anonymizedAt">;

const vietnamTime = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short", hourCycle: "h23" });

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? "" : vietnamTime.format(time);
}

const assigneeIdOf = (assignedTo: ExportedLead["assignedTo"]): string | null => (typeof assignedTo === "string" ? assignedTo : (assignedTo?.id ?? null));

/**
 * Lead đã ẩn danh không bao giờ xuất PII, dù cột trong DB còn gì: họ tên/SĐT là chuỗi thay thế, email/lời nhắn để trống
 * (cùng quy ước với hook ẩn danh, ERD §7).
 */
export function toExportRow(lead: ExportedLead, assigneeName: string | undefined): CellValue[] {
  const anonymized = Boolean(lead.anonymizedAt);
  return [
    lead.code,
    anonymized ? ANONYMIZED_PLACEHOLDER : lead.fullName,
    anonymized ? ANONYMIZED_PLACEHOLDER : lead.phone,
    anonymized ? "" : lead.email,
    anonymized ? "" : lead.message,
    SOURCE_LABELS[lead.source] ?? lead.source,
    STATUS_LABELS[lead.status] ?? lead.status,
    lead.lostReason,
    assigneeName ?? "",
    formatTime(lead.createdAt),
    formatTime(lead.assignedAt),
    formatTime(lead.lastActivityAt),
    lead.locale,
  ];
}

async function lookupAssigneeNames(req: PayloadRequest, leads: ExportedLead[], known: Map<string, string>): Promise<void> {
  const missing = [...new Set(leads.map((lead) => assigneeIdOf(lead.assignedTo)).filter((id): id is string => id !== null && !known.has(id)))];
  if (missing.length === 0) return;
  const staff = await req.payload.find({
    collection: "staff",
    where: { id: { in: missing } },
    select: { fullName: true },
    limit: missing.length,
    depth: 0,
    pagination: false,
    user: req.user,
    overrideAccess: false,
  });
  for (const member of staff.docs) known.set(member.id, member.fullName ?? "");
}

/** Điều kiện "sau" bản ghi cuối của trang trước, theo thứ tự `(createdAt, id)`. */
function afterCursor(cursor: { createdAt: string; id: string }): Where {
  return {
    or: [{ createdAt: { greater_than: cursor.createdAt } }, { and: [{ createdAt: { equals: cursor.createdAt } }, { id: { greater_than: cursor.id } }] }],
  };
}

/**
 * Đọc từng trang theo keyset `(createdAt, id)` (không offset: lead đổi/xoá giữa chừng không làm lệch trang, không COUNT thừa mỗi
 * trang), dừng đúng `total` dòng (số đã ghi vào audit) dù lead mới phát sinh giữa chừng.
 */
async function* exportRows(req: PayloadRequest, where: Where, total: number, pageSize: number): AsyncGenerator<CellValue[]> {
  const assigneeNames = new Map<string, string>();
  let emitted = 0;
  let cursor: { createdAt: string; id: string } | undefined;
  while (emitted < total) {
    const docs = (
      await req.payload.find({
        collection: "leads",
        where: cursor ? { and: [where, afterCursor(cursor)] } : where,
        select: LEAD_SELECT,
        sort: ["createdAt", "id"],
        limit: pageSize,
        pagination: false,
        depth: 0,
        user: req.user,
        overrideAccess: false,
      })
    ).docs;
    if (docs.length === 0) return;
    await lookupAssigneeNames(req, docs, assigneeNames);
    for (const lead of docs) {
      if (emitted >= total) return;
      emitted += 1;
      yield toExportRow(lead, assigneeNames.get(assigneeIdOf(lead.assignedTo) ?? ""));
    }
    const last = docs[docs.length - 1]!;
    if (docs.length < pageSize) return;
    cursor = { createdAt: last.createdAt, id: last.id };
  }
}

function exportFileName(now: Date): string {
  const stamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `tami-leads-${stamp}.xlsx`;
}

export type LeadsExportRateLimit = typeof checkEndpointRateLimit;

/** Trả `Response` lỗi (429/503) nếu không được xuất, `null` nếu còn lượt. Chạy TRƯỚC mọi truy vấn lead. */
async function checkExportRateLimit(rateLimit: LeadsExportRateLimit, userId: string): Promise<Response | null> {
  let limit: Awaited<ReturnType<LeadsExportRateLimit>>;
  try {
    limit = await rateLimit("admin-export-excel", userId);
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) throw error;
    log.error({ errorName: error.name }, "không kiểm tra được giới hạn xuất Excel");
    return fail(503, "Hệ thống tạm thời chưa xuất được, thử lại sau");
  }
  if (limit.allowed) return null;
  const limited = fail(429, "Bạn đã xuất quá nhiều lần, thử lại sau");
  limited.headers.set("Retry-After", String(limit.retryAfterSeconds));
  limited.headers.set("Cache-Control", "no-store");
  return limited;
}

/**
 * Thứ tự (PERMISSION §5): đăng nhập + còn hoạt động (401) -> admin (403; sale không xuất, dù lead được giao) -> tham số hợp lệ (400)
 * -> rate limit 10 lần/giờ/user (429, Redis lỗi 503) TRƯỚC mọi truy vấn lead -> đếm dòng (quá trần: 422) -> audit `lead.export`
 * (bộ lọc + số dòng, không có dữ liệu khách, từ khoá tìm kiếm chỉ ghi cờ; fail-closed: ghi lỗi thì 500, không có file nào ra mà không có dấu vết) -> stream.
 * Lỗi giữa stream thì kết nối bị ngắt (file dở không hợp lệ), không bao giờ trả file thiếu mà báo thành công.
 */
export async function handleLeadsExport(
  req: PayloadRequest,
  rateLimit: LeadsExportRateLimit = checkEndpointRateLimit,
  maxRows: number = MAX_EXPORT_ROWS,
  pageSize: number = PAGE_SIZE,
): Promise<Response> {
  if (!req.user || req.user.active !== true) return fail(401, "Chưa đăng nhập");
  if (!isAdmin({ req })) return fail(403, "Không có quyền");

  const parsed = parseLeadExportFilters(new URL(req.url ?? "http://localhost").searchParams);
  if (!parsed.ok) return fail(400, "Bộ lọc không hợp lệ", parsed.issues);

  const blocked = await checkExportRateLimit(rateLimit, req.user.id);
  if (blocked) return blocked;

  const where = buildLeadExportWhere(parsed.filters);
  // Từ khoá có thể là SĐT/email khách: audit chỉ ghi cờ có tìm kiếm, không ghi nội dung.
  const { search, ...auditFilters } = parsed.filters;
  const { totalDocs } = await req.payload.count({ collection: "leads", where, user: req.user, overrideAccess: false });
  if (totalDocs > maxRows) {
    return fail(422, `Quá nhiều lead (${totalDocs}); tối đa ${maxRows} dòng mỗi lần, hãy thu hẹp bộ lọc`);
  }

  try {
    await writeAuditLog({
      actor: req.user,
      action: "lead.export",
      collection: "leads",
      summary: "Xuất lead ra Excel",
      meta: { filters: search ? { ...auditFilters, search: true } : auditFilters, rowCount: totalDocs },
      req,
    });
  } catch (error) {
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "không ghi được audit xuất lead, huỷ lượt xuất");
    return fail(500, "Không thể xuất lead");
  }

  return new Response(createXlsxStream(COLUMNS, exportRows(req, where, totalDocs, pageSize)), {
    status: 200,
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": buildAttachmentDisposition(exportFileName(new Date())),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const leadsExportEndpoint: Endpoint = {
  path: "/admin/leads/export",
  method: "get",
  handler: async (req) => {
    try {
      return await handleLeadsExport(req);
    } catch (error) {
      log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "xuất lead thất bại");
      return fail(500, "Không thể xuất lead");
    }
  },
};
