"use client";

import { DefaultCell, useField, useFormFields } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";
import { useSyncExternalStore } from "react";

import { buildScheduleNotices, scheduledPublishLabel, VIETNAM_TIMEZONE_OFFSET_MINUTES } from "@/lib/admin/scheduled-publish";

const subscribeNothing = () => () => undefined;

/** Offset múi giờ của máy TẠI ngày giờ đang chọn (DST có thể khác hôm nay); giá trị chưa có / sai → hôm nay. */
function browserOffsetAt(value: string | null | undefined): number {
  const chosen = value ? new Date(value) : new Date();
  return (Number.isNaN(chosen.getTime()) ? new Date() : chosen).getTimezoneOffset();
}

/**
 * `afterInput` của `publishedAt` (Tin tức, BL-091): ghi chú giờ Việt Nam, cảnh báo máy không ở GMT+7 (theo offset TẠI ngày đang chọn),
 * cảnh báo tin đang hiện trên web bị ẩn khi đổi sang tương lai, và báo giờ tin sẽ tự hiện. Chỉ đọc giá trị trong form; không chặn lưu.
 */
export function ScheduledPublishNotice({ path }: { path: string }) {
  const { value, initialValue } = useField<string | null>({ path });
  const status = useFormFields(([fields]) => fields.status?.value);
  const savedStatus = useFormFields(([fields]) => fields.status?.initialValue);
  // Offset múi giờ chỉ biết ở trình duyệt: HTML server (và lần hydrate đầu) dùng GMT+7 để khớp nhau, sau đó đo theo máy.
  const timezoneOffsetMinutes = useSyncExternalStore(subscribeNothing, () => browserOffsetAt(value), () => VIETNAM_TIMEZONE_OFFSET_MINUTES);
  const [timezoneNote, ...dynamicNotices] = buildScheduleNotices({ value, savedPublishedAt: initialValue, status, savedStatus, now: new Date(), timezoneOffsetMinutes });
  return (
    <div className="tami-schedule-notices">
      <p className="tami-field-hint">{timezoneNote?.text}</p>
      {/* Chỉ cảnh báo / thông tin động nằm trong live region; ghi chú múi giờ tĩnh thì không. */}
      <div role="status">
        {dynamicNotices.map((notice) => (
          <p key={notice.text} className={notice.tone === "warning" ? "tami-field-hint tami-field-hint--warn" : "tami-field-hint"}>
            {notice.text}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Ô "Ngày xuất bản" của danh sách tin: ngày như cũ; tin `published` hẹn giờ tương lai → "Đã hẹn giờ · dd/MM/yyyy HH:mm" (giờ VN). */
export function ScheduledPublishCell(props: DefaultCellComponentProps) {
  const status = (props.rowData as { status?: unknown } | undefined)?.status;
  const label = scheduledPublishLabel(status, props.cellData, new Date());
  if (label === null) return <DefaultCell {...props} />;
  return <span className="tami-schedule-cell">{label}</span>;
}
