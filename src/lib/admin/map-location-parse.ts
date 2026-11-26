/** Kết quả đọc chuỗi người dùng dán vào ô "Dán từ Google Maps" (BL-131). */
export type MapLocationParseResult = { lat: number; lng: number } | { error: "short-link" | "reversed" } | null;

const NUMBER = String.raw`-?\d{1,3}(?:\.\d+)?`;
const PLAIN_PAIR = new RegExp(String.raw`^(${NUMBER})\s*(?:[,;]\s*|\s+)(${NUMBER})$`);
// Link Google Maps: `!3d<lat>!4d<lng>` là vị trí ghim thật; `@lat,lng,zoom` chỉ là tâm khung nhìn nên xét sau.
const PIN_IN_DATA = new RegExp(String.raw`!3d(${NUMBER})!4d(${NUMBER})`);
const VIEWPORT_CENTER = new RegExp(String.raw`@(${NUMBER}),(${NUMBER})`);
const QUERY_PAIR = new RegExp(String.raw`[?&](?:q|query|ll|center|destination)=\s*\+?(${NUMBER})\s*,\s*\+?(${NUMBER})(?:[&#]|$)`);
const SHORT_LINK = /(?:^|\/\/)(?:maps\.app\.goo\.gl|goo\.gl\/maps)(?:[/?#]|$)/i;

function toCoordinates(latText: string | undefined, lngText: string | undefined): MapLocationParseResult {
  if (latText === undefined || lngText === undefined) return null;
  const lat = Number.parseFloat(latText);
  const lng = Number.parseFloat(lngText);
  if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  // "vĩ độ" vượt 90 nhưng "kinh độ" hợp lệ làm vĩ độ: gần như chắc chắn dán ngược (vd 106.7009, 10.7769).
  return Math.abs(lat) <= 180 && Math.abs(lng) <= 90 ? { error: "reversed" } : null;
}

/** `%2C`, `%40`… trong link: giải mã để regex thấy dấu phẩy/@; lỗi giải mã thì giữ nguyên chuỗi. */
function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * Đọc toạ độ từ chuỗi dán: cặp số "vĩ độ, kinh độ" (Google Maps luôn hiện vĩ độ trước) hoặc link Google Maps đầy đủ.
 * Link rút gọn (maps.app.goo.gl, goo.gl/maps) cần gọi mạng để mở nên không xử lý: trả `short-link` để giao diện hướng dẫn dán cặp số.
 * Cặp số có vẻ ngược (số đầu vượt 90) → `reversed`. Không đọc được → `null`. Chỉ kiểm biên ±90/±180; kiểm vùng Việt Nam do validate của trường lo.
 */
export function parseMapLocationInput(input: string): MapLocationParseResult {
  const text = input.trim();
  if (!text) return null;
  if (SHORT_LINK.test(text)) return { error: "short-link" };
  const plain = PLAIN_PAIR.exec(text);
  if (plain) return toCoordinates(plain[1], plain[2]);
  const decoded = safeDecode(text);
  for (const pattern of [PIN_IN_DATA, VIEWPORT_CENTER, QUERY_PAIR]) {
    const match = pattern.exec(decoded);
    if (match) return toCoordinates(match[1], match[2]);
  }
  return null;
}
