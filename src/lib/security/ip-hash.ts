import { createHmac } from "node:crypto";
import { isIPv6 } from "node:net";

const IPV4_MAPPED_DOTTED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/;
const IPV4_MAPPED_HEX = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/;

/** `cb00`,`7107` -> `203.0.113.7`. */
function hexPairToIpv4(high: string, low: string): string {
  const value = (Number.parseInt(high, 16) << 16) | Number.parseInt(low, 16);
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}

/** Cùng một IP viết nhiều dạng (hoa/thường, rút gọn, IPv4-mapped) phải ra cùng hash. */
function canonicalizeIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (!isIPv6(trimmed)) return trimmed;
  let compact: string;
  try {
    // URL ghi lại IPv6 ở dạng rút gọn chuẩn (và đổi `::ffff:1.2.3.4` thành dạng hex); phải rút gọn
    // TRƯỚC khi kiểm IPv4-mapped. Zone id (`%eth0`) làm URL ném lỗi nên giữ nguyên chuỗi.
    compact = new URL(`http://[${trimmed}]`).hostname.slice(1, -1);
  } catch {
    compact = trimmed;
  }
  const hex = IPV4_MAPPED_HEX.exec(compact);
  if (hex) return hexPairToIpv4(hex[1]!, hex[2]!);
  const dotted = IPV4_MAPPED_DOTTED.exec(compact);
  return dotted ? dotted[1]! : compact;
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
