import type { CollectionConfig } from "payload";

/** Collection có trang công khai + danh sách nội dung: có cột "Thao tác" (BL-051 A12). */
export const ROW_ACTION_COLLECTIONS: ReadonlySet<string> = new Set(["projects", "rentals", "property-posts", "news", "job-postings", "services", "pages"]);

export const ROW_ACTIONS_FIELD_NAME = "rowActions";
const ROW_ACTIONS_CELL = "/components/admin/RowActionsCell#RowActionsCell";

/** Thêm trường `ui` "Thao tác" vào CUỐI `fields` + `defaultColumns` (ngoại lệ BL-039, ghi trong spec F10). Không đổi schema (trường `ui` không có cột DB). */
export function withRowActionsColumn(collection: CollectionConfig): CollectionConfig {
  if (!ROW_ACTION_COLLECTIONS.has(collection.slug) || collection.fields.some((field) => "name" in field && field.name === ROW_ACTIONS_FIELD_NAME)) return collection;
  const column = { name: ROW_ACTIONS_FIELD_NAME, type: "ui", label: "Thao tác", admin: { components: { Cell: ROW_ACTIONS_CELL } } } as const;
  const columns = collection.admin?.defaultColumns ?? [];
  return { ...collection, fields: [...collection.fields, column], admin: { ...collection.admin, defaultColumns: [...columns, ROW_ACTIONS_FIELD_NAME] } };
}

export interface RowActionUser {
  id?: unknown;
  role?: unknown;
}

export interface RowActionInput {
  user: RowActionUser | null | undefined;
  /** `useAuth().permissions.collections[slug]` — chỉ cần truthy/falsy từng quyền. */
  permissions: { create?: unknown; update?: unknown } | undefined;
  /** Dòng của danh sách; `author` là id hoặc object đã populate. */
  rowData: { author?: unknown } | undefined;
  disableDuplicate: boolean;
}

export interface RowActionVisibility {
  edit: boolean;
  duplicate: boolean;
  trash: boolean;
}

/** `author` của dòng có phải `userId` không — chấp nhận id (string/number) hoặc object populate `{ id }`; thiếu → false (an toàn). */
export function isRowAuthor(author: unknown, userId: unknown): boolean {
  if (userId === undefined || userId === null || author === undefined || author === null) return false;
  const authorId = typeof author === "object" ? (author as { id?: unknown }).id : author;
  return authorId !== undefined && authorId !== null && String(authorId) === String(userId);
}

/**
 * Nút nào được hiện ở một dòng, khớp server: Sửa = quyền update + (admin | tác giả, như `isAuthorOrAdmin`); Xoá mềm = admin | tác giả
 * (KHÔNG xét quyền delete cấp danh sách vì server cho sale xoá mềm bài của mình); Nhân bản = quyền create và collection không `disableDuplicate`.
 */
export function rowActionVisibility({ user, permissions, rowData, disableDuplicate }: RowActionInput): RowActionVisibility {
  if (!user) return { edit: false, duplicate: false, trash: false };
  const owns = user.role === "admin" || isRowAuthor(rowData?.author, user.id);
  return { edit: Boolean(permissions?.update) && owns, duplicate: Boolean(permissions?.create) && !disableDuplicate, trash: owns };
}
