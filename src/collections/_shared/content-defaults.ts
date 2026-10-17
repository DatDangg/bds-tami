import type { Access, CollectionConfig, CollectionSlug, Field, FieldAccess } from "payload";

import { isAdmin, isAuthorOrAdmin, isStaff, makePublishedOnly, PUBLIC_STATUSES } from "../../access";
import { authorField } from "../../fields/author";
import { isFeaturedField } from "../../fields/is-featured";
import { publishedAtField } from "../../fields/published-at";
import { seoField } from "../../fields/seo";
import { slugField } from "../../fields/slug";
import { CONTENT_STATUSES, type ContentStatus, statusField } from "../../fields/status";
import { translationFields } from "../../fields/translation";
import { auditContentPurge, auditContentTrash } from "../../hooks/audit-content-delete";
import { guardTrashedEdit } from "../../hooks/guard-trashed-edit";
import { requireEnglishFields } from "../../hooks/require-english-fields";
import { createRevalidateContent, type RevalidatePaths } from "../../hooks/revalidate-content";
import { CONTENT_ROUTES, type ContentRoute } from "../../lib/content/content-paths";

/** Số bản phiên bản giữ lại mỗi bản ghi (ERD §7). */
export const MAX_VERSIONS_PER_DOC = 20;

export interface ContentOptions {
  /** Các giá trị `status` hợp lệ; `rentals` truyền thêm `rented`. */
  statuses?: readonly ContentStatus[];
  /** Trạng thái khách đọc được (mặc định `published`; `rentals` thêm `rented`). */
  publicStatuses?: readonly string[];
  /** Trường nguồn sinh slug (mặc định `title`; `categories` dùng `name`). */
  slugSource?: string;
  /** Trường EN bắt buộc để bật `hasEnglish` (mặc định `title`, `slug`; thêm mô tả ngắn + nội dung chính theo collection). */
  englishRequiredFields?: readonly string[];
  /** Trang công khai để làm mới cache; mặc định tra `CONTENT_ROUTES` theo slug collection. */
  route?: ContentRoute;
  /**
   * Ghi đè access của trường dùng chung theo tên (gộp nông vào access mặc định). Vd `pages` cho admin bật EN:
   * `{ hasEnglish: { update: isAdmin } }`. Access cấp collection (`create`...) ghi đè qua `collection.access`.
   */
  fieldAccess?: Readonly<Record<string, Partial<Record<"create" | "read" | "update", FieldAccess>>>>;
  /** Chỉ test ghi đè để không phụ thuộc Next. */
  revalidate?: RevalidatePaths;
}

/**
 * Xoá mềm = đổi `deletedAt` (Payload tính cả quyền `delete` với `data.deletedAt != null`): sale xoá được bản của
 * mình. Gọi `delete` thật (không có `data`) là xoá hẳn khỏi DB: chỉ admin (PERMISSION §3.1).
 */
const deleteAccess: Access = (args) => {
  const isSoftDelete = args.data?.deletedAt != null;
  return isSoftDelete ? isAuthorOrAdmin(args) : isAdmin(args);
};

function applyFieldAccess(fields: Field[], overrides: ContentOptions["fieldAccess"]): Field[] {
  if (!overrides) return fields;
  return fields.map((field) => {
    const override = "name" in field ? overrides[field.name] : undefined;
    return override ? ({ ...field, access: { ...("access" in field ? field.access : {}), ...override } } as Field) : field;
  });
}

/**
 * Bọc cấu hình collection nội dung bằng quy tắc dùng chung: các trường chung, access (PERMISSION §3.1, §4),
 * phiên bản, thùng rác + audit, chặn bật `hasEnglish` khi thiếu EN, làm mới cache vi/en. Cấu hình riêng của
 * collection thắng mặc định (`access`, `versions`...); hook của collection chạy SAU hook dùng chung.
 */
export function withContentDefaults(collection: CollectionConfig, options: ContentOptions = {}): CollectionConfig {
  const slug = collection.slug as CollectionSlug;
  const route = options.route ?? (CONTENT_ROUTES as Record<string, ContentRoute | undefined>)[slug];
  if (!route) throw new Error(`Thiếu trang công khai (route) cho collection nội dung "${slug}".`);
  const publicStatuses = options.publicStatuses ?? PUBLIC_STATUSES.default;
  const revalidate = createRevalidateContent({ route, publicStatuses, revalidate: options.revalidate });

  return {
    ...collection,
    trash: true,
    versions: collection.versions ?? { maxPerDoc: MAX_VERSIONS_PER_DOC, drafts: false },
    access: {
      read: makePublishedOnly(publicStatuses),
      create: isStaff,
      update: isAuthorOrAdmin,
      delete: deleteAccess,
      ...collection.access,
    },
    hooks: {
      ...collection.hooks,
      beforeValidate: [
        guardTrashedEdit,
        requireEnglishFields(options.englishRequiredFields ?? ["title", "slug"]),
        ...(collection.hooks?.beforeValidate ?? []),
      ],
      afterChange: [auditContentTrash, revalidate.afterChange, ...(collection.hooks?.afterChange ?? [])],
      afterDelete: [auditContentPurge, revalidate.afterDelete, ...(collection.hooks?.afterDelete ?? [])],
    },
    fields: [
      ...collection.fields,
      ...applyFieldAccess(
        [
          slugField({ sourceField: options.slugSource }),
          statusField(options.statuses ?? CONTENT_STATUSES),
          publishedAtField(),
          authorField(),
          isFeaturedField(),
          ...translationFields(),
          seoField(),
        ],
        options.fieldAccess,
      ),
    ],
  };
}
