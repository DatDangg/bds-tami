import type { Payload } from "payload";

/** Kiểu dùng chung của script điền dữ liệu cũ (BL-052). Mỗi collection là một `BackfillAdapter` (P3-T05 thêm `property-posts`). */

export type Confidence = "cao" | "trung bình";

/** Một giá trị sẽ điền / đã điền vào một ô trống. */
export interface FilledValue {
  field: string;
  value: string;
  /** Nơi trích ("tên", "danh mục", "tổng quan"...). */
  source: string;
  snippet: string;
  confidence: Confidence;
}

/** Ghi chú cho admin soát: gợi ý không đủ chắc để điền, bản EN để trống, lỗi ghi... */
export interface ReviewNote {
  field: string;
  note: string;
  snippet?: string;
}

export type FieldState = "fill" | "has-value" | "not-found";

export interface DocPlan {
  id: string;
  /** Tên tin (tiếng Việt) để admin tìm trong trang quản trị. */
  title: string;
  /** Tin đang xuất bản. `false` → báo cáo chỉ ghi id + trường + giá trị (không tên, không đoạn nội dung chưa công bố). */
  isPublic: boolean;
  /** Dữ liệu ghi (chỉ các ô đang trống, ghi ở locale `vi`). Rỗng = không ghi. */
  patch: Record<string, unknown>;
  fieldStates: Record<string, FieldState>;
  filled: FilledValue[];
  review: ReviewNote[];
  /** Có khi `--apply` ghi lỗi (thông báo ngắn, không chứa chuỗi kết nối). */
  error?: string;
}

export interface BackfillAdapter {
  /** Slug collection Payload, cũng là giá trị của `--collection`. */
  collection: string;
  /** Tên hiển thị trong báo cáo. */
  label: string;
  /** Trường do adapter phụ trách (thứ tự cột báo cáo). */
  fields: readonly { name: string; label: string }[];
  /** Đọc tin (locale `vi`) và lập kế hoạch điền; KHÔNG ghi. */
  plan(payload: Payload): Promise<DocPlan[]>;
}
