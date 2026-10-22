import type { Access, CollapsibleField, CollectionConfig, CollectionSlug, Field, FieldAccess, TabsField } from "payload";

import { isAdmin, isAuthorOrAdmin, isStaff, makePublishedOnly, PUBLIC_STATUSES } from "../../access";
import { authorField } from "../../fields/author";
import { isFeaturedField } from "../../fields/is-featured";
import { publishedAtField } from "../../fields/published-at";
import { scopeSlugField } from "../../fields/scope-slug";
import { seoField } from "../../fields/seo";
import { slugField } from "../../fields/slug";
import { CONTENT_STATUSES, type ContentStatus, statusField } from "../../fields/status";
import { translationBlockFields, translationFields } from "../../fields/translation";
import { auditContentPurge, auditContentTrash } from "../../hooks/audit-content-delete";
import { createSlugRedirect } from "../../hooks/create-slug-redirect";
import { defaultReadLocale } from "../../hooks/default-read-locale";
import { guardTrashedEdit } from "../../hooks/guard-trashed-edit";
import { requireEnglishFields } from "../../hooks/require-english-fields";
import { createRevalidateContent, type RevalidatePaths } from "../../hooks/revalidate-content";
import { detectManualEnglish } from "../../hooks/translation/detect-manual-en";
import { enqueueTranslation } from "../../hooks/translation/enqueue-translation";
import { CONTENT_ROUTES, type ContentRoute } from "../../lib/content/content-paths";

const VERSION_HISTORY_VIEW = "/components/admin/VersionHistoryView#VersionHistoryView";
const TRANSLATION_FILTER_COMPONENT = "/components/admin/TranslationStatusFilter#TranslationStatusFilter";

/** Số bản phiên bản giữ lại mỗi bản ghi (ERD §7). */
export const MAX_VERSIONS_PER_DOC = 20;

/** Tên các trường dùng chung mà `omit` / `fieldAccess` nhắm tới (`slug` gồm cả `scopeSlug` khi có `scopeField`). */
export const SHARED_FIELD_NAMES = [
  "slug",
  "status",
  "publishedAt",
  "author",
  "isFeatured",
  "hasEnglish",
  "translation",
  "seo",
] as const;
export type SharedFieldName = (typeof SHARED_FIELD_NAMES)[number];

type FieldAccessOverrides = Partial<Record<"create" | "read" | "update", FieldAccess | undefined>>;

