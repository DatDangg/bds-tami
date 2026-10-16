import { addDataAndFileToRequest, APIError, AuthenticationError, ValidationError } from "payload";
import type {
  CollectionAfterLoginHook,
  CollectionBeforeLoginHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Endpoint,
  PayloadRequest,
} from "payload";

import { DEFAULT_ROLE, isAdmin, isStaff, ownedByUserOrAdmin, ROLE_VALUES } from "../access";

const MIN_PASSWORD_LENGTH = 10;
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
    return defaultEndpoint.handler(req);
  },
};

/**
 * Ghi thời điểm đăng nhập thành công. Ghi thẳng DB, không qua `payload.update`, để không chạy hook update
 * (sau này audit-log sẽ coi đó là "sửa hồ sơ").
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
  admin: { useAsTitle: "email", defaultColumns: ["fullName", "email", "role", "active"] },
  auth: {
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
    lockTime: LOCK_TIME_MS,
  },
  access: {
    admin: isStaff,
    create: isAdmin,
    read: selfOrAdmin,
    update: selfOrAdmin,
    delete: isAdmin,
    unlock: isAdmin,
  },
  endpoints: [resetPasswordWithLengthCheck],
  hooks: {
    beforeValidate: [enforcePasswordLength],
    beforeLogin: [blockInactiveLogin],
    afterLogin: [recordLastLogin],
  },
  fields: [
    // Khai báo lại để khoá quyền sửa: sale không tự đổi email đăng nhập (PERMISSION §3.4).
    { name: "email", type: "email", required: true, unique: true, access: { update: isAdmin } },
    { name: "fullName", type: "text", required: true },
    { name: "phone", type: "text" },
    {
      name: "role",
      type: "select",
      required: true,
      index: true,
      defaultValue: DEFAULT_ROLE,
      options: ROLE_VALUES.map((value) => ({ label: value, value })),
      // Chỉ admin đổi vai trò (PERMISSION §4); sale không tự nâng quyền.
      access: { create: isAdmin, update: isAdmin },
    },
    {
      name: "active",
      type: "checkbox",
      required: true,
      defaultValue: true,
      access: { create: isAdmin, update: isAdmin },
    },
    // Chỉ nhận ảnh, chọn từ thư viện `media` (sale tự đổi ảnh hồ sơ của mình nhờ access `update` ở trên).
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      filterOptions: { mimeType: { contains: "image/" } },
    },
    {
      name: "lastLoginAt",
      type: "date",
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
    },
  ],
};
