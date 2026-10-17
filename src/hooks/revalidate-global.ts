import type { GlobalAfterChangeHook, PayloadRequest } from "payload";

import { globalCacheTag } from "../lib/content/global-cache";

/** Làm mới các tag cache. Tách ra để test thay bằng bản ghi nhận. */
export type RevalidateTags = (tags: string[], req: PayloadRequest) => Promise<void> | void;

/**
 * Mặc định: `revalidateTag` của Next (hết hạn ngay, `expire: 0`, để lưu xong là khách thấy bản mới).
 * Ngoài ngữ cảnh Next (job, script, test) hàm ném lỗi vì thiếu work store: chỉ ghi cảnh báo, không làm hỏng thao tác lưu
 * (cache còn hết hạn theo `revalidate` của `get-globals`).
 */
export const revalidateTagsWithNext: RevalidateTags = async (tags, req) => {
  try {
    const { revalidateTag } = await import("next/cache");
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
  } catch (error) {
    req.payload.logger.warn({ err: error, tags }, "Không làm mới được cache global công khai (ngoài ngữ cảnh Next)");
  }
};

/** Hook `afterChange` của global: lưu → làm mới tag của chính global đó (phủ cả vi lẫn en). */
export function createRevalidateGlobal(slug: string, revalidate: RevalidateTags = revalidateTagsWithNext): GlobalAfterChangeHook {
  return async ({ doc, req }) => {
    await revalidate([globalCacheTag(slug)], req);
    return doc;
  };
}
