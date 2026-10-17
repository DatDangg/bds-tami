import { normalizePhone } from "@/lib/phone";

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// SĐT: 9 chữ số trở lên (cho phép dấu cách, chấm, gạch, mở đầu +, mã vùng trong ngoặc như `(028) 3823 4567`).
// Không cố bắt mọi định dạng, chỉ chặn dạng hay gặp.
const PHONE_SOURCE = String.raw`\+?(?:\(\d{2,4}\)[ .-]?)?\d[\d .-]{7,}\d`;
// Ngày tháng (2026-10-17, 17-10-2026, 17.10.2026) khớp mẫu SĐT nhưng không phải SĐT: giữ nguyên cho log đọc được.
// Ngày là một nhánh riêng của CÙNG regex, ngay trước nhánh SĐT: regex quét trái sang phải nên ngày chỉ nuốt đúng phần ngày,
// còn SĐT đứng liền sau (`2026-10-17 0901234567`) vẫn được quét và che ở lượt khớp kế tiếp.
// KHÔNG dùng lookbehind (`(?<!\d)`): module này nằm trong chunk trình duyệt, Safari/iOS < 16.4 (kể cả WebView Zalo/Facebook)
// ném SyntaxError khi nạp và không hydrate được trang. Thay bằng nhóm bắt `(^|\D)`: ngày không bắt đầu giữa một dãy số.
const DATE_SOURCE = String.raw`(?:19|20)\d{2}-\d{2}-\d{2}|\d{1,2}[ .-]\d{1,2}[ .-](?:19|20)\d{2}`;
const DATE_OR_PHONE_PATTERN = new RegExp(String.raw`(^|\D)(?:${DATE_SOURCE})(?!\d)|${PHONE_SOURCE}`, "g");
const MIN_PHONE_DIGITS = 9;
// Dãy từ 12 chữ số liền nhau: timestamp ms (13), đoạn cuối UUID (12), số tài khoản, mã đơn: thường là ID, giữ nguyên cho log
// tra cứu được. NHƯNG SĐT Việt Nam dạng E.164 cũng dài tới 12 chữ số (`+84` + 10 số cố định, `+842838234567`) hoặc 13 (`0084…`),
// nên dãy có HÌNH DẠNG SĐT VN luôn bị che trước (xem `looksLikeVietnamPhone`); luật bỏ ID chỉ áp cho phần còn lại. Nếu bỏ dãy ID ra
// mà phần còn lại vẫn đủ chữ số của một SĐT (ID dính liền SĐT qua dấu cách/gạch) thì vẫn che cả cụm.
const LONG_ID_RUN = /\d{12,}/g;

/** Giới hạn đầu vào cho regex: thông điệp lỗi có thể trích cả body lớn, regex trên chuỗi dài rất chậm. */
export const MAX_SCRUB_LENGTH = 4096;
const TRUNCATION_MARK = "…[cắt bớt]";

/** Dùng lại `normalizePhone` (nguồn chuẩn của BR-15); thêm dạng gõ nhầm `+840912345678` (mã nước kèm số 0 đầu). */
function looksLikeVietnamPhone(match: string): boolean {
  if (normalizePhone(match) !== null) return true;
  const compact = match.replace(/[\s.\-()]/g, "");
  return normalizePhone(compact.replace(/^(\+?(?:0084|84))0/, "$1")) !== null;
}

function scrubMatch(match: string, dateLead: string | undefined): string {
  if (dateLead !== undefined) return match;
  if (looksLikeVietnamPhone(match)) return "[phone]";
  const digitsWithoutIds = match.replace(LONG_ID_RUN, "").replace(/\D/g, "").length;
  return digitsWithoutIds < MIN_PHONE_DIGITS ? match : "[phone]";
}

/** Che email và số điện thoại trong chuỗi tự do (thông điệp lỗi, stack) trước khi ghi log / gửi GlitchTip. */
export function scrubText(text: string): string {
  const bounded = text.length > MAX_SCRUB_LENGTH ? text.slice(0, MAX_SCRUB_LENGTH) + TRUNCATION_MARK : text;
  return bounded.replace(EMAIL_PATTERN, "[email]").replace(DATE_OR_PHONE_PATTERN, scrubMatch);
}
