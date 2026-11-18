"use client";

import { useField } from "@payloadcms/ui";

/**
 * `afterInput` của relationship hasMany có giới hạn (BL-119): đủ `max` → nhắc "Tối đa N …" (ô đã khoá chọn thêm);
 * vượt `max` (dữ liệu cũ/API) → chữ đỏ + viền đỏ ô chọn (CSS `data-over-max`). Ẩn khi Payload đã hiện lỗi server dưới ô để không lặp chữ.
 */
export function MaxSelectionHint({ path, max, unit }: { path: string; max: number; unit: string }) {
  const { value, showError } = useField<unknown[]>({ path });
  const count = Array.isArray(value) ? value.length : 0;
  if (count < max || showError) return null;
  const over = count > max;
  return (
    <p className="tami-max-hint" data-over-max={over ? "true" : undefined} role="status">
      Tối đa {max} {unit}.
    </p>
  );
}
