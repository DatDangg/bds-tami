import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import type { AuditAction } from "../../lib/audit/actions";
import { writeAuditLog } from "../../lib/audit/write-audit-log";
import { passwordChangedFlagKey } from "./flag-password-change";

interface StaffLike {
  id: string;
  email?: string | null;
  role?: string | null;
  active?: boolean | null;
}

function record(
  req: PayloadRequest,
  action: AuditAction,
  target: StaffLike,
  summary: string,
  meta?: Record<string, unknown>,
) {
  return writeAuditLog({ actor: req.user, action, collection: "staff", docId: target.id, summary, meta, req });
}

/**
 * Ghi audit cho thao tác tài khoản (PERMISSION §6): tạo, đổi vai trò, khoá/mở, đổi/đặt lại mật khẩu.
 * Mỗi sự kiện một bản ghi. Meta chỉ gồm trường được chọn rõ ràng, tuyệt đối không spread cả doc
 * (doc có thể chứa hash/salt/token). Sửa hồ sơ thường (tên, SĐT, ảnh) không ghi.
 */
export const auditStaffChanges: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, context }) => {
  if (operation === "create") {
    await record(req, "staff.create", doc, `Tạo tài khoản ${doc.email} (vai trò ${doc.role})`, {
      email: doc.email,
      role: doc.role,
      active: doc.active,
    });
    return doc;
  }

  if (previousDoc.role !== doc.role) {
    await record(req, "staff.update_role", doc, `Đổi vai trò ${doc.email}: ${previousDoc.role} -> ${doc.role}`, {
      from: previousDoc.role,
      to: doc.role,
    });
  }
  if (previousDoc.active === true && doc.active === false) {
    await record(req, "staff.deactivate", doc, `Khoá tài khoản ${doc.email}`);
  } else if (previousDoc.active === false && doc.active === true) {
    await record(req, "staff.activate", doc, `Mở khoá tài khoản ${doc.email}`);
  }
  const flagKey = passwordChangedFlagKey(doc.id);
  if (context[flagKey]) {
    delete context[flagKey];
    const selfService = req.user?.id === doc.id;
    await record(req, "staff.reset_password", doc, `${selfService ? "Tự đổi" : "Đặt lại"} mật khẩu ${doc.email}`, {
      via: selfService ? "self" : "admin",
    });
  }
  return doc;
};

export const auditStaffDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await record(req, "staff.delete", doc, `Xoá tài khoản ${doc.email} (vai trò ${doc.role})`, {
    email: doc.email,
    role: doc.role,
  });
  return doc;
};
