import type { PayloadRequest, TaskConfig } from "payload";

import type { RevalidatePaths } from "../hooks/revalidate-content";
import { CONTENT_ROUTES, contentPaths } from "../lib/content/content-paths";
import { offerJustEndedWhere } from "../lib/content/offer-status";
import { revalidateFromJob } from "../lib/revalidate/internal-revalidate";

export const EXPIRE_OFFERS_SLUG = "expire-offers";

/** Tối đa số bài hết hạn ưu đãi trong một ngày mà job làm mới một lần; dư xa so với số bài thực tế của Tami. */
const MAX_EXPIRED_PER_RUN = 500;

export interface ExpireOffersOutcome {
  /** Số bài Đăng tin BĐS có ưu đãi vừa kết thúc (hạn là NGÀY HÔM QUA giờ VN) đã được làm mới cache. */
  expired: number;
}

interface LocalizedSlugDoc {
  slug?: { vi?: string | null; en?: string | null } | null;
}

/**
 * Làm mới cache trang của các bài Đăng tin BĐS có ưu đãi vừa kết thúc (`offer.endAt` là ngày hôm qua giờ VN): trang chi tiết (vi + en), danh sách
 * và trang chủ (khối "Ưu đãi nổi bật"). KHÔNG đổi bản ghi nào: "Đã kết thúc" do `isOfferEnded` tính từ `offer.endAt` và `now` (BR-06), nên
 * nhãn và việc loại khỏi khối nổi bật đã đúng ở lần render kế tiếp; job chỉ đẩy cache ISR cũ ra để việc đó diễn ra ngay lúc 00:05 thay vì chờ
 * `revalidate` hết hạn. Idempotent: chạy lại cùng ngày chỉ làm mới lại đúng tập đó. Job chạy ở process `jobs` (ngoài Next) nên `revalidate` mặc định
 * gọi route nội bộ của app (`revalidateFromJob`); lỗi gọi ném ra để Payload Jobs thử lại theo `retries`.
 */
export async function expireOffers(args: { req: PayloadRequest; now?: Date; revalidate?: RevalidatePaths }): Promise<ExpireOffersOutcome> {
  const { req, now = new Date(), revalidate = revalidateFromJob } = args;
  const justEnded = await req.payload.find({
    collection: "property-posts",
    where: { and: [{ status: { equals: "published" } }, offerJustEndedWhere(now)] },
    locale: "all",
    select: { slug: true },
    depth: 0,
    limit: MAX_EXPIRED_PER_RUN,
    pagination: false,
    overrideAccess: true,
  });
  if (justEnded.docs.length === 0) return { expired: 0 };
  // Chạm trần = có thể còn bài hết hạn chưa được làm mới; không cắt im lặng.
  if (justEnded.docs.length >= MAX_EXPIRED_PER_RUN) {
    req.payload.logger.warn({ limit: MAX_EXPIRED_PER_RUN }, "Ưu đãi: số bài vừa kết thúc chạm trần mỗi lần chạy, có thể còn bài chưa được làm mới cache");
  }

  const slugs = (locale: "vi" | "en") =>
    justEnded.docs.flatMap((doc) => {
      const slug = (doc as unknown as LocalizedSlugDoc).slug?.[locale];
      return slug ? [slug] : [];
    });
  await revalidate(contentPaths(CONTENT_ROUTES["property-posts"], { slugs: { vi: slugs("vi"), en: slugs("en") }, featured: true }), req);
  return { expired: justEnded.docs.length };
}

/**
 * Hằng ngày 00:05 giờ VN = 17:05 UTC (`schedule` của Payload Jobs không có múi giờ riêng, container `jobs` chạy UTC; xem `close-job-postings`).
 * `cron` 6 trường như các job khác.
 */
export const expireOffersTask: TaskConfig<"expire-offers"> = {
  slug: EXPIRE_OFFERS_SLUG,
  label: "Làm mới cache bài Đăng tin BĐS có ưu đãi vừa kết thúc (không đổi trạng thái)",
  retries: { attempts: 3, backoff: { type: "exponential", delay: 60_000 } },
  schedule: [{ cron: "0 5 17 * * *", queue: "default" }],
  outputSchema: [{ name: "expired", type: "number", required: true }],
  handler: async ({ req }) => {
    const output = await expireOffers({ req });
    req.payload.logger.info({ ...output }, "Ưu đãi: đã làm mới cache bài vừa kết thúc");
    return { output };
  },
};
