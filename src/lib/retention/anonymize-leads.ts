import type { Payload, PayloadRequest, Where } from "payload";

import { asSystemActivity } from "../../hooks/leads/lead-activity-hooks";
import { ANONYMIZED_PLACEHOLDER, MANUAL_ACTIVITY_TYPES } from "../leads/lead-values";
import { runInLockedTransaction } from "../db/advisory-lock";
import { excludingIds, processDueRecords, type RetentionStepArgs } from "./drain-batches";
import { DATA_RETENTION_LOCK_KEY, LEAD_RETENTION_MONTHS, monthsBefore, RETENTION_BATCH_SIZE } from "./retention-config";

/** Lead quá hạn chưa ẩn danh: `lastActivityAt` < mốc, hoặc không có `lastActivityAt` thì xét `createdAt`. Gồm cả lead đã xoá mềm (`trash`): dữ liệu khách vẫn nằm đó. */
function expiredLeadsWhere(cutoff: Date): Where {
  const iso = cutoff.toISOString();
  return {
    and: [
      { anonymizedAt: { exists: false } },
      { or: [{ lastActivityAt: { less_than: iso } }, { and: [{ lastActivityAt: { exists: false } }, { createdAt: { less_than: iso } }] }] },
    ],
  };
}

/** `referrer` có thể mang query/đường dẫn nhận diện được (vd từ khoá tìm kiếm là tên người): chỉ giữ nguồn (scheme + host) để còn thống kê kênh truy cập. */
function referrerOriginOnly(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const { origin } = new URL(referrer);
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

/** Ghi chú/cuộc gọi do sale gõ tự do (dễ có tên, SĐT khách): thay nội dung bằng giá trị thay thế, giữ loại, người thực hiện, thời gian. Cùng transaction với lead. */
async function anonymizeFreeTextActivities(payload: Payload, leadId: string, req: PayloadRequest): Promise<void> {
  const activities = await payload.find({
    collection: "lead-activities",
    where: { and: [{ lead: { equals: leadId } }, { type: { in: [...MANUAL_ACTIVITY_TYPES] } }] },
    pagination: false,
    depth: 0,
    select: { type: true },
    overrideAccess: true,
    req,
  });
  for (const activity of activities.docs) {
    // `update` của lead-activities bị deny cho mọi người; job hệ thống ghi bằng Local API `overrideAccess` + cờ hệ thống ghi.
    await asSystemActivity(req, () =>
      payload.update({ collection: "lead-activities", id: activity.id, data: { content: ANONYMIZED_PLACEHOLDER }, depth: 0, overrideAccess: true, req }),
    );
  }
}

/**
 * Ẩn danh MỘT lead trong transaction giữ khoá advisory. Chọn lại lead SAU khi có khoá với điều kiện hết hạn (lead vừa có tương tác mới
 * hoặc bên khác vừa ẩn danh thì bỏ qua, trả `false`).
 * Xoá: `fullName`/`phone`/`phoneNormalized` (NOT NULL → `ANONYMIZED_PLACEHOLDER`, hook `syncPhoneNormalized` đặt `phoneNormalized`), `email`/`message`,
 * `ipHash`/`userAgent`/`pageUrl` (NULL), `referrer` (chỉ giữ origin), nội dung activity `note`/`call`. Giữ số liệu: nguồn, trạng thái, mốc thời gian,
 * `mergedCount`, `utm`, loại/người/thời gian của activity. Cập nhật theo id (không `where` hàng loạt vốn nuốt lỗi).
 */
async function anonymizeOneLead(payload: Payload, id: string, where: Where, now: Date): Promise<boolean> {
  return runInLockedTransaction(payload, DATA_RETENTION_LOCK_KEY, async (req) => {
    const due = await payload.find({
      collection: "leads",
      where: { and: [where, { id: { equals: id } }] },
      limit: 1,
      pagination: false,
      depth: 0,
      trash: true,
      overrideAccess: true,
      req,
    });
    const lead = due.docs[0];
    if (!lead) return false;
    await payload.update({
      collection: "leads",
      id,
      data: {
        fullName: ANONYMIZED_PLACEHOLDER,
        phone: ANONYMIZED_PLACEHOLDER,
        email: null,
        message: null,
        ipHash: null,
        userAgent: null,
        pageUrl: null,
        referrer: referrerOriginOnly(lead.referrer),
        anonymizedAt: now.toISOString(),
      },
      trash: true,
      depth: 0,
      overrideAccess: true,
      req,
    });
    await anonymizeFreeTextActivities(payload, id, req);
    return true;
  });
}

/** Ẩn danh lead quá 24 tháng (BR-31, ERD §4.11/§7): KHÔNG xoá lead; một lead một transaction; lead lỗi bị bỏ qua và xử lý tiếp (xem `processDueRecords`). */
export async function anonymizeExpiredLeads({ payload, now, dryRun, tally }: RetentionStepArgs): Promise<void> {
  const where = expiredLeadsWhere(monthsBefore(now, LEAD_RETENTION_MONTHS));
  if (dryRun) {
    tally.leadsAnonymized = (await payload.count({ collection: "leads", where, trash: true, overrideAccess: true })).totalDocs;
    return;
  }
  await processDueRecords({
    payload,
    step: "anonymize-leads",
    tally,
    findDueIds: async (excludeIds) => {
      const due = await payload.find({
        collection: "leads",
        where: excludingIds(where, excludeIds),
        sort: "createdAt",
        limit: RETENTION_BATCH_SIZE,
        pagination: false,
        depth: 0,
        select: { createdAt: true },
        trash: true,
        overrideAccess: true,
      });
      return due.docs.map((lead) => lead.id);
    },
    processOne: async (id) => {
      const anonymized = await anonymizeOneLead(payload, id, where, now);
      if (anonymized) tally.leadsAnonymized += 1;
      return anonymized;
    },
  });
}
