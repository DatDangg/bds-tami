"use client";

import { useField } from "@payloadcms/ui";

import { todayDateFieldValue } from "@/lib/admin/form-hints";

/** Nút "Hôm nay" cạnh ô ngày: điền ngày hiện tại (giờ Việt Nam) khỏi mở lịch (BL-042). */
export function TodayButton({ path }: { path: string }) {
  const { setValue } = useField<string>({ path });
  return (
    <button type="button" className="tami-today-button" onClick={() => setValue(todayDateFieldValue(new Date()))}>
      Hôm nay
    </button>
  );
}
