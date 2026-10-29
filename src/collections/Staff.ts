import { addDataAndFileToRequest, APIError, AuthenticationError, ValidationError } from "payload";
import type {
  CollectionAfterLoginHook,
  CollectionBeforeLoginHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Endpoint,
  PayloadRequest,
} from "payload";

import { DEFAULT_ROLE, isAdmin, isStaff, ownedByUserOrAdmin, ROLE_VALUES, type Role } from "../access";
import { adminDate } from "../fields/admin-date";
import { auditFailedLogin } from "../hooks/staff/audit-login-failed";
import { auditStaffChanges, auditStaffDelete } from "../hooks/staff/audit-staff-changes";
import { auditTokenPasswordReset } from "../hooks/staff/audit-token-password-reset";
import { flagPasswordChange } from "../hooks/staff/flag-password-change";
import { guardLastAdminOnDelete, guardLastAdminOnUpdate, rejectBulkChangeOfActiveAdmins } from "../hooks/staff/last-admin-guard";
import { collectionLabels } from "../lib/admin/collection-labels";
import { forgotPasswordUniformResponse } from "../endpoints/admin/staff-forgot-password";
import { SESSION_TTL_SECONDS } from "../lib/session/keepalive";

const MIN_PASSWORD_LENGTH = 10;
const ROLE_LABELS: Record<Role, string> = { admin: "Quản trị viên", sale: "Nhân viên sale" };
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 10 * 60 * 1000;

/** Chỉ admin xem/sửa mọi hồ sơ; sale chỉ hồ sơ của chính mình (so khớp `id`). */
const selfOrAdmin = ownedByUserOrAdmin("id");

function assertPasswordLength(password: unknown, collectionSlug: string): void {
  if (typeof password === "string" && password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError({
      collection: collectionSlug,
      errors: [{ path: "password", message: `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.` }],
    });
  }
}

/**
 * Payload không cho cấu hình độ dài mật khẩu. Hook này chỉ bắt được tạo tài khoản và đổi mật khẩu
 * (lúc đó `data.password` còn là chữ thường). Luồng đặt lại mật khẩu do endpoint dưới đây chặn.
 */
const enforcePasswordLength: CollectionBeforeValidateHook = ({ data, collection }) => {
  assertPasswordLength(data?.password, collection.slug);
  return data;
};

/**
 * Root cause: `resetPasswordOperation` băm mật khẩu ngay (chỉ chạy validator mặc định của Payload) rồi mới gọi
 * `beforeValidate` với doc đã có hash, không còn mật khẩu chữ thường; operation này cũng không gọi
 * `beforeOperation`. Nên chặn ở endpoint `/reset-password` (đường REST duy nhất cho người dùng): kiểm độ dài
 * rồi chuyển cho handler mặc định của Payload, là endpoint cùng path + method đứng SAU endpoint này trong mảng
 * (Payload luôn thêm endpoint mặc định sau endpoint tuỳ biến, và tìm theo thứ tự nên endpoint này được ưu tiên).
 *
 * Không tự parse body: dùng đúng `addDataAndFileToRequest` của Payload (JSON, và multipart với `_payload` của
 * form admin) để kết quả kiểm khớp với dữ liệu handler mặc định sẽ dùng. Handler mặc định tự parse lại body
 * và sẽ lỗi nếu stream đã đọc, nên ta parse trên BẢN SAO của request (gắn lại `payload`/`routeParams`).
 */
const resetPasswordWithLengthCheck: Endpoint = {
  path: "/reset-password",
  method: "post",
  handler: async (req) => {
    const copy = req.clone?.() as PayloadRequest | undefined;
    if (!copy) throw new APIError("Không đọc được body yêu cầu.", 400);
    copy.payload = req.payload;
    copy.routeParams = req.routeParams;
    await addDataAndFileToRequest(copy);
    const password: unknown = copy.data?.password;
    if (typeof password !== "string") throw new APIError("Thiếu mật khẩu mới.", 400);
    assertPasswordLength(password, Staff.slug);

    const endpoints = req.payload.collections[Staff.slug as "staff"].config.endpoints;
    const list = Array.isArray(endpoints) ? endpoints : [];
    const ownIndex = list.findIndex((endpoint) => endpoint.handler === resetPasswordWithLengthCheck.handler);
    const defaultEndpoint = list
      .slice(ownIndex + 1)
      .find((endpoint) => endpoint.path === "/reset-password" && endpoint.method === "post");
    if (ownIndex < 0 || !defaultEndpoint) {
      throw new Error("Không tìm thấy handler reset-password mặc định của Payload.");
    }
    const response = await defaultEndpoint.handler(req);
    await auditTokenPasswordReset(response, req);
    return response;
  },
};

