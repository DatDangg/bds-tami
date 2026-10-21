import type { CollectionConfig, Field } from "payload";

/** Kiểu trường nội dung dài/cấu trúc/ảo: không có giá trị làm cột hay điều kiện lọc trong danh sách admin. */
const HIDDEN_FROM_COLUMNS_AND_FILTERS = new Set<string>(["richText", "textarea", "point", "json", "array", "blocks", "join"]);
/** Tệp: cột (ảnh bìa/thư viện) vẫn hữu ích, chỉ bỏ khỏi "Thêm bộ lọc". */
const HIDDEN_FROM_FILTERS_ONLY = new Set<string>(["upload"]);

/**
 * Trường dùng chung của `withContentDefaults` / trường kỹ thuật không có giá trị nghiệp vụ trong danh sách: SEO, nhóm bản dịch
 * (đã có ô "Trạng thái dịch" riêng), slug, `hasEnglish`, chỉ mục tìm kiếm, cờ job dựng lại chỉ mục.
 */
const SHARED_HIDDEN_PATHS = ["seo", "translation", "slug", "scopeSlug", "hasEnglish", "searchText", "searchReindexPending"] as const;

/**
 * Trường nền của collection upload mà Payload tự thêm lúc sanitize (chỉ `admin.hidden`, vẫn hiện trong "Hiển thị cột"; nhóm `sizes` xử lý ở `imageSizes[].admin` của Media vì plugin S3 dựng lại nhóm này). Khai lại đúng tên + kiểu
 * để `mergeBaseFields` gộp cờ ẩn vào trường nền (cùng tên/kiểu nên không đổi schema). Giữ `filename`, `mimeType` (cột mặc định).
 */
const UPLOAD_BASE_STUBS: readonly Field[] = [
  { name: "url", type: "text" },
  { name: "thumbnailURL", type: "text" },
  { name: "filesize", type: "number" },
  { name: "width", type: "number" },
  { name: "height", type: "number" },
];

interface Hidden {
  column: boolean;
  filter: boolean;
}

/** Trường kỹ thuật theo tên: băm (`ipHash`) và bản chuẩn hoá máy đọc (`phoneNormalized`). */
const TECHNICAL_FIELD_NAME = /(?:Hash|Normalized)$/;

const withAdminFlags = (field: Field, hidden: Hidden): Field => {
  if (!hidden.column && !hidden.filter) return field;
  const admin = { ...("admin" in field ? field.admin : undefined), ...(hidden.column && { disableListColumn: true }), ...(hidden.filter && { disableListFilter: true }) };
  return { ...field, admin } as Field;
};

/** `ui` chỉ giữ cột khi có `Cell` tự vẽ (nút/ô thao tác); không Cell = trường thao tác, không có giá trị để hiện. */
const uiHasCell = (field: Field): boolean => field.type === "ui" && Boolean(field.admin?.components?.Cell);

function uploadBaseStubs(collection: CollectionConfig, fields: Field[]): Field[] {
  if (!collection.upload) return [];
  const declared = new Set(fields.flatMap((field) => ("name" in field && field.name ? [field.name] : [])));
  return UPLOAD_BASE_STUBS.filter((stub) => "name" in stub && !declared.has(stub.name)).map((stub) => withAdminFlags(stub, { column: true, filter: true }));
}

/**
 * Chỉ để lại trường nghiệp vụ trong "Hiển thị cột" + "Thêm bộ lọc" của danh sách admin (BL-021 #06, BL-039). `disableListFilter` /
 * `disableListColumn` chỉ ẩn khỏi menu chọn: form sửa, truy vấn `where` (ô "Trạng thái dịch", xuất Excel) và `defaultColumns` KHÔNG đổi.
 * Payload kiểm cờ ở từng trường lá (không kế thừa từ group), nên hàm duyệt xuống tận lá.
 * - Ẩn cột + lọc: `admin.hidden` (Payload vẫn liệt kê trường này trong "Hiển thị cột"), tên kết thúc `Hash`/`Normalized`, kiểu `HIDDEN_FROM_COLUMNS_AND_FILTERS`, `ui` không Cell, nhóm/đường dẫn trong `SHARED_HIDDEN_PATHS` và `hiddenColumnPaths`
 *   (nhóm: ẩn cả cây; trường lồng: `group.field`).
 * - `defaultColumns` + `useAsTitle` không bao giờ bị ẩn cột (chỉ ẩn lọc nếu thuộc diện ẩn).
 * - Chỉ ẩn lọc: `upload`, đường dẫn trong `hiddenPaths` (trường nghiệp vụ vẫn chọn làm cột được).
 * Không thể ẩn `id`/`deletedAt` bằng config mà không khai thêm trường vào schema (xem task BL-039 T01 mục D3).
 */
export function hideTechnicalListFields(collection: CollectionConfig, hiddenPaths: readonly string[] = [], hiddenColumnPaths: readonly string[] = []): CollectionConfig {
  const bothHidden = new Set<string>([...SHARED_HIDDEN_PATHS, ...hiddenColumnPaths]);
  const filterHidden = new Set<string>(hiddenPaths);
  // Cột mặc định / tiêu đề luôn hiện được dù kiểu trường (vd `textarea` làm cột nội dung) nằm trong quy tắc ẩn.
  const keptColumns = new Set<string>([...(collection.admin?.defaultColumns ?? []), ...(collection.admin?.useAsTitle ? [collection.admin.useAsTitle] : [])]);
  const visit = (fields: Field[], prefix: string, inherited: Hidden): Field[] =>
    fields.map((field): Field => {
      if (field.type === "row" || field.type === "collapsible") return { ...field, fields: visit(field.fields, prefix, inherited) } as Field;
      if (field.type === "tabs") {
        return { ...field, tabs: field.tabs.map((tab) => ({ ...tab, fields: visit(tab.fields, "name" in tab && tab.name ? `${prefix}${tab.name}.` : prefix, inherited) })) } as Field;
      }
      const path = "name" in field && field.name ? `${prefix}${field.name}` : undefined;
      const both =
        inherited.column ||
        HIDDEN_FROM_COLUMNS_AND_FILTERS.has(field.type) ||
        (field.type === "ui" && !uiHasCell(field)) ||
        ("admin" in field && (field.admin as { hidden?: boolean } | undefined)?.hidden === true) ||
        ("name" in field && typeof field.name === "string" && TECHNICAL_FIELD_NAME.test(field.name)) ||
        (path !== undefined && bothHidden.has(path));
      const filterOnly = inherited.filter || HIDDEN_FROM_FILTERS_ONLY.has(field.type) || field.type === "ui" || (path !== undefined && filterHidden.has(path));
      const keepColumn = path !== undefined && keptColumns.has(path);
      const hidden: Hidden = { column: both && !keepColumn, filter: both || filterOnly };
      if (field.type === "group") return { ...field, fields: visit(field.fields, path ? `${path}.` : prefix, hidden) } as Field;
      return withAdminFlags(field, hidden);
    });
  const fields = visit(collection.fields, "", { column: false, filter: false });
  return { ...collection, fields: [...fields, ...uploadBaseStubs(collection, fields)] };
}
