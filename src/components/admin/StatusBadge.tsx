"use client";

import type { DefaultCellComponentProps } from "payload";

import { LinkedCell } from "./LinkedCell";
import { toneForStatus } from "./status-tones";

/** Badge trạng thái: chấm 6px + CHỮ (không chỉ màu), màu theo tone §1.3. Dùng lại ở dashboard. */
export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`admin-badge admin-badge--${toneForStatus(value)}`}>
      <span className="admin-badge__dot" aria-hidden="true" />
      {label ?? value}
    </span>
  );
}

type SelectOption = string | { label?: unknown; value: string };

const labelFromOptions = (options: readonly SelectOption[] | undefined, value: string): string | undefined => {
  const match = options?.find((option) => (typeof option === "string" ? option : option.value) === value);
  return typeof match === "object" && typeof match.label === "string" ? match.label : undefined;
};

/** `admin.components.Cell` của field select trạng thái: nhãn tiếng Việt lấy từ option của chính field; tôn trọng cờ link/drawer của Payload nếu cột này đứng đầu. */
export function StatusBadgeCell(props: DefaultCellComponentProps) {
  const { cellData, field } = props;
  if (typeof cellData !== "string" || cellData === "") return <span>—</span>;
  const options = "options" in field ? (field.options as readonly SelectOption[]) : undefined;
  return (
    <LinkedCell cell={props}>
      <StatusBadge value={cellData} label={labelFromOptions(options, cellData)} />
    </LinkedCell>
  );
}