/**
 * Ghi thời điểm đăng nhập thành công. Ghi thẳng DB, không qua `payload.update`, để không chạy hook update
 * (audit-log sẽ coi đó là "sửa hồ sơ").
 */
const recordLastLogin: CollectionAfterLoginHook = async ({ user, req }) => {
  await req.payload.db.updateOne({
    collection: Staff.slug as "staff",
    id: user.id,
    data: { lastLoginAt: new Date().toISOString() },
    req,
    returning: false,
  });
};

/** Chạy sau khi mật khẩu đúng (không lộ email tồn tại); tài khoản khoá nhận lỗi đăng nhập chung. */
const blockInactiveLogin: CollectionBeforeLoginHook = ({ user, req }) => {
  if (user.active !== true) throw new AuthenticationError(req.t);
  return user;
};

/** Tài khoản nội bộ đăng nhập /admin (PERMISSION §1, §3.4, §7; ERD §4.1). */
export const Staff: CollectionConfig = {
  slug: "staff",
  labels: collectionLabels("staff"),
  admin: { useAsTitle: "email", defaultColumns: ["fullName", "email", "role", "active"], description: "Tài khoản nội bộ đăng nhập trang quản trị (quản trị viên / nhân viên sale)." },
  auth: {
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
    lockTime: LOCK_TIME_MS,
    tokenExpiration: SESSION_TTL_SECONDS, // Tuyệt đối; "8 giờ không hoạt động" nhờ SessionKeepAlive làm mới khi còn thao tác (PERMISSION §7).
    // Cookie `payload-token` luôn HttpOnly (Payload cố định); Secure chỉ bật ở production vì dev chạy http.
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  access: {
    admin: isStaff,
    create: isAdmin,
    read: selfOrAdmin,
    update: selfOrAdmin,
    delete: isAdmin,
    unlock: isAdmin,
  },
  endpoints: [resetPasswordWithLengthCheck, forgotPasswordUniformResponse],
  hooks: {
    beforeValidate: [enforcePasswordLength, flagPasswordChange],
    // Guard chạy TRƯỚC khi ghi (cả byID lẫn bulk) nên thao tác bị chặn không đổi gì và không để lại audit.
    beforeOperation: [rejectBulkChangeOfActiveAdmins],
    beforeChange: [guardLastAdminOnUpdate],
    beforeDelete: [guardLastAdminOnDelete],
    afterChange: [auditStaffChanges],
    afterDelete: [auditStaffDelete],
    beforeLogin: [blockInactiveLogin],
    afterLogin: [recordLastLogin],
    afterError: [auditFailedLogin],
  },
  fields: [
    // Khai báo lại để khoá quyền sửa: sale không tự đổi email đăng nhập (PERMISSION §3.4).
    { name: "email", type: "email", label: "Email đăng nhập", required: true, unique: true, access: { update: isAdmin } },
    { name: "fullName", type: "text", label: "Họ tên", required: true },
    { name: "phone", type: "text", label: "Số điện thoại" },
    {
      name: "role",
      type: "select",
      label: "Vai trò",
      required: true,
      index: true,
      defaultValue: DEFAULT_ROLE,
      options: ROLE_VALUES.map((value) => ({ label: ROLE_LABELS[value], value })),
      // Chỉ admin đổi vai trò (PERMISSION §4); sale không tự nâng quyền.
      access: { create: isAdmin, update: isAdmin },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Đang hoạt động",
      required: true,
      defaultValue: true,
      access: { create: isAdmin, update: isAdmin },
    },
    // Chỉ nhận ảnh, chọn từ thư viện `media` (sale tự đổi ảnh hồ sơ của mình nhờ access `update` ở trên).
    {
      name: "avatar",
      type: "upload",
      label: "Ảnh đại diện",
      relationTo: "media",
      filterOptions: { mimeType: { contains: "image/" } },
      // Ẩn ở /admin/create-first-user (chưa đăng nhập): Media.create cần isStaff nên tải ảnh ở đó luôn 403.
      admin: { condition: (_data, _siblingData, { user }) => Boolean(user) },
    },
    {
      name: "lastLoginAt",
      type: "date",
      label: "Đăng nhập gần nhất",
      admin: { readOnly: true, date: adminDate("dayAndTime") },
      access: { create: () => false, update: () => false },
    },
  ],
};
