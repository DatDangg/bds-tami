import { createHash } from "node:crypto";

import type { Field } from "payload";

import { isLexicalRoot } from "./lexical";

/**
 * Trường được phép gửi đi dịch, theo TÊN TRƯỜNG CẤP CAO NHẤT của từng collection/global (danh sách cho phép, không phải danh sách chặn:
 * trường localized mới thêm sau này mặc định KHÔNG bị gửi cho đến khi có người đưa vào đây; test `translatable-fields.test.ts` buộc hai
 * phía khớp với cấu hình thật). Trong mỗi trường, chỉ chữ (`text`/`textarea`/`richText`) ở vị trí localized mới được lấy (xem `collectLeaves`);
 * `slug` được sinh riêng từ tiêu đề EN, không dịch trực tiếp. Không có `leads`, `job-applications`... vì đã bị `allowlist.ts` chặn.
 */
export const TRANSLATABLE_FIELDS = {
  projects: ["title", "summary", "overview", "legalInfo", "salesPolicy", "scale", "amenities", "floorPlans", "seo"],
  rentals: ["title", "description", "legalNote", "seo"],
  "property-posts": ["title", "excerpt", "content", "priceNote", "offer", "seo"],
  news: ["title", "excerpt", "content", "seo"],
  services: ["title", "summary", "content", "seo"],
  "job-postings": ["title", "salaryText", "description", "requirements", "benefits", "seo"],
  pages: ["title", "content", "seo"],
  categories: ["name", "description", "seo"],
  developers: ["name", "description"],
  "site-settings": ["siteName", "address"],
  homepage: ["announcementBar", "hero", "heroSearch", "about", "featuredProjects", "services", "featuredOffers", "partners", "ctaBanner", "rentals", "news", "seo"],
  header: ["navItems", "ctaButton"],
  footer: ["columns", "contactBlock", "copyright"],
} as const satisfies Record<string, readonly string[]>;

export type TranslatableSlug = keyof typeof TRANSLATABLE_FIELDS;

/** Trường chữ localized KHÔNG dịch dù nằm trong nhóm được phép: định danh/URL/chuỗi tìm kiếm sinh bởi hệ thống. */
const NEVER_TRANSLATE_LEAF_NAMES = new Set(["slug", "scopeSlug", "searchText", "canonical"]);

/** Một bước trong đường dẫn: tên trường, hoặc hàng của array/blocks (tìm lại theo `id` để hai ngôn ngữ khớp dù khác thứ tự). */
export type PathStep = string | { rowId: string | number | undefined; index: number };

export interface TranslatableLeaf {
  /** Khoá ổn định (dùng `id` hàng, không dùng chỉ số) để so `sourceHash` giữa các lần lưu, vd `navItems.abc123.label`. */
  key: string;
  path: PathStep[];
  kind: "text" | "richText";
  value: string | Record<string, unknown>;
}

type Doc = Record<string, unknown>;
const isRecord = (value: unknown): value is Doc => typeof value === "object" && value !== null && !Array.isArray(value);

interface WalkState {
  inheritedLocalized: boolean;
  path: PathStep[];
  keyParts: string[];
}

function emitLeaf(field: Field & { name: string }, value: unknown, state: WalkState, out: TranslatableLeaf[]): void {
  const localized = state.inheritedLocalized || ("localized" in field && field.localized === true);
  if (!localized || NEVER_TRANSLATE_LEAF_NAMES.has(field.name)) return;
  const path = [...state.path, field.name];
  const key = [...state.keyParts, field.name].join(".");
  if ((field.type === "text" || field.type === "textarea") && typeof value === "string") {
    out.push({ key, path, kind: "text", value });
  } else if (field.type === "richText" && isLexicalRoot(value)) {
    out.push({ key, path, kind: "richText", value });
  }
}

function walkRows(rows: unknown, fieldsOf: (row: Doc) => Field[], state: WalkState, name: string, out: TranslatableLeaf[]): void {
  if (!Array.isArray(rows)) return;
  rows.forEach((row, index) => {
    if (!isRecord(row)) return;
    const rowId = typeof row.id === "string" || typeof row.id === "number" ? row.id : undefined;
    walkFields(fieldsOf(row), row, { ...state, path: [...state.path, name, { rowId, index }], keyParts: [...state.keyParts, name, String(rowId ?? index)] }, out);
  });
}

function walkNamedField(field: Field & { name: string }, data: Doc, state: WalkState, out: TranslatableLeaf[]): void {
  const value = data[field.name];
  if (field.type === "group") {
    if (!isRecord(value)) return;
    const inheritedLocalized = state.inheritedLocalized || field.localized === true;
    walkFields(field.fields, value, { inheritedLocalized, path: [...state.path, field.name], keyParts: [...state.keyParts, field.name] }, out);
  } else if (field.type === "array") {
    walkRows(value, () => field.fields, state, field.name, out);
  } else if (field.type === "blocks") {
    walkRows(value, (row) => field.blocks.find((block) => block.slug === row.blockType)?.fields ?? [], state, field.name, out);
  } else {
    emitLeaf(field, value, state, out);
  }
}

