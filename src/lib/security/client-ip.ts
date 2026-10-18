import { isIP } from "node:net";
import { parseTrustCloudflareFlag, parseTrustRealIpFlag } from "@/lib/env";
import { logger } from "@/lib/logger";

let warnedUnknownInProduction = false;

/** Dùng khi không xác định được IP: mọi request như vậy dùng chung một bucket rate limit (chặt, không bỏ qua). */
export const UNKNOWN_CLIENT_IP = "unknown";

export interface ClientIpOptions {
  /**
   * Chỉ `true` khi app chạy sau Nginx đã giới hạn nguồn vào dải IP Cloudflare (mặc định đọc từ
   * `TRUST_CF_CONNECTING_IP=true`, do bước deploy bật). Truy cập thẳng origin thì ai cũng giả được
   * `CF-Connecting-IP`, nên mặc định KHÔNG tin.
   */
  trustCloudflare?: boolean;
  /**
   * Chỉ `true` khi app CHỈ nhận kết nối từ Nginx cùng host (cổng bind 127.0.0.1) và Nginx luôn GHI ĐÈ `X-Real-IP` bằng
   * `$remote_addr` (staging sslip.io, không có Cloudflare). Mặc định đọc từ `TRUST_X_REAL_IP=true`. Không bật cùng
   * `trustCloudflare`: khi cả hai bật thì chỉ `CF-Connecting-IP` được xét.
   */
  trustRealIpHeader?: boolean;
  /** Địa chỉ socket của kết nối (server custom/Node adapter cung cấp; route handler của Next không có). */
  remoteAddress?: string | null;
}

/**
 * Lấy IP khách. Chỉ tin `CF-Connecting-IP` (hoặc `X-Real-IP` khi `TRUST_X_REAL_IP`) khi có cấu hình proxy tin cậy; không bao giờ
 * đọc `X-Forwarded-For` vì client tự đặt được, và mặc định không đọc `X-Real-IP`. Không tin được header thì dùng remote address,
 * không có nữa thì `UNKNOWN_CLIENT_IP`. Trả IP thô: người gọi phải băm bằng `ipHash` trước khi lưu/làm khoá.
 */
export function getClientIp(headers: Headers, options: ClientIpOptions = {}): string {
  const trust = options.trustCloudflare ?? parseTrustCloudflareFlag(process.env.TRUST_CF_CONNECTING_IP);
  if (trust) {
    const header = headers.get("cf-connecting-ip")?.trim();
    if (header && isIP(header)) return header;
  } else if (options.trustRealIpHeader ?? parseTrustRealIpFlag(process.env.TRUST_X_REAL_IP)) {
    const header = headers.get("x-real-ip")?.trim();
    if (header && isIP(header)) return header;
  }
  const remote = options.remoteAddress?.trim();
  if (remote && isIP(remote)) return remote;
  warnUnknownIpInProduction();
  return UNKNOWN_CLIENT_IP;
}

/**
 * Production mà không xác định được IP nghĩa là mọi khách dùng chung một bucket (dễ 429 hàng loạt):
 * thường do quên bật `TRUST_CF_CONNECTING_IP` sau proxy. Cảnh báo một lần mỗi process, không log IP/header.
 */
function warnUnknownIpInProduction(): void {
  if (process.env.NODE_ENV !== "production" || warnedUnknownInProduction) return;
  warnedUnknownInProduction = true;
  logger.warn({ component: "client-ip" }, "không xác định được IP khách: mọi request dùng chung một bucket rate limit. Kiểm tra TRUST_CF_CONNECTING_IP và proxy.");
}
