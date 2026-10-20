"use client";

import { useField } from "@payloadcms/ui";

/**
 * Thông báo trong form tỉnh/phường/dự án khi tin cho thuê của bản ghi đang được dựng lại chỉ mục tìm kiếm ở chế độ nền (field ảo `searchReindexPending`,
 * chỉ admin nhận giá trị). Chỉ đọc, không nút hành động; không render gì khi không có job chờ/chạy hoặc user không phải admin.
 */
export function SearchReindexPendingWarning({ path }: { path: string }) {
  const { value } = useField<boolean>({ path });
  if (value !== true) return null;
  return (
    <p role="status" className="field-description" style={{ color: "var(--theme-warning-600)", fontWeight: 600 }}>
      Đang cập nhật dữ liệu tìm kiếm cho nhiều tin cho thuê; tìm theo tên mới sẽ đầy đủ sau ít phút.
    </p>
  );
}
