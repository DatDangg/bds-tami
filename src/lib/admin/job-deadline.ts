import { deadlineDate, isPastDeadline } from "../careers/deadline";

/**
 * Tin tuyển dụng đã quá hạn nộp? Cùng mốc giờ Việt Nam với chip "Hết hạn" (`startOfVietnamDay`): hạn là ngày VN, quá hạn từ 00:00 ngày kế tiếp.
 * Chưa có hạn (form tạo mới) → false để không hiện badge sai.
 */
export function isJobPostingExpired(deadline: unknown, now: Date): boolean {
  return typeof deadline === "string" && deadline !== "" && isPastDeadline(deadline, now);
}

/** Ngày hạn `dd/MM/yyyy` (giờ Việt Nam); không đọc được → null. */
export function formatDeadlineVn(deadline: unknown): string | null {
  if (typeof deadline !== "string") return null;
  const date = deadlineDate(deadline);
  if (date === null) return null;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
