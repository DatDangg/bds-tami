import type { PayloadRequest, TaskConfig } from "payload";

import { startOfVietnamDay } from "../lib/careers/deadline";
import { CONTENT_ROUTES, contentPaths } from "../lib/content/content-paths";
import { revalidateWithNext, type RevalidatePaths } from "../hooks/revalidate-content";

export const CLOSE_JOB_POSTINGS_SLUG = "close-job-postings";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Tối đa số tin hết hạn trong một ngày mà job làm mới một lần; dư xa so với số tin thực tế của Tami. */
const MAX_EXPIRED_PER_RUN = 500;

export interface CloseJobPostingsOutcome {
  /** Số tin vừa hết hạn (hạn chót là NGÀY HÔM QUA giờ VN) đã được làm mới cache. */
  expired: number;
}

interface LocalizedSlugDoc {
  slug?: { vi?: string | null; en?: string | null } | null;
}

/**
 * Làm mới cache trang của các tin tuyển dụng vừa hết hạn (hạn chót là ngày hôm qua giờ VN): trang chi tiết (vi + en) và danh sách. KHÔNG đổi
 * `status` và không sửa bản ghi nào: tin hết hạn vẫn mở bằng URL trực tiếp và hiện băng "hết hạn" (SPECIFICATIONS F6); việc ẩn khỏi danh sách do
 * truy vấn danh sách (`listOpenJobs`, `deadline >= hôm nay giờ VN`), không phụ thuộc job này. Job là lưới an toàn cho cache ISR của trang chi tiết:
 * ngoài ngữ cảnh Next (process `jobs`) `revalidatePath` không có tác dụng và `revalidateWithNext` chỉ ghi cảnh báo (xem ARCHITECTURE §5.4), khi đó
 * trang chi tiết tự đổi trạng thái nhờ `revalidate = 60`. Sitemap bỏ tin hết hạn ở layer-8-task-05 (cũng theo hạn lúc dựng, không cần job).
 */
export async function closeJobPostings(args: { req: PayloadRequest; now?: Date; revalidate?: RevalidatePaths }): Promise<CloseJobPostingsOutcome> {
  const { req, now = new Date(), revalidate = revalidateWithNext } = args;
  const { payload } = req;
  const todayStart = startOfVietnamDay(now);
  const justExpired = await payload.find({
    collection: "job-postings",
    where: {
      and: [
        { status: { equals: "published" } },
        { deadline: { greater_than_equal: new Date(todayStart.getTime() - DAY_MS).toISOString() } },
        { deadline: { less_than: todayStart.toISOString() } },
      ],
    },
    locale: "all",
    select: { slug: true },
    depth: 0,
    limit: MAX_EXPIRED_PER_RUN,
    pagination: false,
    overrideAccess: true,
  });
  if (justExpired.docs.length === 0) return { expired: 0 };

  const slugs = (locale: "vi" | "en") =>
    justExpired.docs.flatMap((doc) => {
      const slug = (doc as unknown as LocalizedSlugDoc).slug?.[locale];
      return slug ? [slug] : [];
    });
  const paths = contentPaths(CONTENT_ROUTES["job-postings"], { slugs: { vi: slugs("vi"), en: slugs("en") }, featured: false });
  await revalidate(paths, req);
  return { expired: justExpired.docs.length };
}

/**
 * Hằng ngày 00:10 giờ VN = 17:10 UTC. Payload Jobs không có tuỳ chọn múi giờ cho `schedule` (dùng múi giờ của process) và container `jobs` chạy UTC
 * (compose chỉ đặt `TZ` cho `backup`), nên viết thẳng giờ UTC; đổi `TZ` của `jobs` thì phải đổi giờ ở đây. `cron` 6 trường như `aggregate-click-stats`.
 */
export const closeJobPostingsTask: TaskConfig<"close-job-postings"> = {
  slug: CLOSE_JOB_POSTINGS_SLUG,
  label: "Làm mới cache tin tuyển dụng vừa hết hạn (không đổi trạng thái)",
  retries: { attempts: 3, backoff: { type: "exponential", delay: 60_000 } },
  schedule: [{ cron: "0 10 17 * * *", queue: "default" }],
  outputSchema: [{ name: "expired", type: "number", required: true }],
  handler: async ({ req }) => {
    const output = await closeJobPostings({ req });
    req.payload.logger.info({ ...output }, "Tuyển dụng: đã làm mới cache tin vừa hết hạn");
    return { output };
  },
};
