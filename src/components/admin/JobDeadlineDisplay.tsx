"use client";

import { useField } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { formatDeadlineVn, isJobPostingExpired } from "@/lib/admin/job-deadline";

import { StatusBadge } from "./StatusBadge";

/** Badge cảnh báo "Đã quá hạn" (chữ + chấm, không chỉ màu). Không đi qua `STATUS_TONES` vì "quá hạn" không phải giá trị trạng thái lưu trong DB. */
function ExpiredBadge() {
  return <StatusBadge value="expired" label="Đã quá hạn" tone="warning" />;
}

/** `afterInput` của `deadline`: hạn trước hôm nay (giờ VN) → badge + câu giải thích tin đã tự ẩn. Chỉ đọc giá trị trong form. */
export function JobDeadlineNotice({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  if (!isJobPostingExpired(value, new Date())) return null;
  return (
    <p className="tami-field-hint tami-deadline-notice" role="status">
      <ExpiredBadge /> Tin đã tự ẩn khỏi website.
    </p>
  );
}

/** Ô "Hạn nộp hồ sơ" của danh sách: `dd/MM/yyyy` (giờ VN) + badge khi quá hạn. Không đổi query/sắp xếp/lọc của cột. */
export function JobDeadlineCell({ cellData }: DefaultCellComponentProps) {
  const text = formatDeadlineVn(cellData);
  if (text === null) return <span>—</span>;
  return (
    <span className="tami-deadline-cell">
      {text}
      {isJobPostingExpired(cellData, new Date()) && <ExpiredBadge />}
    </span>
  );
}
