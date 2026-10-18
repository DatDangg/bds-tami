import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from "payload";

import { writeAuditLog } from "../../lib/audit/write-audit-log";
import { getEnv } from "../../lib/env";
import { isAssignableSale } from "../../lib/leads/assignable-sale";
import type { Lead } from "../../payload-types";
import { asSystemActivity } from "./lead-activity-hooks";

type AssigneeRef = Lead["assignedTo"];

/** `assignedTo` là id hoặc đã populate tuỳ `depth`; chuẩn hoá về id (`null` = chưa giao). */
export function assigneeId(assignee: AssigneeRef | undefined): string | null {
  if (!assignee) return null;
  return typeof assignee === "object" ? assignee.id : assignee;
}

/**
 * `assignedAt` chỉ do hệ thống đặt (ERD §4.11): đổi người phụ trách thì = lúc đổi (xoá giá trị khi bỏ giao); không đổi người
 * thì bỏ giá trị client gửi lên (admin vẫn có quyền ghi trường này, nhưng không được làm sai mốc giao).
 * Chạy ở `beforeChange` để mốc thời gian nằm cùng lần lưu lead, không cần lưu lead lần hai.
 */
export const stampAssignedAt: CollectionBeforeChangeHook<Lead> = ({ data, originalDoc, operation }) => {
  const rest = { ...data };
  delete rest.assignedAt;
  const previous = operation === "create" ? null : assigneeId(originalDoc?.assignedTo);
  const next = "assignedTo" in data ? assigneeId(data.assignedTo) : previous;
  if (next === previous) return rest;
  return { ...rest, assignedAt: next ? new Date().toISOString() : null };
};

function siteUrl(): string {
  return getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
}

/** BR-13: email cho sale vừa được giao, bằng job có sẵn (retry/allowlist ở job). Cùng transaction: lưu lead lỗi thì không có job. */
async function queueAssignedEmail(req: PayloadRequest, lead: Lead, staffId: string): Promise<void> {
  const staff = await req.payload.findByID({ collection: "staff", id: staffId, depth: 0, overrideAccess: true, req, disableErrors: true });
  if (!staff?.email || !isAssignableSale(staff)) return;
  await req.payload.jobs.queue({
    task: "send-notification-email",
    input: {
      template: "lead-assigned",
      to: [staff.email],
      data: {
        leadName: lead.fullName,
        phone: lead.phone,
        assignedToName: staff.fullName,
        language: lead.locale,
        leadUrl: `${siteUrl()}/admin/collections/leads/${lead.id}`,
      },
    },
    req,
  });
}

/**
 * NƠI DUY NHẤT xử lý hệ quả của việc đổi `assignedTo` (API_SPEC §5, design D6): endpoint `/api/admin/leads/:id/assign`, form admin
 * và tự giao BR-12 (endpoint công khai tạo lead đã có `assignedTo`) chỉ việc đặt `assignedTo`, hook này lo phần còn lại:
 * - đúng 1 activity `assignment` (from/to, actor = người đổi; trống nếu hệ thống);
 * - email cho sale mới (không gửi khi bỏ giao, lead đã ẩn danh/xoá mềm, hoặc người nhận không phải sale đang hoạt động);
 * - audit `lead.assign` khi do nhân viên thao tác (tự giao bởi hệ thống không có user thì không ghi audit).
 * Chỉ chạy khi người phụ trách THỰC SỰ đổi, nên lưu lại không đổi `assignedTo` (hoặc hook khác cập nhật lead) không sinh gì.
 * Tất cả cùng transaction với lần lưu lead; audit/activity lỗi thì rollback (fail-closed). Không đưa PII vào audit.
 */
export const recordAssignmentChange: CollectionAfterChangeHook<Lead> = async ({ doc, previousDoc, operation, req }) => {
  const from = operation === "create" ? null : assigneeId(previousDoc?.assignedTo);
  const to = assigneeId(doc.assignedTo);
  if (from === to) return doc;

  const actor = req.user?.collection === "staff" ? req.user : undefined;
  await asSystemActivity(req, () =>
    req.payload.create({
      collection: "lead-activities",
      data: { lead: doc.id, type: "assignment", fromAssignee: from, toAssignee: to, actor: actor?.id },
      req,
      overrideAccess: true,
      depth: 0,
    }),
  );
  if (to && !doc.anonymizedAt && !doc.deletedAt) await queueAssignedEmail(req, doc, to);
  if (actor) {
    await writeAuditLog({
      actor,
      action: "lead.assign",
      collection: "leads",
      docId: doc.id,
      summary: to ? `Giao lead ${doc.code}` : `Bỏ giao lead ${doc.code}`,
      meta: { fromAssignee: from, toAssignee: to },
      req,
    });
  }
  return doc;
};
