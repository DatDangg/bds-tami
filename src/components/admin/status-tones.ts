// Map giá trị trạng thái → tone badge (BL-015, design §1.3). Một file duy nhất để test được: status-tones.test.ts quét
// mọi giá trị trạng thái nguồn (CONTENT/RENTAL/LEAD/APPLICATION/SALES/dịch) và FAIL nếu thiếu tone.
// Chỉ khai giá trị ở đây (không import collection) vì StatusBadge là client component: import collection sẽ kéo code server vào bundle.
import type { BadgeTone } from "./admin-tokens";

export const STATUS_TONES: Readonly<Record<string, BadgeTone>> = {
  // Nội dung + cho thuê
  draft: "neutral",
  published: "success",
  hidden: "neutral",
  rented: "neutral",
  // Lead
  new: "warning",
  contacted: "info",
  consulting: "info",
  won: "success",
  lost: "danger",
  spam: "neutral",
  // Hồ sơ ứng tuyển (`new` dùng chung với lead)
  reviewing: "warning",
  interview: "info",
  hired: "success",
  rejected: "danger",
  // Tình trạng mở bán của dự án
  upcoming: "info",
  selling: "success",
  handed_over: "neutral",
  // Trạng thái dịch (`translation.status`)
  none: "neutral",
  queued: "info",
  done: "success",
  failed: "danger",
  pending_review: "warning",
};

/** Giá trị lạ (thêm sau mà chưa khai) vẫn hiển thị được, tone trung tính; test chặn việc quên khai. */
export function toneForStatus(value: string): BadgeTone {
  return STATUS_TONES[value] ?? "neutral";
}
