// Sau mã quốc gia/số 0 đầu: di động = 9 chữ số đầu 3/5/7/8/9 (03x…09x);
// cố định = 10 chữ số đầu 2 (mã vùng 2xx + số thuê bao: 028, 024, 0236…). API_SPEC: "SĐT Việt Nam hợp lệ".
const VN_PHONE = /^(?:\+84|0084|84|0)([35789]\d{8}|2\d{9})$/;
const SEPARATORS = /[\s.\-()]/g;

/**
 * Chuẩn hoá SĐT Việt Nam (di động + cố định) về dạng E.164 `+84xxxxxxxxx` (BR-15: khoá chống trùng lead).
 * Nhận `09…`, `028…`, `+849…`, `849…`, `00849…`, có dấu cách/chấm/gạch/ngoặc. Trả `null` nếu không hợp lệ.
 */
export function normalizePhone(input: string): string | null {
  // NFKC đổi chữ số full-width về ASCII.
  const compact = input.normalize("NFKC").replace(SEPARATORS, "");
  const match = VN_PHONE.exec(compact);
  return match ? `+84${match[1]}` : null;
}
