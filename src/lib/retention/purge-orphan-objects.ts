import type { Payload, PayloadRequest } from "payload";

import { runInLockedTransaction } from "../db/advisory-lock";
import { parseOrphanObjectScanMode } from "../env";
import { buildPrivateObjectKey, deletePrivateObject, filenameFromObjectKey, listPrivateObjectsPage } from "../private-objects/private-objects";
import type { RetentionStepArgs } from "./drain-batches";
import {
  DATA_RETENTION_LOCK_KEY,
  hoursBefore,
  ORPHAN_CV_GRACE_HOURS,
  ORPHAN_OBJECT_MAX_DELETE,
  ORPHAN_OBJECT_MAX_RATIO,
  ORPHAN_OBJECT_RATIO_MIN_COUNT,
  RETENTION_MAX_BATCHES_PER_STEP,
  RETENTION_MAX_FAILED_RECORDS_PER_STEP,
} from "./retention-config";

/** Trong một trang liệt kê, trả các key KHÔNG có dòng `private-files` nào tương ứng (so theo key thật dựng từ `prefix`/`filename` của dòng). */
async function findKeysWithoutRow(payload: Payload, keys: string[], req: PayloadRequest): Promise<string[]> {
  if (keys.length === 0) return [];
  const rows = await payload.find({
    collection: "private-files",
    where: { filename: { in: keys.map(filenameFromObjectKey) } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const referenced = new Set(rows.docs.map((row) => buildPrivateObjectKey(row)));
  return keys.filter((key) => !referenced.has(key));
}

interface Scan {
  orphanKeys: string[];
  listedCount: number;
}

/** Liệt kê tối đa `RETENTION_MAX_BATCHES_PER_STEP` trang (x 1000 key); gom key cũ hơn ngưỡng mà không có dòng DB, và đếm tổng key đã liệt kê (cho ngưỡng tỉ lệ). */
async function scanBucket(payload: Payload, prefix: string, cutoff: Date, req: PayloadRequest): Promise<Scan> {
  const scan: Scan = { orphanKeys: [], listedCount: 0 };
  let nextToken: string | undefined;
  for (let page = 0; page < RETENTION_MAX_BATCHES_PER_STEP; page += 1) {
    const listing = await listPrivateObjectsPage(prefix, nextToken);
    scan.listedCount += listing.objects.length;
    const oldKeys = listing.objects.filter((object) => object.lastModified < cutoff).map((object) => object.key);
    scan.orphanKeys.push(...(await findKeysWithoutRow(payload, oldKeys, req)));
    nextToken = listing.nextToken;
    if (!nextToken) break;
  }
  return scan;
}

/** DB rỗng/nhầm DB/restore cũ làm gần như mọi object thành "mồ côi": vượt ngưỡng thì từ chối xoá thay vì xoá hàng loạt. */
function exceedsSafetyLimit(scan: Scan, maxDelete: number): string | undefined {
  const found = scan.orphanKeys.length;
  if (found > maxDelete) return `${found} object mồ côi vượt ngưỡng ${maxDelete}`;
  if (found >= ORPHAN_OBJECT_RATIO_MIN_COUNT && found / scan.listedCount > ORPHAN_OBJECT_MAX_RATIO) {
    return `${found}/${scan.listedCount} object mồ côi vượt ${ORPHAN_OBJECT_MAX_RATIO * 100}% số object đã liệt kê`;
  }
  return undefined;
}

async function deleteOrphans(payload: Payload, keys: string[], tally: RetentionStepArgs["tally"]): Promise<void> {
  let failed = 0;
  for (const key of keys) {
    try {
      await deletePrivateObject(key);
      tally.orphanObjectsDeleted += 1;
    } catch (error) {
      failed += 1;
      tally.failedRecords += 1;
      payload.logger.error({ step: "purge-orphan-objects", errorName: error instanceof Error ? error.name : "unknown" }, "Data retention: không xoá được object mồ côi, bỏ qua và xử lý tiếp");
      if (failed >= RETENTION_MAX_FAILED_RECORDS_PER_STEP) break;
    }
  }
  if (failed > 0) throw new Error(`purge-orphan-objects: ${failed} object lỗi (đã xoá ${tally.orphanObjectsDeleted})`);
}

/**
 * Quét đối chiếu bucket private ↔ DB: object cũ hơn ngưỡng (`ORPHAN_CV_GRACE_HOURS`, chừa thời gian giữa upload S3 và commit dòng DB) mà không có dòng
 * `private-files` nào trỏ tới là mồ côi (vét object PII do lỗi xoá trước đây hoặc tiến trình chết giữa chừng; `purge-orphan-cvs` duyệt theo DB nên không thấy).
 * Vì xoá theo SỰ VẮNG MẶT của dòng DB nên có 3 lớp chặn: (1) `RETENTION_ORPHAN_OBJECT_SCAN` — `off` bỏ qua, `dry-run` (mặc định) chỉ đếm vào
 * `orphanObjectsFound` + audit, `delete` mới xoá; `dryRun` của job luôn chỉ đếm; (2) ngưỡng `ORPHAN_OBJECT_MAX_DELETE` / `ORPHAN_OBJECT_MAX_RATIO`: vượt thì
 * KHÔNG xoá gì và ném lỗi (vào `failedSteps` của audit); (3) giữ khoá advisory như các bước khác nên lần chạy chồng không đếm/xoá trùng.
 * Mỗi lần chạy tối đa `RETENTION_MAX_BATCHES_PER_STEP` trang, phần dư dọn ở lần sau. Key lỗi xoá được bỏ qua (đếm `failedRecords`), cuối bước ném để job thử lại.
 * `orphanObjectScanPrefix` giới hạn vùng quét (mặc định cả bucket private; test dùng để không đụng object ngoài vùng của mình). Log chỉ số lượng, không log key.
 */
export async function purgeOrphanObjects({ payload, now, dryRun, tally, orphanObjectScanPrefix = "", orphanObjectScanMode, orphanObjectMaxDelete }: RetentionStepArgs): Promise<void> {
  const mode = orphanObjectScanMode ?? parseOrphanObjectScanMode(process.env.RETENTION_ORPHAN_OBJECT_SCAN);
  if (mode === "off") return;
  const cutoff = hoursBefore(now, ORPHAN_CV_GRACE_HOURS);
  await runInLockedTransaction(payload, DATA_RETENTION_LOCK_KEY, async (req) => {
    const scan = await scanBucket(payload, orphanObjectScanPrefix, cutoff, req);
    tally.orphanObjectsFound += scan.orphanKeys.length;
    if (dryRun || mode === "dry-run") return;
    const violation = exceedsSafetyLimit(scan, orphanObjectMaxDelete ?? ORPHAN_OBJECT_MAX_DELETE);
    if (violation) {
      payload.logger.error({ step: "purge-orphan-objects", found: scan.orphanKeys.length, listed: scan.listedCount }, "Data retention: quét object mồ côi bị chặn bởi ngưỡng an toàn, không xoá gì");
      throw new Error(`purge-orphan-objects: ${violation}, không xoá (kiểm tra DB/bucket có khớp nhau không)`);
    }
    await deleteOrphans(payload, scan.orphanKeys, tally);
  });
}
