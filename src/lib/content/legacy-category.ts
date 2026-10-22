/** Giới hạn độ dài slug nhận từ URL, như `legacyCategorySlug` / `firstValue` của các bộ lọc. */
const MAX_SLUG_LENGTH = 100;

/** Giá trị đầu của một tham số `searchParams` (chuỗi hoặc mảng chuỗi) đã trim; kiểu khác → rỗng. */
function firstText(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.trim() : "";
}

/**
 * BL-055 C-1: link cũ `/tin-bds?category=<slug>` / `/cho-thue?category=<slug>` chỉ được 308 sang trang danh mục khi URL "CHỈ có `category`":
 * có `category` (giá trị đầu, trim, không rỗng, ≤ 100 ký tự) và KHÔNG có khoá nào khác mang giá trị không rỗng (`page`, `q`, `sort`, bộ lọc,
 * kể cả khoá lạ như `utm_*`). Khoá khác nhưng rỗng / chỉ khoảng trắng (`?category=x&q=`, form gửi "Tất cả") coi như không có.
 * Nhận `searchParams` của mọi trang (interface không index signature vẫn truyền được) nên đọc qua `Object.entries` + kiểm kiểu lúc chạy.
 * Trả slug để redirect, hoặc `null` để trang giữ hành vi cũ (lọc + đánh dấu tab). Slug có tồn tại hay không do nơi gọi đối chiếu.
 */
export function legacyCategoryOnly(searchParams: object): string | null {
  const entries = Object.entries(searchParams);
  const slug = firstText(entries.find(([key]) => key === "category")?.[1]);
  if (!slug || slug.length > MAX_SLUG_LENGTH) return null;
  const hasOtherValue = entries.some(([key, value]) => key !== "category" && firstText(value) !== "");
  return hasOtherValue ? null : slug;
}
