import { normalizeSearchText } from "@/lib/search/normalize";

/** Tiền tố đơn vị hành chính (đã chuẩn hoá không dấu) có thể bị viết tắt/bỏ khi admin nhập địa chỉ tay. */
const ADMIN_PREFIXES = ["thanh pho", "thi tran", "phuong", "quan", "huyen", "tinh", "xa", "tp", "p", "q", "x"] as const;

const tokenize = (text: string): string[] => normalizeSearchText(text).split(/[^a-z0-9]+/).filter(Boolean);

/** Bỏ tiền tố hành chính; chỉ dùng khi phần còn lại có chữ (vd "Phường 1" → "1" quá chung, giữ nguyên). */
function stripAdminPrefix(tokens: string[]): string[] {
  for (const prefix of ADMIN_PREFIXES) {
    const prefixTokens = prefix.split(" ");
    if (tokens.length > prefixTokens.length && prefixTokens.every((token, index) => tokens[index] === token)) {
      const rest = tokens.slice(prefixTokens.length);
      return rest.some((token) => /[a-z]/.test(token)) ? rest : tokens;
    }
  }
  return tokens;
}

/** `needle` xuất hiện trong `haystack` thành dãy token liền nhau (ranh giới từ: "Hà" không khớp "Hà Nội" và ngược lại "Hà Nội" không khớp "Hà"). */
function containsTokens(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((token, index) => haystack[start + index] === token)) return true;
  }
  return false;
}

const sameTokens = (a: string[], b: string[]): boolean => a.length === b.length && a.every((token, index) => token === b[index]);

/**
 * Ghép địa chỉ nhập tay (`street`, có thể đã gồm phường/tỉnh) với tên phường/tỉnh từ dữ liệu: chỉ thêm phần CHƯA có trong `street`.
 * `parts` là mảng tên hoặc một chuỗi "phường, tỉnh" (tự tách theo dấu phẩy).
 * So sánh không dấu, không phân biệt hoa thường. Dạng đầy đủ (có tiền tố) khớp theo ranh giới từ trong cả địa chỉ; dạng bỏ tiền tố
 * "Phường/Xã/P./TP…" chỉ coi là có khi khớp TRỌN một đoạn của địa chỉ (tách theo dấu phẩy) để phường trùng tên đường ("123 Lê Lợi" vs "Phường Lê Lợi") không bị bỏ sai.
 * Giới hạn: không biết bí danh (vd "TP.HCM" ≠ "Thành phố Hồ Chí Minh") nên lệch tên thì vẫn ghép.
 */
export function joinAddress(street: string | null | undefined, parts: string | null | undefined | ReadonlyArray<string | null | undefined>): string {
  const base = typeof street === "string" ? street.trim() : "";
  const baseTokens = tokenize(base);
  const segments = base.split(",").map((segment) => stripAdminPrefix(tokenize(segment)));
  const names = typeof parts === "string" ? parts.split(",") : (parts ?? []);
  const missing = names.flatMap((part) => {
    const name = typeof part === "string" ? part.trim() : "";
    if (!name) return [];
    const tokens = tokenize(name);
    const stripped = stripAdminPrefix(tokens);
    const present = containsTokens(baseTokens, tokens) || segments.some((segment) => sameTokens(segment, stripped));
    return present ? [] : [name];
  });
  return [base, ...missing].filter(Boolean).join(", ");
}
