import type { Endpoint, PayloadRequest } from "payload";
import { z } from "zod";

import { isAdmin } from "@/access";
import { assigneeId } from "@/hooks/leads/on-assignment-change";
import { ASSIGNEE_NOT_ASSIGNABLE_MESSAGE, isAssignableSale } from "@/lib/leads/assignable-sale";
import { fail, ok } from "@/lib/http/response";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "lead-assign" });

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_CHARS = 1000;
const bodySchema = z.object({ staffId: z.string().regex(UUID_PATTERN) });

/** `null` khi body không phải JSON `{ staffId: <uuid> }`. */
async function readStaffId(req: PayloadRequest): Promise<string | null> {
  const raw = await req.text?.();
  if (!raw || raw.length > MAX_BODY_CHARS) return null;
  try {
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.staffId : null;
  } catch {
    return null;
  }
}

/**
 * Thứ tự (PERMISSION §5): đăng nhập + tài khoản còn hoạt động (401) -> admin (403, kể cả id không tồn tại: không để sale dò)
 * -> id đúng UUID (400) -> lead tồn tại và chưa xoá mềm (404) -> body hợp lệ và `staffId` là sale đang hoạt động (400)
 * -> chỉ đặt `assignedTo` bằng Local API (có kiểm access, người gọi là admin).
 * Activity `assignment`, `assignedAt`, email sale mới và audit `lead.assign` KHÔNG làm ở đây mà do hook
 * `recordAssignmentChange` (một nơi duy nhất, API_SPEC §5), nên giao cho đúng người đang phụ trách trả `changed: false` ngay, không ghi lead.
 */
export async function handleLeadAssign(req: PayloadRequest, leadId: string | undefined): Promise<Response> {
  if (!req.user || req.user.active !== true) return fail(401, "Chưa đăng nhập");
  if (!isAdmin({ req })) return fail(403, "Không có quyền");
  if (!leadId || !UUID_PATTERN.test(leadId)) return fail(400, "Mã lead không hợp lệ");

  const lead = await req.payload.findByID({ collection: "leads", id: leadId, depth: 0, overrideAccess: true, disableErrors: true });
  if (!lead) return fail(404, "Không tìm thấy lead");

  const staffId = await readStaffId(req);
  if (!staffId) return fail(400, "Dữ liệu không hợp lệ", [{ path: ["staffId"], message: "staffId phải là mã nhân viên" }]);
  const staff = await req.payload.findByID({ collection: "staff", id: staffId, depth: 0, overrideAccess: true, disableErrors: true });
  if (!staff || !isAssignableSale(staff)) {
    return fail(400, ASSIGNEE_NOT_ASSIGNABLE_MESSAGE, [{ path: ["staffId"], message: "Nhân viên không hợp lệ" }]);
  }

  const changed = assigneeId(lead.assignedTo) !== staff.id;
  if (!changed) return ok({ id: lead.id, assignedTo: staff.id, assignedAt: lead.assignedAt ?? null, changed });
  const updated = await req.payload.update({
    collection: "leads",
    id: leadId,
    data: { assignedTo: staff.id },
    req,
    user: req.user,
    overrideAccess: false,
    depth: 0,
  });
  return ok({ id: updated.id, assignedTo: assigneeId(updated.assignedTo), assignedAt: updated.assignedAt ?? null, changed });
}

export const leadAssignEndpoint: Endpoint = {
  path: "/admin/leads/:id/assign",
  method: "post",
  handler: async (req) => {
    try {
      return await handleLeadAssign(req, req.routeParams?.id as string | undefined);
    } catch (error) {
      log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "giao lead thất bại");
      return fail(500, "Không thể giao lead");
    }
  },
};
