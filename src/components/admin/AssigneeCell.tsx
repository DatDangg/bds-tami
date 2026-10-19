"use client";

import { DefaultCell } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { LinkedCell } from "./LinkedCell";

type AssigneeRow = { assigneeName?: string | null; assigneeInactive?: boolean };

/**
 * Cột người phụ trách của lead: hiện tên sale từ `assigneeName` (cột ảo trả sẵn theo dòng, không request client-side nên không nháy
 * "Đang tải...") + badge "Sale đã nghỉ" khi sale bị khoá (`assigneeInactive`, chỉ admin đọc được). Chưa giao → `—`.
 * Thiếu `assigneeName` (dữ liệu dòng không có cột ảo) mà vẫn có người phụ trách → rơi về cell mặc định của Payload.
 */
export function AssigneeCell(props: DefaultCellComponentProps) {
  const row = props.rowData as AssigneeRow | undefined;
  const inactive = row?.assigneeInactive === true;
  const name = row?.assigneeName;
  const content = name ? name : props.cellData ? <DefaultCell {...props} link={false} /> : "—";
  return (
    <span className="admin-assignee-cell">
      <LinkedCell cell={props}>{content}</LinkedCell>
      {inactive ? (
        <span className="admin-badge admin-badge--danger">
          <span className="admin-badge__dot" aria-hidden="true" />
          Sale đã nghỉ
        </span>
      ) : null}
    </span>
  );
}
