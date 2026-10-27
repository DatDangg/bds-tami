"use client";

import { DefaultCell } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { LinkedCell } from "./LinkedCell";

/**
 * Cột "Người tạo": hiện tên từ `authorName` (field ảo trả sẵn theo dòng) thay vì cell quan hệ mặc định, vốn nạp tên bằng request
 * client-side `/api/staff` — Sale không đọc được hồ sơ staff khác nên chỉ thấy "Chưa đặt tên - ID" (BL-082). Không link sang hồ sơ staff.
 * Thiếu `authorName` (dòng không có field ảo) mà vẫn có người tạo → cell mặc định; chưa có → `—`.
 */
export function AuthorCell(props: DefaultCellComponentProps) {
  const name = (props.rowData as { authorName?: string | null } | undefined)?.authorName;
  const content = name ? name : props.cellData ? <DefaultCell {...props} link={false} /> : "—";
  return <LinkedCell cell={props}>{content}</LinkedCell>;
}
