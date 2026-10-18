import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { runInLockedTransaction } from "../db/advisory-lock";
import { deletePrivateFile } from "./delete-private-file";
import { processDueRecords, type RetentionStepArgs } from "./drain-batches";
import { DATA_RETENTION_LOCK_KEY, hoursBefore, ORPHAN_CV_GRACE_HOURS, RETENTION_BATCH_SIZE, RETENTION_MAX_BATCHES_PER_STEP } from "./retention-config";

interface OrphanRow extends Record<string, unknown> {
  id: string;
}

/** `private-files` cũ hơn mốc, không hồ sơ nào trỏ tới (`NOT EXISTS`, một truy vấn thay vì duyệt từng CV), bỏ các id đã lỗi. Đọc thô vì Payload không có anti-join. */
async function findOrphanCvIds(payload: Payload, cutoff: Date, limit: number, excludeIds: string[] = []): Promise<string[]> {
  const db = payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<{ rows: OrphanRow[] }> };
  const excluded = excludeIds.length === 0 ? sql`` : sql` AND pf."id" NOT IN (${sql.join(excludeIds.map((id) => sql`${id}`), sql`, `)})`;
  const { rows } = await db.execute(sql`
    SELECT pf."id" FROM "private_files" pf
    WHERE pf."created_at" < ${cutoff.toISOString()}
      AND NOT EXISTS (SELECT 1 FROM "job_applications" ja WHERE ja."cv_id" = pf."id")${excluded}
    ORDER BY pf."created_at" ASC
    LIMIT ${limit}`);
  return rows.map((row) => row.id);
}

/**
 * Dọn CV mồ côi: tiến trình chết giữa lúc lưu CV và tạo hồ sơ để lại `private-files` + object S3 không ai trỏ tới (dữ liệu cá nhân không bao giờ được xoá).
 * Mỗi CV một transaction giữ khoá advisory; trong đó kiểm lại "vẫn không hồ sơ nào trỏ tới" rồi `deletePrivateFile` (xoá object S3 trước và ném nếu lỗi,
 * rồi mới xoá dòng DB). CV lỗi bị bỏ qua và xử lý tiếp (xem `processDueRecords`).
 * AN TOÀN VÌ `private-files` CHỈ CHỨA CV (quyết định 2026-10-18): access `create`/`update` bị khoá với mọi người dùng, chỉ Local API `overrideAccess`
 * (endpoint nộp CV công khai) tạo được, nên không file nội bộ nào của admin bị dọn nhầm. Nếu sau này lưu file nội bộ vào đây phải thêm trường phân loại
 * và lọc theo nó TRƯỚC khi dọn.
 * `dryRun` chỉ đếm (tối đa số lô × cỡ lô).
 */
export async function purgeOrphanCvs({ payload, now, dryRun, tally }: RetentionStepArgs): Promise<void> {
  const cutoff = hoursBefore(now, ORPHAN_CV_GRACE_HOURS);
  if (dryRun) {
    tally.orphanCvsDeleted = (await findOrphanCvIds(payload, cutoff, RETENTION_BATCH_SIZE * RETENTION_MAX_BATCHES_PER_STEP)).length;
    return;
  }
  await processDueRecords({
    payload,
    step: "purge-orphan-cvs",
    tally,
    findDueIds: (excludeIds) => findOrphanCvIds(payload, cutoff, RETENTION_BATCH_SIZE, excludeIds),
    processOne: async (id) => {
      const removed = await runInLockedTransaction(payload, DATA_RETENTION_LOCK_KEY, async (req) => {
        const referenced = await payload.count({ collection: "job-applications", where: { cv: { equals: id } }, overrideAccess: true, req });
        return referenced.totalDocs > 0 ? false : deletePrivateFile(payload, id, req);
      });
      if (removed) tally.orphanCvsDeleted += 1;
      return removed;
    },
  });
}
