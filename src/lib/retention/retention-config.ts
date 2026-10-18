import { ADVISORY_LOCK_KEYS } from "../db/advisory-lock-keys";

/**
 * Thời hạn lưu dữ liệu (SPEC BR-31, ERD §7). Các mốc tháng/ngày là giả định A4: muốn đổi thì đổi ở đây qua `/change`, không sửa rải rác.
 * Mốc tính từ: lead = `lastActivityAt` (không có thì `createdAt`); hồ sơ ứng tuyển = `createdAt`.
 */
export const LEAD_RETENTION_MONTHS = 24;
export const JOB_APPLICATION_RETENTION_MONTHS = 12;
export const AUDIT_LOG_RETENTION_MONTHS = 24;
/** Job Payload hết lượt thử vẫn giữ `input` (có thể chứa dữ liệu khách) và log: dọn sau chừng này ngày để còn thời gian điều tra lỗi. */
export const FAILED_JOB_RETENTION_DAYS = 7;
/** CV chưa có hồ sơ nào trỏ tới chỉ bị coi là mồ côi sau chừng này giờ (chừa thời gian giữa lưu CV và tạo hồ sơ của endpoint công khai). */
export const ORPHAN_CV_GRACE_HOURS = 24;

/** Số bản ghi mỗi lô (mỗi lô một transaction) và số lô tối đa mỗi bước mỗi lần chạy; phần dư được dọn ở tuần sau. */
export const RETENTION_BATCH_SIZE = 100;
export const RETENTION_MAX_BATCHES_PER_STEP = 50;

/** Khoá advisory của job `data-retention` (id lấy từ registry `ADVISORY_LOCK_KEYS`, không trùng nghiệp vụ nào khác). */
export const DATA_RETENTION_LOCK_KEY = ADVISORY_LOCK_KEYS.dataRetention;

/** Một bước gặp quá chừng này bản ghi lỗi (poison record / S3 sập) thì dừng bước thay vì thử hết 5000 bản ghi; lần chạy sau thử lại. */
export const RETENTION_MAX_FAILED_RECORDS_PER_STEP = 20;

/** Lùi `months` tháng theo lịch UTC; ngày vượt quá độ dài tháng đích thì lấy ngày cuối tháng (31/3 lùi 1 tháng = 28/2, không tràn sang tháng sau). */
export function monthsBefore(now: Date, months: number): Date {
  const result = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
  const lastDayOfTargetMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(now.getUTCDate(), lastDayOfTargetMonth));
  return result;
}

export const daysBefore = (now: Date, days: number): Date => new Date(now.getTime() - days * 86_400_000);
export const hoursBefore = (now: Date, hours: number): Date => new Date(now.getTime() - hours * 3_600_000);
