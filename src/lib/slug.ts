/** Độ dài slug tối đa mặc định; đủ cho tiêu đề dài mà URL vẫn gọn. */
export const SLUG_MAX_LENGTH = 80;

const COMBINING_MARKS = /\p{M}/gu;
// `.` cũng bị đổi thành `-`: matcher `src/proxy.ts` bỏ qua path có dấu chấm (coi là file tĩnh),
// nên slug có `.` sẽ không được next-intl xử lý locale.
const NON_SLUG_CHARS = /[^a-z0-9]+/g;

/**
 * Sinh slug URL từ tiêu đề (BR-05): bỏ dấu tiếng Việt (đ -> d), chữ thường, ký tự ngoài [a-z0-9] thành `-`.
 * Trả "" khi không còn ký tự hợp lệ; nơi gọi tự xử lý (vd bắt buộc nhập tiêu đề).
 * Chưa đảm bảo duy nhất: việc thêm hậu tố khi trùng thuộc hook của từng collection.
 */
export function slugify(title: string, maxLength: number = SLUG_MAX_LENGTH): string {
  // NFKD: tách dấu và đổi dạng tương thích (² -> 2, chữ full-width -> ASCII).
  const ascii = title
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(NON_SLUG_CHARS, "-")
    .replace(/^-+|-+$/g, "");
  return truncateAtWordBoundary(ascii, maxLength);
}

/** Cắt tại gạch nối gần nhất để không bỏ dở nửa từ; từ đơn dài hơn giới hạn thì cắt cứng. */
function truncateAtWordBoundary(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) return slug;
  const head = slug.slice(0, maxLength);
  if (slug[maxLength] === "-") return head;
  const lastHyphen = head.lastIndexOf("-");
  return (lastHyphen > 0 ? head.slice(0, lastHyphen) : head).replace(/-+$/, "");
}

/** Ứng viên thứ `n` (n ≥ 2) của `base`: `base-n`, phần gốc cắt bớt để cả chuỗi ≤ `maxLength`. */
export function suffixedSlug(base: string, n: number, maxLength: number = SLUG_MAX_LENGTH): string {
  const suffix = `-${n}`;
  const head = base.slice(0, maxLength - suffix.length).replace(/-+$/, "");
  return `${head}${suffix}`;
}

/**
 * Trả `base` nếu chưa nằm trong `taken`, ngược lại `base-2`, `base-3`... (số nhỏ nhất còn trống).
 * Phần gốc bị cắt khi cần để slug có hậu tố vẫn ≤ `maxLength`.
 */
export function appendUniqueSuffix(
  base: string,
  taken: ReadonlySet<string>,
  maxLength: number = SLUG_MAX_LENGTH,
): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = suffixedSlug(base, n, maxLength);
    if (!taken.has(candidate)) return candidate;
  }
}
