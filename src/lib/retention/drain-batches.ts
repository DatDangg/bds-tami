import type { Payload, Where } from "payload";

import type { OrphanObjectScanMode } from "../env";
import { RETENTION_BATCH_SIZE, RETENTION_MAX_BATCHES_PER_STEP, RETENTION_MAX_FAILED_RECORDS_PER_STEP } from "./retention-config";

/** Bộ đếm cộng dồn của một lần chạy: mỗi bước cộng NGAY sau khi commit từng lô/bản ghi, nên bước lỗi giữa chừng vẫn để lại số đã xử lý thật (cho audit/log). */
export interface RetentionTally {
  leadsAnonymized: number;
  applicationsAnonymized: number;
  cvFilesDeleted: number;
  orphanCvsDeleted: number;
  orphanObjectsDeleted: number;
  /** Số object mồ côi PHÁT HIỆN (cả khi chỉ đếm/bị chặn bởi ngưỡng): không phải số đã xoá, không tính vào tổng thay đổi. */
  orphanObjectsFound: number;
  auditLogsDeleted: number;
  failedJobsDeleted: number;
  /** Số bản ghi/object xử lý lỗi (bị bỏ qua, thử lại lần sau): KHÔNG phải số đã thay đổi, nên không tính vào tổng thay đổi. */
  failedRecords: number;
}

export const emptyRetentionTally = (): RetentionTally => ({
  leadsAnonymized: 0,
  applicationsAnonymized: 0,
  cvFilesDeleted: 0,
  orphanCvsDeleted: 0,
  orphanObjectsDeleted: 0,
  orphanObjectsFound: 0,
  auditLogsDeleted: 0,
  failedJobsDeleted: 0,
  failedRecords: 0,
});

export interface RetentionStepArgs {
  payload: Payload;
  now: Date;
  /** `true`: chỉ đếm bản ghi đến hạn (vào `tally`), không đổi gì. */
  dryRun: boolean;
  tally: RetentionTally;
  /** Chỉ cho bước quét object mồ côi: giới hạn vùng quét theo prefix key (mặc định cả bucket private). */
  orphanObjectScanPrefix?: string;
  /** Ghi đè `RETENTION_ORPHAN_OBJECT_SCAN` (mặc định đọc từ env). */
  orphanObjectScanMode?: OrphanObjectScanMode;
  /** Ghi đè `ORPHAN_OBJECT_MAX_DELETE` (chỉ test). */
  orphanObjectMaxDelete?: number;
}

const warnCeiling = (payload: Payload, step: string, processed: number): void =>
  payload.logger.warn({ step, processed }, "Data retention: chạm trần số lô mỗi lần chạy, phần còn lại được dọn ở lần sau");

/**
 * Gọi `processBatch` (trả số bản ghi đã xử lý trong lô) cho tới khi lô không đầy hoặc chạm trần số lô; `record` được gọi sau MỖI lô
 * với số của lô đó. Chạm trần thì để phần còn lại cho lần chạy sau (idempotent) và ghi cảnh báo thay vì chạy vô hạn.
 */
export async function drainInBatches(payload: Payload, step: string, processBatch: () => Promise<number>, record: (processed: number) => void): Promise<void> {
  let total = 0;
  for (let batch = 0; batch < RETENTION_MAX_BATCHES_PER_STEP; batch += 1) {
    const processed = await processBatch();
    record(processed);
    total += processed;
    if (processed < RETENTION_BATCH_SIZE) return;
  }
  warnCeiling(payload, step, total);
}

/** Thêm điều kiện "không thuộc các id đã lỗi" để bản ghi lỗi không đứng đầu lô mãi. */
export const excludingIds = (where: Where, ids: string[]): Where => (ids.length === 0 ? where : { and: [where, { id: { not_in: ids } }] });

/**
 * Xử lý từng bản ghi đến hạn, MỖI bản ghi một lần gọi `processOne` (một transaction riêng, tự cộng vào `tally`). Trả `true` nếu đã xử lý,
 * `false` nếu bên khác xử lý trước. Một bản ghi lỗi (poison record, S3 sập) KHÔNG chặn các bản ghi sau: ghi log id (UUID, không PII), loại
 * khỏi các lô tiếp theo của lần chạy này và đi tiếp; dừng sớm khi đã quá `RETENTION_MAX_FAILED_RECORDS_PER_STEP` bản ghi lỗi. Cuối cùng
 * có lỗi thì ném lỗi tổng hợp (sau khi phần đã commit được cộng vào `tally`) để Payload Jobs thử lại.
 */
export async function processDueRecords(args: {
  payload: Payload;
  step: string;
  tally: RetentionTally;
  findDueIds: (excludeIds: string[]) => Promise<string[]>;
  processOne: (id: string) => Promise<boolean>;
}): Promise<void> {
  const { payload, step, tally, findDueIds, processOne } = args;
  const failedIds: string[] = [];
  let processedTotal = 0;
  let drained = false;
  for (let batch = 0; batch < RETENTION_MAX_BATCHES_PER_STEP && !drained; batch += 1) {
    const ids = await findDueIds(failedIds);
    let processedInBatch = 0;
    let failedInBatch = 0;
    for (const id of ids) {
      try {
        if (await processOne(id)) processedInBatch += 1;
      } catch (error) {
        failedIds.push(id);
        failedInBatch += 1;
        payload.logger.error({ step, id, errorName: error instanceof Error ? error.name : "unknown" }, "Data retention: bản ghi lỗi, bỏ qua và xử lý tiếp");
        if (failedIds.length >= RETENTION_MAX_FAILED_RECORDS_PER_STEP) break;
      }
    }
    processedTotal += processedInBatch;
    // Lô không đầy, toàn bản ghi bên khác đã xử lý, hoặc đã quá trần lỗi: hết việc ở lần chạy này.
    drained = ids.length < RETENTION_BATCH_SIZE || (processedInBatch === 0 && failedInBatch === 0) || failedIds.length >= RETENTION_MAX_FAILED_RECORDS_PER_STEP;
    if (!drained && batch === RETENTION_MAX_BATCHES_PER_STEP - 1) warnCeiling(payload, step, processedTotal);
  }
  tally.failedRecords += failedIds.length;
  if (failedIds.length > 0) throw new Error(`${step}: ${failedIds.length} bản ghi lỗi (đã xử lý ${processedTotal})`);
}
