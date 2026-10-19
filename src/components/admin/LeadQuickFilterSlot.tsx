import type { BeforeListServerProps } from "payload";

import { LEAD_QUICK_FILTER_GROUPS } from "@/lib/admin/quick-filters";

import { QuickFilterChips } from "./QuickFilterChips";

// Cùng cách `LeadExportSlot`: `params.segments` = ["collections", "leads", "trash"] ở thùng rác (Payload không truyền `viewType`).
const TRASH_SEGMENT_INDEX = 2;

/** Slot `beforeListTable` (server) của lead: chip Trạng thái, ẩn ở thùng rác (list drawer do `QuickFilterChips` tự ẩn). Không đổi quyền đọc: access `isAssignedOrAdmin` vẫn lọc phía server. */
export function LeadQuickFilterSlot({ params }: Partial<Pick<BeforeListServerProps, "params">>) {
  const segments = params?.segments;
  if (Array.isArray(segments) && segments[TRASH_SEGMENT_INDEX] === "trash") return null;
  return <QuickFilterChips groups={LEAD_QUICK_FILTER_GROUPS} />;
}
