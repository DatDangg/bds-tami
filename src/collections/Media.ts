import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { isAdmin, isStaff, ownedByUserOrAdmin } from "../access";
import { blockDeleteWhileUsedByHomepage } from "../hooks/media/guard-delete";
import { MEDIA_FILE_CACHE_CONTROL } from "../lib/http/cache-policy";
import { createUploadGuard, MEDIA_POLICY } from "../lib/upload/validate-file";

/** Hook trả `data` đã gắn `uploadedBy`; `originalDoc` chỉ có khi sửa. */
const stampUploader: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation === "create") {
    // Ghi đè giá trị client gửi; Local API không có user (seed/script) thì giữ nguyên.
    if (req.user) data.uploadedBy = req.user.id;
  } else if (originalDoc) {
    // Người uploader là bất biến: sửa không chuyển quyền sở hữu file.
    data.uploadedBy = originalDoc.uploadedBy;
  }
  return data;
};

const isImageMime = (mimeType: unknown): boolean => typeof mimeType === "string" && mimeType.startsWith("image/");

const WEBP = { format: "webp", options: { quality: 80 } } as const;

/**
 * Ảnh/PDF/video công khai (bucket `public`, ERD §4.12). Ai cũng đọc; staff upload; sale chỉ sửa file mình
 * upload; chỉ admin xoá (PERMISSION §3.1). Kiểm MIME thật + tên ngẫu nhiên: `createUploadGuard`.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { useAsTitle: "alt", defaultColumns: ["filename", "alt", "mimeType", "uploadedBy"] },
  access: {
    read: () => true,
    create: isStaff,
    update: ownedByUserOrAdmin("uploadedBy"),
    delete: isAdmin,
  },
  // Nhân bản sẽ nạp lại file mà không qua kiểm tra upload.
  disableDuplicate: true,
  hooks: {
    beforeOperation: [createUploadGuard(MEDIA_POLICY)],
    beforeChange: [stampUploader],
    beforeDelete: [blockDeleteWhileUsedByHomepage],
  },
  upload: {
    mimeTypes: Object.keys(MEDIA_POLICY),
    adminThumbnail: "thumb",
    // Ngoại lệ cache G1: tên file bất biến nên CDN/trình duyệt giữ 1 năm. Chỉ áp cho 200/206/304 (lỗi không qua đây).
    modifyResponseHeaders: ({ headers }) => {
      headers.set("Cache-Control", MEDIA_FILE_CACHE_CONTROL);
      return headers;
    },
    // Chặn "bom giải nén": ảnh ≤ 10MB nhưng hàng trăm megapixel làm sharp hết RAM.
    constructorOptions: { limitInputPixels: 80_000_000 },
    // Ảnh nhỏ hơn cỡ đích không bị phóng to nên thiếu cỡ đó: nơi hiển thị phải rơi về ảnh gốc.
    imageSizes: [
      { name: "thumb", width: 400, formatOptions: WEBP },
      { name: "card", width: 800, formatOptions: WEBP },
      { name: "large", width: 1600, formatOptions: WEBP },
      { name: "og", width: 1200, height: 630, formatOptions: WEBP },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true,
      // Bắt buộc với ảnh (a11y + SEO); PDF/video không cần. `mimeType` đã được Payload điền trước bước validate.
      validate: (value: string | null | undefined, { siblingData }: { siblingData: Partial<{ mimeType: string }> }) => {
        if (isImageMime(siblingData?.mimeType) && !value?.trim()) return "Ảnh cần mô tả (alt).";
        return true;
      },
    },
    { name: "caption", type: "text", localized: true },
    {
      name: "uploadedBy",
      type: "relationship",
      relationTo: "staff",
      // Khách đọc media nhưng không thấy ai upload.
      access: { read: isStaff },
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
};
