import { APIError, addDataAndFileToRequest, headersWithCors } from "payload";
import type { Endpoint, PayloadRequest } from "payload";

import { pickSendErrorFields } from "../../lib/email/send-error-fields";
import { logger } from "../../lib/logger";

const STAFF_SLUG = "staff";

/**
 * Root cause (BL-100): handler mặc định của Payload trả 500 khi gửi mail lỗi nhưng 200 khi email không tồn tại, và nhánh
 * "tồn tại" chậm hơn (ghi token qua DB ~160ms + chờ SMTP) -> dò được tài khoản qua status và thời gian. Endpoint này đứng
 * trước endpoint mặc định (cùng cách `resetPasswordWithLengthCheck`): có email thì chạy handler mặc định NỀN và trả ngay
 * phản hồi thành công như nhau cho mọi email; lỗi nền chỉ ghi log. Thiếu email -> giao thẳng handler mặc định để giữ
 * nguyên 400 (không phụ thuộc tài khoản có tồn tại).
 * Log lỗi chỉ gồm trường định danh lỗi: không email, không token, không SMTP_PASS, không object lỗi thô.
 */
export const forgotPasswordUniformResponse: Endpoint = {
  path: "/forgot-password",
  method: "post",
  handler: async (req) => {
    const endpoints = req.payload.collections[STAFF_SLUG as "staff"].config.endpoints;
    const list = Array.isArray(endpoints) ? endpoints : [];
    const ownIndex = list.findIndex((endpoint) => endpoint.handler === forgotPasswordUniformResponse.handler);
    const defaultEndpoint = list
      .slice(ownIndex + 1)
      .find((endpoint) => endpoint.path === "/forgot-password" && endpoint.method === "post");
    if (ownIndex < 0 || !defaultEndpoint) {
      throw new Error("Không tìm thấy handler forgot-password mặc định của Payload.");
    }
    // Endpoint tuỳ biến không được Payload tự parse body (endpoint nội bộ mới có). Parse trên BẢN SAO để handler mặc định
    // còn đọc được stream (cùng cách `resetPasswordWithLengthCheck`).
    const copy = req.clone?.() as PayloadRequest | undefined;
    if (!copy) throw new APIError("Không đọc được body yêu cầu.", 400);
    copy.payload = req.payload;
    copy.routeParams = req.routeParams;
    await addDataAndFileToRequest(copy);
    const email: unknown = copy.data?.email;
    if (typeof email !== "string" || email.length === 0) return defaultEndpoint.handler(req);

    // Không await: thời gian phản hồi không phụ thuộc DB/SMTP. Bắt lỗi tại đây để không thành unhandledRejection.
    Promise.resolve().then(() => defaultEndpoint.handler(req)).catch((err: unknown) => {
      logger.error({ ...pickSendErrorFields(err), collection: STAFF_SLUG, component: "forgot-password" }, "Quên mật khẩu: xử lý nền thất bại");
    });
    return Response.json({ message: req.t("general:success") }, { headers: headersWithCors({ headers: new Headers(), req }), status: 200 });
  },
};
