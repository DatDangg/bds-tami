import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload, type TaskConfig } from "payload";

import { bucketClickEvents, clickRetentionCutoff, type ClickEventRow, type DailyClickBucket } from "../lib/click-stats/aggregate";

export const AGGREGATE_CLICK_STATS_SLUG = "aggregate-click-stats";

const BATCH_SIZE = 1_000;

export interface AggregationOutcome {
  aggregated: number;
  deleted: number;
}

/** Cộng `bucket.count` vào dòng thống kê cùng khoá `(date, type, refCollection, refId)`; chưa có thì tạo. */
async function addToDailyStats(
  payload: Payload,
  req: Awaited<ReturnType<typeof createLocalReq>>,
  bucket: DailyClickBucket,
): Promise<void> {
  const { docs } = await payload.find({
    collection: "click-stats-daily",
    where: {
      and: [
        { date: { equals: bucket.date.toISOString() } },
        { type: { equals: bucket.type } },
        { refCollection: { equals: bucket.refCollection } },
        { refId: { equals: bucket.refId } },
      ],
    },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  });
  const existing = docs[0];
  if (existing) {
    await payload.update({
      collection: "click-stats-daily",
      id: existing.id,
      data: { count: existing.count + bucket.count },
      req,
      overrideAccess: true,
    });
    return;
  }
  await payload.create({
    collection: "click-stats-daily",
    data: { ...bucket, date: bucket.date.toISOString() },
    req,
    overrideAccess: true,
  });
}

/**
 * Gộp tối đa một lô lượt bấm chưa gộp (tạo trước `upTo`) và đánh dấu đã gộp, TRONG MỘT transaction:
 * cộng dồn và đánh dấu cùng commit hoặc cùng rollback, nên lỗi giữa chừng/chạy lại không cộng trùng
 * cũng không bỏ sót. Trả số lượt bấm đã gộp trong lô.
 */
async function aggregateOneBatch(payload: Payload, upTo: Date): Promise<number> {
  const req = await createLocalReq({}, payload);
  const ownsTransaction = await initTransaction(req);
  try {
    const { docs } = await payload.find({
      collection: "click-events",
      where: { and: [{ aggregatedAt: { exists: false } }, { createdAt: { less_than_equal: upTo.toISOString() } }] },
      sort: "createdAt",
      limit: BATCH_SIZE,
      pagination: false,
      depth: 0,
      req,
      overrideAccess: true,
    });
    if (docs.length > 0) {
      const rows: ClickEventRow[] = docs;
      for (const bucket of bucketClickEvents(rows)) await addToDailyStats(payload, req, bucket);
      const marked = await payload.update({
        collection: "click-events",
        where: { id: { in: docs.map((doc) => doc.id) } },
        data: { aggregatedAt: upTo.toISOString() },
        req,
        overrideAccess: true,
      });
      if (marked.errors.length > 0) throw new Error(`Không đánh dấu được ${marked.errors.length} lượt bấm đã gộp`);
    }
    if (ownsTransaction) await commitTransaction(req);
    return docs.length;
  } catch (error) {
    if (ownsTransaction) await killTransaction(req);
    throw error;
  }
}

/**
 * Gộp lượt bấm thô vào `click-stats-daily` rồi xoá lượt bấm cũ hơn 90 ngày (ERD §7).
 * Idempotent nhờ dấu `aggregatedAt`: chỉ lượt chưa có dấu mới được cộng, và chỉ lượt ĐÃ có dấu mới bị xoá,
 * nên dữ liệu quá hạn mà chưa gộp (vd job ngừng lâu) vẫn được gộp trước khi xoá, không mất số liệu.
 */
export async function aggregateClickStats(args: { payload: Payload; now?: Date }): Promise<AggregationOutcome> {
  const { payload, now = new Date() } = args;
  let aggregated = 0;
  for (;;) {
    const batch = await aggregateOneBatch(payload, now);
    aggregated += batch;
    if (batch < BATCH_SIZE) break;
  }
  const deletion = await payload.delete({
    collection: "click-events",
    where: {
      and: [{ createdAt: { less_than: clickRetentionCutoff(now).toISOString() } }, { aggregatedAt: { exists: true } }],
    },
    overrideAccess: true,
  });
  if (deletion.errors.length > 0) throw new Error(`Không xoá được ${deletion.errors.length} lượt bấm quá hạn`);
  return { aggregated, deleted: deletion.docs.length };
}

/** Hằng giờ, đầu giờ. `schedule` do `payload.jobs.handleSchedules()` của process `jobs` xếp vào hàng đợi `default`. */
export const aggregateClickStatsTask: TaskConfig<"aggregate-click-stats"> = {
  slug: AGGREGATE_CLICK_STATS_SLUG,
  label: "Gộp lượt bấm Hotline/Zalo/Fanpage theo ngày",
  retries: { attempts: 3, backoff: { type: "exponential", delay: 60_000 } },
  schedule: [{ cron: "0 0 * * * *", queue: "default" }],
  outputSchema: [
    { name: "aggregated", type: "number", required: true },
    { name: "deleted", type: "number", required: true },
  ],
  handler: async ({ req }) => {
    const output = await aggregateClickStats({ payload: req.payload });
    req.payload.logger.info({ ...output }, "Click stats: đã gộp lượt bấm");
    return { output };
  },
};
