import type { PayloadRequest } from "payload";

import { getClientIp, UNKNOWN_CLIENT_IP } from "../security/client-ip";
import { ipHash } from "../security/ip-hash";
import type { AuditAction } from "./actions";
import { type AuditMeta, sanitizeAuditMeta } from "./sanitize-meta";

const MAX_SUMMARY_LENGTH = 500;

/** Người thực hiện: id (hoặc user có `id`); `null` khi không có (vd khách đăng nhập sai, đặt lại mật khẩu bằng token). */
export type AuditActor = string | { id: string } | null | undefined;

export interface AuditLogInput {
  actor?: AuditActor;
  action: AuditAction;
  collection?: string;
  docId?: string | number;
  summary: string;
  meta?: AuditMeta;
  /** Bắt buộc: lấy IP khách (băm) và, khi đang trong transaction của thao tác chính, ghi cùng transaction. */
  req: PayloadRequest;
}

/** IP không xác định được thì không ghi: một hash của "unknown" chung cho mọi request chỉ gây hiểu nhầm. */
function resolveIpHash(req: PayloadRequest): string | undefined {
  const ip = getClientIp(req.headers ?? new Headers());
  return ip === UNKNOWN_CLIENT_IP ? undefined : ipHash(ip);
}

/**
 * Ghi một bản nhật ký thao tác (chỉ thêm). Dùng Local API với `req` của thao tác chính nên nằm CÙNG transaction:
 * ghi nhật ký lỗi thì ném lỗi, kéo theo rollback thao tác chính (fail-closed). Lý do: PERMISSION §6 bắt buộc
 * có dấu vết cho các thao tác này, và nuốt lỗi thì transaction Postgres đã hỏng cũng không commit được.
 * Chỉ dùng cho thao tác còn nằm trong transaction; ngoài transaction dùng `tryWriteAuditLog`.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const { actor, action, collection, docId, summary, meta, req } = input;
  await req.payload.create({
    collection: "audit-logs",
    data: {
      actor: typeof actor === "object" && actor !== null ? actor.id : actor,
      action,
      collection,
      docId: docId === undefined ? undefined : String(docId),
      summary: summary.slice(0, MAX_SUMMARY_LENGTH),
      meta: sanitizeAuditMeta(meta),
      ipHash: resolveIpHash(req),
    },
    overrideAccess: true,
    req,
  });
}

/**
 * Như `writeAuditLog` nhưng nuốt lỗi và chỉ log (fail-open). Dành cho sự kiện không thể rollback hoặc không
 * được đổi kết quả trả khách: đăng nhập sai (không được biến thành 500, tránh lộ trạng thái hệ thống) và
 * đặt lại mật khẩu bằng token (mật khẩu đã đổi xong ở bước trước). Trả `false` khi ghi hỏng.
 */
export async function tryWriteAuditLog(input: AuditLogInput): Promise<boolean> {
  try {
    await writeAuditLog(input);
    return true;
  } catch (error) {
    input.req.payload.logger.error({ err: error, action: input.action }, "Không ghi được audit log");
    return false;
  }
}
