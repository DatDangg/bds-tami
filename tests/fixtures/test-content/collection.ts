import type { CollectionConfig } from "payload";

import { isAdmin } from "../../../src/access";
import { withContentDefaults } from "../../../src/collections/_shared/content-defaults";
import type { RevalidatePaths } from "../../../src/hooks/revalidate-content";

export const TEST_CONTENT_SLUG = "test-content";

/** Mỗi lần hook revalidate chạy, danh sách đường dẫn được ghi vào đây để test kiểm. */
export const revalidateCalls: string[][] = [];

const recordRevalidate: RevalidatePaths = (paths) => {
  revalidateCalls.push(paths);
};

/**
 * Collection nội dung giả chỉ dùng trong test (KHÔNG đăng ký vào `payload.config.ts`): dùng đúng
 * `withContentDefaults` như mọi collection nội dung thật, trỏ về route `news`.
 */
export const TestContent: CollectionConfig = withContentDefaults(
  {
    slug: TEST_CONTENT_SLUG,
    admin: { useAsTitle: "title" },
    fields: [
      { name: "title", type: "text", localized: true },
      { name: "summary", type: "textarea", localized: true },
      // Trường localized không bắt buộc ở en: test kiểm fallback VI đã tắt.
      { name: "details", type: "text", localized: true },
      // Trường nội bộ: chỉ admin đọc (test truy vấn công khai kiểm khách không thấy).
      { name: "internalNote", type: "text", access: { read: isAdmin } },
    ],
  },
  {
    route: { list: "/tin-tuc", detail: "/tin-tuc/[slug]" },
    englishRequiredFields: ["title", "slug", "summary"],
    revalidate: recordRevalidate,
  },
);
