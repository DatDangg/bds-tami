import { createHmac } from "node:crypto";
import { isIPv6 } from "node:net";

const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/;

/** Cùng một IP viết nhiều dạng (hoa/thường, rút gọn, IPv4-mapped) phải ra cùng hash. */
function canonicalizeIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  const mapped = IPV4_MAPPED.exec(trimmed);
  if (mapped) return mapped[1]!;
  if (isIPv6(trimmed)) {
    try {
      // URL ghi lại IPv6 ở dạng rút gọn chuẩn; zone id (`%eth0`) làm URL ném lỗi nên giữ nguyên chuỗi.
      return new URL(`http://[${trimmed}]`).hostname.slice(1, -1);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/**
 * Băm IP khách để chống spam/thống kê mà không lưu IP thô (BR-32).
 * HMAC-SHA256 khoá bằng secret của server: không đảo ngược được và không dò ngược bằng bảng IPv4
 * như hash trần. Cùng IP + cùng secret (cùng môi trường) -> cùng hash.
 * Lưu ý: dùng chung `PAYLOAD_SECRET` nên đổi secret này làm đổi MỌI ipHash đã lưu (mất liên tục
 * thống kê/chống spam theo IP cũ).
 */
export function ipHash(ip: string, secret: string | undefined = process.env.PAYLOAD_SECRET): string {
  if (!secret) throw new Error("Thiếu PAYLOAD_SECRET để băm IP");
  const canonicalIp = canonicalizeIp(ip);
  if (!canonicalIp) throw new Error("IP rỗng, không thể băm");
  // Tiền tố có phiên bản/mục đích để cùng secret không bị dùng chéo cho HMAC khác.
  return createHmac("sha256", secret).update(`ip-hash:v1:${canonicalIp}`).digest("hex");
}
