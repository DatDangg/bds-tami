import type { BeforeListTableServerProps } from "payload";

import { resolveCollectionQuickFilterGroups } from "@/lib/admin/collection-quick-filters";

import { QuickFilterChips } from "./QuickFilterChips";

// Cùng cách `RentalQuickFilterSlot`: `params.segments` = ["collections", "<slug>", "trash"] ở thùng rác (Payload không truyền `viewType`).
const TRASH_SEGMENT_INDEX = 2;

type SlotProps = Partial<Pick<BeforeListTableServerProps, "params" | "collectionSlug" | "payload" | "user">>;

/**
 * Slot `beforeListTable` (server) chung cho Dự án, Tin tức, Tin BĐS, Tuyển dụng, Hồ sơ ứng tuyển (BL-039): nhóm chip theo `collectionSlug`.
 * Ẩn ở thùng rác (list drawer do `QuickFilterChips` tự ẩn). Danh mục đọc bằng Local API với quyền người xem, không nâng quyền.
 */
export async function CollectionQuickFilterSlot({ params, collectionSlug, payload, user }: SlotProps) {
  const segments = params?.segments;
  if (Array.isArray(segments) && segments[TRASH_SEGMENT_INDEX] === "trash") return null;
  if (!collectionSlug || !payload) return null;
  const groups = await resolveCollectionQuickFilterGroups({ collectionSlug, payload, user });
  return groups.length > 0 ? <QuickFilterChips groups={groups} /> : null;
}
