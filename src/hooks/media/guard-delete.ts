import { APIError, type CollectionBeforeDeleteHook } from "payload";

/**
 * Chặn xoá media đang là ảnh/video của trang chủ. `homepage_hero_slides.image_id` là NOT NULL còn FK là `ON DELETE SET NULL`, nên nếu cứ xoá
 * thì Postgres báo vi phạm ràng buộc (500 khó hiểu); ảnh/video khác sẽ âm thầm biến mất khỏi trang chủ. Các trường này không localized nên đọc
 * bản `vi` là đủ; ảnh OG của SEO (localized, tuỳ chọn) để FK tự đặt null.
 */
export const blockDeleteWhileUsedByHomepage: CollectionBeforeDeleteHook = async ({ id, req }) => {
  // Một số config test không nạp global `homepage`.
  if (!req.payload.config.globals.some((global) => global.slug === "homepage")) return;
  const homepage = await req.payload.findGlobal({ slug: "homepage", locale: "vi", fallbackLocale: false, depth: 0, overrideAccess: true, req });
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
