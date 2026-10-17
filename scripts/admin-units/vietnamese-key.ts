// Khoá so khớp tên đơn vị hành chính giữa hai nguồn (xlsx / csv). GIỮ NGUYÊN chữ cái gốc và dấu thanh
// (Cẩm Giang ≠ Cẩm Giàng, Sơn Hạ ≠ Sơn Hà); chỉ bỏ qua khác biệt về VỊ TRÍ dấu thanh (kiểu cũ hòa / kiểu mới hoà).
// Không dùng Node-only API và không dùng cú pháp cần biên dịch (script chạy bằng Node type stripping).

const TONE_MARKS = /[̣̀́̃̉]/g;
const TONE_MARK_ONLY = /[̣̀́̃̉]/;
const VOWELS = "aăâeêioôơuưy";
const MODIFIED_VOWELS = "ăâêôơư";
/** Dấu nháy cong/lệch các loại -> nháy thẳng; gạch ngang dài/nối/trừ -> gạch ngang thường. */
const APOSTROPHES = /[‘’ʼ`´]/g;
const DASHES = /[‐‑‒–—−]/g;

function isVowelAt(syllable: string, index: number): boolean {
  if (!VOWELS.includes(syllable[index]!)) return false;
  // "qu" và "gi" + nguyên âm: u / i là phụ âm đầu.
  if (syllable[index] === "u" && syllable[index - 1] === "q") return false;
  if (syllable[index] === "i" && syllable[index - 1] === "g" && index === 1) {
    return VOWELS.includes(syllable[index + 1] ?? "");
  }
  return true;
}

/** Vị trí nguyên âm mang dấu thanh theo kiểu mới: âm có dấu phụ (ê, ơ, ô...) > âm giữa của cụm 3 > âm 2 khi có phụ âm cuối, âm 1 khi âm tiết mở. */
function toneIndex(syllable: string): number {
  let start = 0;
  while (start < syllable.length && !isVowelAt(syllable, start)) start++;
  let end = start;
  while (end < syllable.length && isVowelAt(syllable, end)) end++;
  if (start === end) return -1;
  for (let i = end - 1; i >= start; i--) if (MODIFIED_VOWELS.includes(syllable[i]!)) return i;
  const length = end - start;
  if (length === 1) return start;
  if (length >= 3) return start + 1;
  return end < syllable.length ? start + 1 : start;
}

/** Đặt dấu thanh của một âm tiết (chữ thường) về một vị trí chuẩn (hoà -> hòa, thuỷ -> thủy, uý -> úy) để so khớp. */
function normalizeToneOfSyllable(word: string): string {
  const nfd = word.normalize("NFD");
  const tone = nfd.match(TONE_MARK_ONLY)?.[0];
  if (!tone) return word.normalize("NFC");
  const bare = nfd.replace(TONE_MARKS, "").normalize("NFC");
  const index = toneIndex(bare);
  if (index < 0) return word.normalize("NFC");
  return `${bare.slice(0, index)}${(bare[index]! + tone).normalize("NFC")}${bare.slice(index + 1)}`;
}

/** Chuẩn hoá vị trí dấu thanh cho mọi từ chữ trong chuỗi (giữ nguyên ký tự khác). */
export function normalizeToneOrthography(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\p{L}[\p{L}\p{M}]*/gu, normalizeToneOfSyllable);
}

/** Khoá so khớp: NFC, chữ thường, "Tp" = "Thành phố", nháy/gạch ngang đồng nhất, gộp khoảng trắng, dấu thanh về một kiểu. */
export function matchKey(text: string): string {
  const unified = text
    .normalize("NFC")
    .replace(APOSTROPHES, "'")
    .replace(DASHES, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^Tp\.? /i, "Thành phố ");
  return normalizeToneOrthography(unified);
}
