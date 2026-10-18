import type { BeforeListServerProps } from "payload";

import { LeadExportButton } from "./LeadExportButton";

// Thùng rác dùng chung list view và Payload không truyền `viewType` vào slot, nhưng `params.segments` của route có:
// /collections/leads/trash -> ["collections", "leads", "trash"]; list drawer chỉ truyền ["collections", "leads"].
const TRASH_SEGMENT_INDEX = 2;

/**
 * Slot `beforeList` (server) của danh sách lead: xác định thùng rác phía server rồi mới render nút xuất (client).
 * Ẩn ở thùng rác vì endpoint chỉ xuất lead chưa xoá; quyền admin và list drawer do `LeadExportButton` xử lý.
 */
export function LeadExportSlot({ params }: Partial<Pick<BeforeListServerProps, "params">>) {
  const segments = params?.segments;
  if (Array.isArray(segments) && segments[TRASH_SEGMENT_INDEX] === "trash") return null;
  return <LeadExportButton />;
}
