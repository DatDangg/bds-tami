import { createLocalReq, type Payload, type PayloadRequest, type Where } from "payload";

import { buildForLocale, writeStoredSearchText } from "../../hooks/rentals/build-search-text";
import { locales } from "../../i18n/routing";
import { preserveRequestLocale } from "../payload/preserve-request-locale";

/** Tin nào cần dựng lại `searchText`: theo dự án / phường / tỉnh bị đổi, hoặc tất cả (lệnh chạy tay). */
export type ReindexScope = { projectId: string } | { wardId: string } | { provinceId: string } | "all";

export interface ReindexOutcome {
  /** Số tin đã duyệt. */
  rentals: number;
  /** Số cặp (tin, ngôn ngữ) đã ghi lại `searchText` (ngôn ngữ chưa có tiêu đề bị bỏ qua). */
  rows: number;
}

const BATCH_SIZE = 100;

function scopeWhere(scope: ReindexScope): Where | undefined {
  if (scope === "all") return undefined;
  if ("projectId" in scope) return { project: { equals: scope.projectId } };
  if ("wardId" in scope) return { ward: { equals: scope.wardId } };
  return { province: { equals: scope.provinceId } };
}

interface RentalSource {
  id: string;
  code?: string | null;
  address?: string | null;
  province?: unknown;
  ward?: unknown;
  project?: unknown;
  title?: Partial<Record<(typeof locales)[number], string | null>> | null;
}

/**
 * Dựng lại `searchText` (mọi ngôn ngữ đã có tiêu đề) của các tin thuộc `scope`, bằng ĐÚNG hàm dựng của hook lưu tin (`buildForLocale`),
 * rồi ghi thẳng `rentals_locales` + dòng phiên bản mới nhất (không `payload.update`: không tạo phiên bản/audit/revalidate). Idempotent.
 * Cần khi đổi nguồn của `searchText` NGOÀI tin: tên dự án, tên/tên cũ của phường, tên tỉnh (review layer-6-task-02).
 * Có `req` (gọi từ hook) thì chạy trong transaction của thao tác đang lưu; không có thì tự tạo `req` (lệnh `reindex:rentals-search`).
 * Xử lý tuần tự theo lô 100 tin để không giữ cả bảng trong bộ nhớ.
 */
export async function reindexRentalSearchText(payload: Payload, scope: ReindexScope, existingReq?: PayloadRequest): Promise<ReindexOutcome> {
  const req = existingReq ?? (await createLocalReq({}, payload));
  const where = scopeWhere(scope);
  const outcome: ReindexOutcome = { rentals: 0, rows: 0 };
  for (let page = 1; ; page++) {
    const batch = await preserveRequestLocale(req, () =>
      payload.find({
        collection: "rentals",
        ...(where ? { where } : {}),
        locale: "all",
        trash: true,
        depth: 0,
        sort: "id",
        limit: BATCH_SIZE,
        page,
        select: { code: true, title: true, address: true, province: true, ward: true, project: true },
        overrideAccess: true,
        req,
      }),
    );
    for (const doc of batch.docs as unknown as RentalSource[]) {
      outcome.rentals += 1;
      for (const locale of locales) {
        const title = doc.title?.[locale];
        if (!title) continue;
        const searchText = await buildForLocale(req, { ...doc, title }, locale);
        await writeStoredSearchText(req, String(doc.id), locale, searchText);
        outcome.rows += 1;
      }
    }
    if (!batch.hasNextPage) return outcome;
  }
}
