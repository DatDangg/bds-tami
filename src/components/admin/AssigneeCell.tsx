"use client";

import { DefaultCell } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { LinkedCell } from "./LinkedCell";

/** Cột người phụ trách của lead: giữ hiển thị mặc định + badge "Sale đã nghỉ" khi sale bị khoá (`assigneeInactive`, chỉ admin đọc được). */
export function AssigneeCell(props: DefaultCellComponentProps) {
  const inactive = (props.rowData as { assigneeInactive?: boolean } | undefined)?.assigneeInactive === true;
  return (
    <span className="admin-assignee-cell">
      <LinkedCell cell={props}>
        <DefaultCell {...props} link={false} />
      </LinkedCell>
      {inactive ? (
        <span className="admin-badge admin-badge--danger">
          <span className="admin-badge__dot" aria-hidden="true" />
          Sale đã nghỉ
        </span>
      ) : null}
    </span>
  );
}
