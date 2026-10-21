import type { DefaultCellComponentProps } from "payload";

import { getEnv } from "../../lib/env";
import { RowActions, type RowActionsRow } from "./RowActions";

/** Phần server của ô "Thao tác" (BL-051 A12): đọc `NEXT_PUBLIC_SITE_URL` qua `getEnv()` (cùng nguồn `DocumentNavSlot`) và chỉ chuyển sang client phần dữ liệu dòng cần dùng. */
export function RowActionsCell({ collectionSlug, rowData, viewType }: DefaultCellComponentProps) {
  const row = rowData as RowActionsRow | undefined;
  if (!row || row.id === undefined || row.id === null) return null;
  const { id, author, slug, status, kind, hasEnglish, deletedAt, title, code } = row;
  return <RowActions collectionSlug={collectionSlug} row={{ id, author, slug, status, kind, hasEnglish, deletedAt, title, code }} inTrash={viewType === "trash"} siteUrl={getEnv().NEXT_PUBLIC_SITE_URL} />;
}
