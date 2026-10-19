import type { BeforeListServerProps } from "payload";

import { RENTAL_QUICK_FILTER_GROUPS } from "@/lib/admin/quick-filters";

import { QuickFilterChips } from "./QuickFilterChips";

// Cùng cách `LeadExportSlot`: `params.segments` = ["collections", "rentals", "trash"] ở thùng rác (Payload không truyền `viewType`).
const TRASH_SEGMENT_INDEX = 2;

/** Slot `beforeListTable` (server) của Tin cho thuê: chip lọc nhanh, ẩn ở thùng rác (list drawer do `QuickFilterChips` tự ẩn). */
export function RentalQuickFilterSlot({ params }: Partial<Pick<BeforeListServerProps, "params">>) {
  const segments = params?.segments;
  if (Array.isArray(segments) && segments[TRASH_SEGMENT_INDEX] === "trash") return null;
  return <QuickFilterChips groups={RENTAL_QUICK_FILTER_GROUPS} />;
}
