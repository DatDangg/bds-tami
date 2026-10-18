import type { Where } from "payload";

import { deadlineDate, isPastDeadline, startOfVietnamDay } from "../careers/deadline";

/**
 * Ưu đãi của bài Đăng tin BĐS (`property-posts.offer.endAt`, ERD §4.7, BR-06). NƠI DUY NHẤT quyết định "Đã kết thúc": nhãn trên bài,
 * khối "Ưu đãi nổi bật" (truy vấn dùng `offerNotEndedWhere`) và job `expire-offers` (dùng `offerJustEndedWhere`) đều đi qua đây nên không lệch.
 *
 * `endAt` là NGÀY kết thúc theo giờ Việt Nam (ô chọn ngày `dayOnly` của admin ghim 12:00 UTC): ưu đãi còn hiệu lực hết ngày đó và
 * kết thúc từ 00:00 ngày kế tiếp giờ VN, cùng quy ước với hạn nộp hồ sơ tuyển dụng (`careers/deadline`). Không có `endAt` = không hết hạn.
 */
export interface OfferPost {
  offer?: { endAt?: string | null } | null;
}

export function isOfferEnded(post: OfferPost, now: Date): boolean {
  const endAt = post.offer?.endAt;
  if (!endAt || deadlineDate(endAt) === null) return false;
  return isPastDeadline(endAt, now);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Điều kiện truy vấn: ưu đãi chưa kết thúc (không có hạn, hoặc hạn từ hôm nay giờ VN trở đi) = phủ định chính xác của `isOfferEnded`. */
export function offerNotEndedWhere(now: Date): Where {
  return {
    or: [{ "offer.endAt": { exists: false } }, { "offer.endAt": { greater_than_equal: startOfVietnamDay(now).toISOString() } }],
  };
}

/** Điều kiện truy vấn: ưu đãi ĐÃ kết thúc (có hạn và hạn trước hôm nay giờ VN) = `isOfferEnded`; danh sách xếp các bài này sau bài còn hạn. */
export function offerEndedWhere(now: Date): Where {
  return { and: [{ "offer.endAt": { exists: true } }, { "offer.endAt": { less_than: startOfVietnamDay(now).toISOString() } }] };
}

/** Điều kiện truy vấn: ưu đãi vừa kết thúc (hạn là NGÀY HÔM QUA giờ VN) = tập mà job 00:05 phải làm mới cache. */
export function offerJustEndedWhere(now: Date): Where {
  const todayStart = startOfVietnamDay(now);
  return {
    and: [
      { "offer.endAt": { greater_than_equal: new Date(todayStart.getTime() - DAY_MS).toISOString() } },
      { "offer.endAt": { less_than: todayStart.toISOString() } },
    ],
  };
}
