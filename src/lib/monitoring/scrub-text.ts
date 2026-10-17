const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// SĐT: 9 chữ số trở lên (cho phép dấu cách, chấm, gạch, mở đầu +). Không cố bắt mọi định dạng, chỉ chặn dạng hay gặp.
const PHONE_SOURCE = String.raw`\+?\d[\d .-]{7,}\d`;
// Ngày tháng (2026-10-17, 17-10-2026, 17.10.2026) khớp mẫu SĐT nhưng không phải SĐT: giữ nguyên cho log đọc được.
// Ngày là một nhánh riêng của CÙNG regex, ngay trước nhánh SĐT: regex quét trái sang phải nên ngày chỉ nuốt đúng phần ngày,
// còn SĐT đứng liền sau (`2026-10-17 0901234567`) vẫn được quét và che ở lượt khớp kế tiếp.
const DATE_SOURCE = String.raw`(?<!\d)(?:(?:19|20)\d{2}-\d{2}-\d{2}|\d{1,2}[ .-]\d{1,2}[ .-](?:19|20)\d{2})(?!\d)`;
const DATE_OR_PHONE_PATTERN = new RegExp(`(${DATE_SOURCE})|${PHONE_SOURCE}`, "g");
const MIN_PHONE_DIGITS = 9;

/** Giới hạn đầu vào cho regex: thông điệp lỗi có thể trích cả body lớn, regex trên chuỗi dài rất chậm. */
export const MAX_SCRUB_LENGTH = 4096;
const TRUNCATION_MARK = "…[cắt bớt]";

function scrubPhone(match: string, date: string | undefined): string {
  if (date !== undefined) return match;
  if (match.replace(/\D/g, "").length < MIN_PHONE_DIGITS) return match;
  return "[phone]";
}

/** Che email và số điện thoại trong chuỗi tự do (thông điệp lỗi, stack) trước khi ghi log / gửi GlitchTip. */
export function scrubText(text: string): string {
  const bounded = text.length > MAX_SCRUB_LENGTH ? text.slice(0, MAX_SCRUB_LENGTH) + TRUNCATION_MARK : text;
  return bounded.replace(EMAIL_PATTERN, "[email]").replace(DATE_OR_PHONE_PATTERN, scrubPhone);
}
