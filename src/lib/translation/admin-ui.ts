import type { Where } from "payload";

/** Bộ lọc trạng thái dịch trên danh sách nội dung (FR-ADM-18): mỗi mục là một điều kiện trên trường có sẵn của nhóm `translation`, không cần cột mới. */
export const TRANSLATION_FILTERS = {
  none: { label: "Chưa dịch", condition: { "translation.status": { equals: "none" } } },
  ai: { label: "AI dịch", condition: { "translation.enSource": { equals: "ai" } } },
  manual: { label: "Đã sửa tay", condition: { "translation.enSource": { equals: "manual" } } },
  failed: { label: "Dịch lỗi", condition: { "translation.status": { equals: "failed" } } },
  viChanged: { label: "Bản Việt đổi sau khi sửa tay", condition: { "translation.viChangedAfterManual": { equals: true } } },
} as const satisfies Record<string, { label: string; condition: Where }>;

export type TranslationFilterKey = keyof typeof TRANSLATION_FILTERS;
export const TRANSLATION_FILTER_KEYS = Object.keys(TRANSLATION_FILTERS) as TranslationFilterKey[];

const isTranslationCondition = (entry: unknown): boolean => JSON.stringify(entry).includes('"translation.');

function andEntries(where: Where | undefined): Where[] {
  if (!where || Object.keys(where).length === 0) return [];
  const clauses = (where as { and?: Where[] }).and;
  return Array.isArray(clauses) && Object.keys(where).length === 1 ? clauses : [where];
}

/** Bộ lọc đang áp (khớp đúng điều kiện của một mục), `""` khi không có. */
export function currentTranslationFilter(where: Where | undefined): TranslationFilterKey | "" {
  const present = andEntries(where).map((entry) => JSON.stringify(entry));
  return TRANSLATION_FILTER_KEYS.find((key) => present.includes(JSON.stringify(TRANSLATION_FILTERS[key].condition))) ?? "";
}

/** `where` mới: giữ nguyên các điều kiện khác của danh sách, thay điều kiện dịch cũ bằng điều kiện của `key` (hoặc bỏ nếu rỗng). */
export function withTranslationFilter(where: Where | undefined, key: TranslationFilterKey | ""): Where {
  const others = andEntries(where).filter((entry) => !isTranslationCondition(entry));
  const next = key ? [...others, TRANSLATION_FILTERS[key].condition] : others;
  return { and: next };
}

export const COLLECTION_LABELS: Record<string, string> = {
  projects: "Dự án",
  rentals: "Cho thuê",
  "property-posts": "Tin bất động sản",
  news: "Tin tức",
  services: "Dịch vụ",
  "job-postings": "Tuyển dụng",
  pages: "Trang pháp lý",
  categories: "Danh mục",
  developers: "Chủ đầu tư",
};

export const GLOBAL_LABELS: Record<string, string> = { "site-settings": "Cấu hình chung", homepage: "Trang chủ", header: "Đầu trang", footer: "Chân trang" };

/** Sale chỉ được dịch lại bài của mình, và không với `services`/`pages`/globals (chỉ admin sửa): khớp quyền của endpoint, dùng để ẩn nút (endpoint vẫn kiểm lại). */
export function canRetranslate(user: { id?: string | number; role?: string } | null | undefined, slug: string | undefined, authorId: unknown): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "sale" || !slug || slug === "services" || slug === "pages") return false;
  return authorId !== undefined && authorId !== null && String(authorId) === String(user.id);
}

/** Thông báo cho người dùng theo mã lỗi của `POST /api/admin/translations/:collection/:id`. */
export function retranslateMessage(status: number, retryAfter: string | null): string {
  if (status === 202) return "Đã xếp hàng dịch lại. Bản tiếng Anh sẽ được cập nhật sau ít phút.";
  if (status === 429) {
    const minutes = Math.max(1, Math.ceil(Number(retryAfter) / 60) || 1);
    return `Bạn đã yêu cầu dịch lại quá nhiều lần (tối đa 30 lần mỗi giờ). Thử lại sau khoảng ${minutes} phút.`;
  }
  if (status === 409) return "Dịch tự động đang tắt (Cài đặt chung hoặc hạn mức dịch tháng bằng 0). Bật lại rồi thử lại.";
  if (status === 503) return "Dịch tự động chưa được cấu hình hoặc hệ thống đang tạm thời lỗi. Thử lại sau.";
  if (status === 401 || status === 403 || status === 404) return "Bạn không có quyền dịch lại nội dung này.";
  return "Không thể dịch lại lúc này. Thử lại sau.";
}