export interface ContentOptions {
  /** Các giá trị `status` hợp lệ; `rentals` truyền thêm `rented`. */
  statuses?: readonly ContentStatus[];
  /** Trạng thái khách đọc được (mặc định `published`; `rentals` thêm `rented`). */
  publicStatuses?: readonly string[];
  /** Trường nguồn sinh slug (mặc định `title`; `categories` dùng `name`). */
  slugSource?: string;
  /**
   * Slug chỉ duy nhất trong cùng giá trị của trường này (vd `scope` của `categories`, ERD §4.3): kiểm trùng lọc theo
   * trường đó và DB giữ UNIQUE (`_locale`, trường, `slug`) qua trường phụ `scopeSlug`. Không dùng chung với `omit: ["slug"]`.
   */
  scopeField?: string;
  /** Trường EN bắt buộc để bật `hasEnglish` (mặc định `title`, `slug`; thêm mô tả ngắn + nội dung chính theo collection). */
  englishRequiredFields?: readonly string[];
  /**
   * Trang công khai để làm mới cache; mặc định tra `CONTENT_ROUTES` theo slug collection. `null` = collection không
   * có trang riêng (danh mục nền, chủ đầu tư): bỏ hook làm mới cache.
   */
  route?: ContentRoute | null;
  /**
   * Bỏ bớt trường dùng chung mà ERD không định nghĩa cho collection (vd `pages` không có `slug`/`author`).
   * Bỏ `status` thì collection PHẢI tự đặt `access.read` (mặc định lọc theo `status`).
   */
  omit?: readonly SharedFieldName[];
  /**
   * Ghi đè access của trường dùng chung theo tên (gộp nông vào access mặc định). Vd `pages` cho admin bật EN:
   * `{ hasEnglish: { update: isAdmin } }`. Khoá có giá trị `undefined` bị bỏ qua (không bao giờ biến deny-all thành
   * mở quyền); tên không phải trường dùng chung (hoặc đã `omit`) thì ném lỗi. Access cấp collection ghi đè qua `collection.access`.
   */
  fieldAccess?: Readonly<Record<string, FieldAccessOverrides>>;
  /** Trường thêm vào khối "Bản dịch tiếng Anh" ở cột phải (vd nút "Duyệt bản tiếng Anh" của Trang pháp lý), sau nút "Dịch lại bằng AI". */
  translationActions?: readonly Field[];
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

/**
 * Mỗi phần tử: tên trường dùng chung → các trường thật sinh ra (`slug` kèm `scopeSlug`, `hasEnglish`/`translation` tách riêng).
 * Thứ tự = thứ tự hiện ở cột phải của form sửa (BL-015 T06): trạng thái · ngày xuất bản · tác giả · nổi bật · slug · có bản EN.
 */
function buildSharedFields(options: ContentOptions): Array<[SharedFieldName, Field[]]> {
  const translation = translationFields();
  const part = (name: string) => translation.filter((field) => "name" in field && field.name === name);
  return [
    ["status", [statusField(options.statuses ?? CONTENT_STATUSES)]],
    ["publishedAt", [publishedAtField()]],
    ["author", [authorField()]],
    ["isFeatured", [isFeaturedField()]],
    ["slug", [slugField({ sourceField: options.slugSource, scopeField: options.scopeField }), ...(options.scopeField ? [scopeSlugField(options.scopeField)] : [])]],
    ["hasEnglish", part("hasEnglish")],
    ["translation", part("translation")],
    ["seo", [seoField()]],
  ];
}

function withFieldAccess(fields: Field[], override: FieldAccessOverrides): Field[] {
  const defined = Object.fromEntries(Object.entries(override).filter(([, access]) => access !== undefined));
  return fields.map((field) =>
    "name" in field && field.name !== "scopeSlug"
      ? ({ ...field, access: { ...("access" in field ? field.access : {}), ...defined } } as Field)
      : field,
  );
}

/**
 * Khối "Nâng cao" thu gọn mặc định ở cột phải chứa `slug` (+ `scopeSlug`): đường dẫn tự sinh từ tiêu đề, người dùng văn phòng ít khi cần sửa (BL-042).
 * Collapsible KHÔNG tên nên đường dẫn dữ liệu không đổi; bọc SAU khi áp access (`withFieldAccess` chỉ map field cấp đầu).
 */
function advancedSidebarBlock(fields: Field[]): CollapsibleField {
  return { type: "collapsible", label: "Nâng cao", admin: { position: "sidebar", initCollapsed: true }, fields };
}

function resolveSharedFields(options: ContentOptions, collectionSlug: string): Field[] {
  const omitted = new Set<string>(options.omit ?? []);
  if (options.scopeField && omitted.has("slug")) {
    throw new Error(`Collection "${collectionSlug}": scopeField cần trường slug, không thể omit "slug".`);
  }
  const overrides = options.fieldAccess ?? {};
  const available = buildSharedFields(options).filter(([name]) => !omitted.has(name));
  const unknown = Object.keys(overrides).filter((name) => !available.some(([shared]) => shared === name));
  if (unknown.length > 0) {
    throw new Error(
      `Collection "${collectionSlug}": fieldAccess nhắm trường không phải trường dùng chung (hoặc đã omit): ${unknown.join(", ")}.`,
    );
  }
  const resolved = available.flatMap(([name, fields]): Field[] => {
    const withAccess = overrides[name] ? withFieldAccess(fields, overrides[name]) : fields;
    return name === "slug" ? [advancedSidebarBlock(withAccess)] : withAccess;
  });
  return gatherTranslationBlock(resolved, options.translationActions ?? []);
}

const isNamed = (field: Field, name: string) => "name" in field && field.name === name;

/**
 * Gom mọi thứ về bản dịch vào MỘT khối cột phải (A11, BL-051 GĐ2): công tắc "Có bản tiếng Anh" (chỉ đọc), nhóm dữ liệu `translation` (ẩn, chỉ giữ đường dẫn
 * dữ liệu), dòng tóm tắt + nút "Dịch lại bằng AI" và các nút riêng của collection. Collapsible KHÔNG tên nên `hasEnglish` / `translation.*` giữ nguyên đường dẫn.
 * Đứng đúng chỗ `hasEnglish` từng ở (sau "Nâng cao"); không còn tab "Bản dịch". Collection `omit` cả hai thì không có khối.
 */
function gatherTranslationBlock(resolved: Field[], actions: readonly Field[]): Field[] {
  const hasEnglish = resolved.find((field) => isNamed(field, "hasEnglish"));
  const translation = resolved.find((field) => isNamed(field, "translation"));
  if (!hasEnglish && !translation) return resolved;
  const block: CollapsibleField = {
    type: "collapsible",
    label: "Bản dịch tiếng Anh",
    admin: { position: "sidebar", initCollapsed: false },
    fields: [...(hasEnglish ? [hasEnglish] : []), ...(translation ? [translation, ...translationBlockFields(), ...actions] : [...actions])],
  };
  const anchor = resolved.findIndex((field) => field === hasEnglish || field === translation);
  const rest = resolved.filter((field) => field !== hasEnglish && field !== translation);
  return [...rest.slice(0, anchor), block, ...rest.slice(anchor)];
}

/**
 * Collection có bộ tab không tên ở cấp gốc (`formTabs`) thì nhóm `seo` (giữ nguyên tên, đường dẫn dữ liệu không đổi)
 * thành tab "SEO" nối vào bộ tab đó (khối bản dịch nằm ở cột phải, xem `gatherTranslationBlock`); các trường dùng chung còn lại (cột phải, `position: "sidebar"`) đứng sau bộ tab ở
 * cấp gốc, vì Payload chỉ đặt vào cột phải field `sidebar` ở cấp gốc. Không có bộ tab thì giữ cách cũ: nối vào cuối.
 */
function placeSharedFields(own: Field[], shared: Field[]): Field[] {
  const tabsIndex = own.findIndex((field) => field.type === "tabs");
  if (tabsIndex === -1) return [...own, ...shared];
  const seo = shared.find((field) => isNamed(field, "seo"));
  const tabs = own[tabsIndex] as TabsField;
  const sharedTabs = seo ? [{ label: "SEO", fields: [seo] }] : [];
  const withSharedTabs: TabsField = { ...tabs, tabs: [...tabs.tabs, ...sharedTabs] };
  const sidebar = shared.filter((field) => field !== seo);
  return [...own.slice(0, tabsIndex), withSharedTabs, ...own.slice(tabsIndex + 1), ...sidebar];
}

type CollectionViews = NonNullable<NonNullable<CollectionConfig["admin"]>["components"]>["views"];

/** Giữ view tuỳ biến của collection (nếu có); chỉ gắn view lịch sử khi collection chưa tự khai `edit.versions`. */
function withVersionHistoryView(views: CollectionViews): CollectionViews {
  // `edit` là union có nhánh `root` (thay cả màn) loại trừ `versions`; collection nội dung không dùng `root` nên ép về dạng khoá-chuỗi.
  const edit: Record<string, unknown> = { ...views?.edit };
  return { ...views, edit: { ...edit, versions: edit.versions ?? { Component: VERSION_HISTORY_VIEW } } } as CollectionViews;
}

/**
 * Bọc cấu hình collection nội dung bằng quy tắc dùng chung: các trường chung, access (PERMISSION §3.1, §4),
 * phiên bản, thùng rác + audit, chặn bật `hasEnglish` khi thiếu EN, làm mới cache vi/en, tự dịch VI → EN (nhận diện sửa tay EN + xếp job `translate-content`). Cấu hình riêng của
 * collection thắng mặc định (`access`, `versions`...); hook của collection chạy SAU hook dùng chung.
 */
export function withContentDefaults(collection: CollectionConfig, options: ContentOptions = {}): CollectionConfig {
  const slug = collection.slug as CollectionSlug;
  const omitsStatus = options.omit?.includes("status") ?? false;
  const omitsTranslation = options.omit?.includes("translation") ?? false;
  if (omitsStatus && !collection.access?.read) {
    throw new Error(`Collection "${slug}" bỏ trường status nên phải tự đặt access.read (mặc định lọc theo status).`);
  }
  const route = options.route === undefined ? (CONTENT_ROUTES as Record<string, ContentRoute | undefined>)[slug] : options.route;
  if (route === undefined) throw new Error(`Thiếu trang công khai (route) cho collection nội dung "${slug}".`);
  const publicStatuses = options.publicStatuses ?? PUBLIC_STATUSES.default;
  const hasSlug = !(options.omit?.includes("slug") ?? false);
  const revalidate = route ? createRevalidateContent({ route, publicStatuses, revalidate: options.revalidate }) : undefined;

  return {
    ...collection,
    trash: true,
    // Lọc theo trạng thái dịch (FR-ADM-18) cho mọi collection có nhóm `translation`.
    admin: {
      ...collection.admin,
      components: {
        ...collection.admin?.components,
        beforeListTable: [...(collection.admin?.components?.beforeListTable ?? []), ...(omitsTranslation ? [] : [TRANSLATION_FILTER_COMPONENT])],
        // Màn "Lịch sử chỉnh sửa" dễ đọc (BL-058); collection `versions: false` không có màn này nên không gắn.
        views: collection.versions === false ? collection.admin?.components?.views : withVersionHistoryView(collection.admin?.components?.views),
      },
    },
    // Job dịch đọc lại danh sách này để quyết định bật `hasEnglish` bằng đúng vị từ của hook `requireEnglishFields`.
    custom: { ...collection.custom, englishRequiredFields: options.englishRequiredFields ?? ["title", "slug"] },
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
      // REST đọc không có `?locale` (fallback tắt, BR-07) phải đọc theo ngôn ngữ mặc định, nếu không nhãn bộ lọc quan hệ trong admin trống.
      beforeOperation: [defaultReadLocale, ...(collection.hooks?.beforeOperation ?? [])],
      beforeValidate: [
        guardTrashedEdit,
        requireEnglishFields(options.englishRequiredFields ?? ["title", "slug"]),
        ...(collection.hooks?.beforeValidate ?? []),
      ],
      // Nhận diện sửa tay EN chạy TRƯỚC hook riêng của collection (nhìn thấy `data` nguyên vẹn do người dùng gửi).
      beforeChange: [detectManualEnglish, ...(collection.hooks?.beforeChange ?? [])],
      afterChange: [
        auditContentTrash,
        ...(revalidate ? [revalidate.afterChange] : []),
        ...(route && hasSlug ? [createSlugRedirect({ route, publicStatuses })] : []),
        // Chỉ collection trong allowlist dịch (`allowlist.ts`) mới được xếp job; hook tự bỏ qua collection khác.
        enqueueTranslation.collectionAfterChange,
        ...(collection.hooks?.afterChange ?? []),
      ],
      afterDelete: [auditContentPurge, ...(revalidate ? [revalidate.afterDelete] : []), ...(collection.hooks?.afterDelete ?? [])],
    },
    fields: placeSharedFields(collection.fields, resolveSharedFields(options, collection.slug)),
  };
}