function walkFields(fields: readonly Field[], data: Doc, state: WalkState, out: TranslatableLeaf[], allowedTopLevel?: readonly string[]): void {
  for (const field of fields) {
    if ("name" in field && typeof field.name === "string") {
      if (allowedTopLevel && !allowedTopLevel.includes(field.name)) continue;
      walkNamedField(field as Field & { name: string }, data, state, out);
    } else if (field.type === "row" || field.type === "collapsible") {
      walkFields(field.fields, data, state, out, allowedTopLevel);
    } else if (field.type === "tabs") {
      for (const tab of field.tabs) {
        // Tab có tên = một nhóm; tab không tên chỉ là vỏ giao diện.
        if ("name" in tab && typeof tab.name === "string") {
          walkNamedField({ type: "group", name: tab.name, fields: tab.fields, localized: tab.localized } as Field & { name: string }, data, state, out);
        } else {
          walkFields(tab.fields, data, state, out, allowedTopLevel);
        }
      }
    }
  }
}

/**
 * Lấy mọi trường chữ localized (đã nằm trong danh sách cho phép của `slug`) từ MỘT bản ghi đọc theo một ngôn ngữ duy nhất.
 * Chỉ `text`/`textarea`/`richText`; số, ngày, quan hệ, upload, select, URL không bao giờ vào đây. Dùng cấu hình field thật nên
 * lồng nhau (group localized, array, blocks) đều được xử lý.
 */
export function collectLeaves(slug: TranslatableSlug, fields: readonly Field[], doc: Doc | null | undefined): TranslatableLeaf[] {
  const out: TranslatableLeaf[] = [];
  if (!doc) return out;
  walkFields(fields, doc, { inheritedLocalized: false, path: [], keyParts: [] }, out, TRANSLATABLE_FIELDS[slug]);
  return out;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** SHA-256 của nội dung nguồn một trường; khoá object được sắp để thứ tự khoá khác nhau giữa các lần đọc DB không làm đổi hash. */
export function hashLeafValue(value: TranslatableLeaf["value"]): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export type SourceHashes = Record<string, string>;

export function hashLeaves(leaves: readonly TranslatableLeaf[]): SourceHashes {
  return Object.fromEntries(leaves.map((leaf) => [leaf.key, hashLeafValue(leaf.value)]));
}

/** `translation.sourceHash` (json) đọc lại từ DB: chỉ nhận object phẳng chuỗi → chuỗi, còn lại coi như chưa có. */
export function parseStoredHashes(raw: unknown): SourceHashes {
  if (!isRecord(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/** Có trường nào có hash khác (hoặc mới) so với bản đã lưu không. Trường bị xoá khỏi nguồn không tính (không có gì để dịch). */
export function hasSourceChanged(stored: SourceHashes, current: SourceHashes): boolean {
  return Object.entries(current).some(([key, hash]) => stored[key] !== hash);
}

function stepInto(container: unknown, step: PathStep): unknown {
  if (typeof step === "string") return isRecord(container) ? container[step] : undefined;
  if (!Array.isArray(container)) return undefined;
  // Hàng có `id` chỉ khớp theo id: id không còn (hàng đã xoá) thì KHÔNG đoán theo chỉ số, kẻo ghi bản dịch vào hàng khác.
  if (step.rowId !== undefined) return container.find((row) => isRecord(row) && row.id === step.rowId);
  return container[step.index];
}

/** Giá trị hiện có tại `path` của một bản ghi (dùng để biết bản `en` đã có chữ chưa). */
export function readAtPath(doc: unknown, path: readonly PathStep[]): unknown {
  return path.reduce<unknown>((current, step) => stepInto(current, step), doc);
}

function cloneJson<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/** Ghi `value` vào bản sao `target` theo `path`; thiếu group trung gian thì tạo `{}`; thiếu hàng (khác id) thì bỏ qua. Trả `false` nếu không ghi được. */
function writeAtPath(target: Doc, path: readonly PathStep[], value: unknown): boolean {
  let current: unknown = target;
  for (const step of path.slice(0, -1)) {
    let next = stepInto(current, step);
    if (next === undefined && typeof step === "string" && isRecord(current)) {
      next = {};
      current[step] = next;
    }
    if (next === undefined) return false;
    current = next;
  }
  const last = path[path.length - 1];
  if (typeof last !== "string" || !isRecord(current)) return false;
  current[last] = value;
  return true;
}

/**
 * Dựng dữ liệu ghi cho bản `en`: với mỗi trường cấp cao có chữ vừa dịch, lấy NGUYÊN giá trị `en` đang lưu (đọc locale `en`, không fallback) rồi
 * đặt bản dịch vào đúng vị trí. Cách này giữ phần không dịch (link, ảnh, quan hệ, `id` hàng) y như form admin gửi khi sửa bản `en`.
 * Trả `null` khi một bản dịch không có chỗ ghi (hàng bị xoá giữa chừng): bên gọi bỏ lần này, không ghi dở.
 */
export function buildEnglishWrite(
  englishDoc: Doc,
  translated: ReadonlyArray<{ leaf: TranslatableLeaf; value: unknown }>,
): Doc | null {
  const data: Doc = {};
  for (const { leaf } of translated) {
    const top = leaf.path[0] as string;
    if (!(top in data)) data[top] = cloneJson(englishDoc[top]) ?? (leaf.path.length > 1 ? {} : undefined);
  }
  for (const { leaf, value } of translated) {
    if (!writeAtPath(data, leaf.path, value)) return null;
  }
  return data;
}
