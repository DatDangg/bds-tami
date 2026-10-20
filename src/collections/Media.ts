import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { isAdmin, isStaff, ownedByUserOrAdmin } from "../access";
import { fillImageAlt } from "../hooks/media/default-alt";
import { blockDeleteWhileUsedByHomepage } from "../hooks/media/guard-delete";
import { mimeTypeLabelField } from "../fields/mime-type-label";
import { collectionLabels } from "../lib/admin/collection-labels";
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
/** Cỡ ảnh phụ không có giá trị trong "Hiển thị cột"/"Thêm bộ lọc" (Payload lan cờ xuống nhóm size + trường lá; plugin S3 dựng lại nhóm `sizes` nên không đặt cờ ở nhóm `sizes` được). */
const HIDDEN_FROM_LIST = { disableListColumn: true, disableListFilter: true } as const;

/**
 * Ảnh/PDF/video công khai (bucket `public`, ERD §4.12). Ai cũng đọc; staff upload; sale chỉ sửa file mình
 * upload; chỉ admin xoá (PERMISSION §3.1). Kiểm MIME thật + tên ngẫu nhiên: `createUploadGuard`.
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: collectionLabels("media"),
  admin: {
    useAsTitle: "alt",
    defaultColumns: ["filename", "alt", "mimeType", "uploadedBy"],
    description: "Ảnh, PDF và video công khai dùng cho mọi nội dung; ảnh cần mô tả (alt).",
  },
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
    // Ảnh trống alt được điền từ tên file gốc (BL-042 #16); validator `alt` bên dưới vẫn là lưới an toàn.
    beforeValidate: [fillImageAlt],
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
      { name: "thumb", width: 400, formatOptions: WEBP, admin: HIDDEN_FROM_LIST },
      { name: "card", width: 800, formatOptions: WEBP, admin: HIDDEN_FROM_LIST },
      { name: "large", width: 1600, formatOptions: WEBP, admin: HIDDEN_FROM_LIST },
      { name: "og", width: 1200, height: 630, formatOptions: WEBP, admin: HIDDEN_FROM_LIST },
    ],
  },
  fields: [
    mimeTypeLabelField,
    {
      name: "alt",
      type: "text",
      label: "Mô tả ảnh (alt)",
      localized: true,
      // Bắt buộc với ảnh (a11y + SEO); PDF/video không cần. `mimeType` đã được Payload điền trước bước validate.
      validate: (value: string | null | undefined, { siblingData }: { siblingData: Partial<{ mimeType: string }> }) => {
        if (isImageMime(siblingData?.mimeType) && !value?.trim()) return "Ảnh cần mô tả (alt).";
        return true;
      },
    },
    { name: "caption", type: "text", label: "Chú thích", localized: true },
    {
      name: "uploadedBy",
      type: "relationship",
      label: "Người tải lên",
      relationTo: "staff",
      // Khách đọc media nhưng không thấy ai upload.
      access: { read: isStaff },
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
};
