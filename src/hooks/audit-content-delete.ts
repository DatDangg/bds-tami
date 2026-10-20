import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import type { AuditAction } from "../lib/audit/actions";
import { writeAuditLog } from "../lib/audit/write-audit-log";
import type { ContentDoc } from "./content-doc";

function label(doc: ContentDoc): string {
  const name = typeof doc.title === "string" && doc.title !== "" ? doc.title : doc.slug;
  return typeof name === "string" && name !== "" ? `"${name}"` : String(doc.id);
}

function record(req: PayloadRequest, action: AuditAction, collection: string, doc: ContentDoc, verb: string) {
  return writeAuditLog({
    actor: req.user,
    action,
    collection,
    docId: doc.id,
    summary: `${verb} ${collection} ${label(doc)}`,
    req,
  });
}

/**
 * Xoá mềm / khôi phục = đổi `deletedAt` (tính năng Trash của Payload), ghi `content.delete` / `content.restore`
 * (PERMISSION §6). Cùng transaction với thao tác chính: ghi audit lỗi thì rollback (fail-closed).
 */
export const auditContentTrash: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  collection,
}) => {
  if (operation !== "update") return doc;
  const wasTrashed = Boolean(previousDoc?.deletedAt);
  const isTrashed = Boolean(doc.deletedAt);
  if (!wasTrashed && isTrashed) await record(req, "content.delete", collection.slug, doc, "Chuyển vào thùng rác");
  if (wasTrashed && !isTrashed) await record(req, "content.restore", collection.slug, doc, "Khôi phục");
  return doc;
};

/** Xoá hẳn khỏi DB (chỉ admin qua access `delete`), ghi `content.purge`. */
export const auditContentPurge: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  await record(req, "content.purge", collection.slug, doc, "Xoá vĩnh viễn");
  return doc;
};
