import { APIError, type CollectionBeforeDeleteHook } from "payload";

import type { Homepage } from "../../payload-types";

/**
 * Chặn xoá media đang là ảnh/video của trang chủ. `homepage_hero_slides.image_id` là NOT NULL còn FK là `ON DELETE SET NULL`, nên nếu cứ xoá
 * thì Postgres báo vi phạm ràng buộc (500 khó hiểu); ảnh/video khác sẽ âm thầm biến mất khỏi trang chủ. Các trường này không localized nên đọc
 * bản `vi` là đủ; ảnh OG của SEO (localized, tuỳ chọn) để FK tự đặt null.
 */
export const blockDeleteWhileUsedByHomepage: CollectionBeforeDeleteHook = async ({ id, req }) => {
  // Một số config test không nạp global `homepage`.
  if (!req.payload.config.globals.some((global) => global.slug === "homepage")) return;
  // Adapter DB, KHÔNG phải Local API: Local API ghi đè `req.locale` thành `vi` nên response/afterRead của request xoá (en) trả alt vi. `req` chỉ để cùng transaction.
  const homepage = (await req.payload.db.findGlobal({ slug: "homepage", locale: "vi", req })) as Partial<Homepage>;
  const slides = homepage.hero?.slides ?? [];
  const usedIds = [
    ...slides.flatMap((slide) => [slide.image, slide.video]),
    homepage.about?.image,
    homepage.ctaBanner?.backgroundImage,
  ];
  if (usedIds.some((usedId) => usedId === id)) {
    throw new APIError("Không xoá được ảnh/video đang dùng ở trang chủ. Hãy thay ảnh/video đó ở Trang chủ trước.", 409, undefined, true);
  }
};
