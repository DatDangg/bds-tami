/** Phần bản ghi nội dung mà các hook dùng chung đọc; collection nào cũng có đủ nhờ `withContentDefaults`. */
export interface ContentDoc {
  id?: string | number;
  title?: unknown;
  slug?: unknown;
  status?: unknown;
  isFeatured?: unknown;
  deletedAt?: unknown;
}
