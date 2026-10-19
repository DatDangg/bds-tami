import type { SanitizedCollectionConfig, Where } from "payload";
import { mergeListSearchAndWhere } from "payload/shared";

import { isUuid } from "../uuid";
import { LEAD_LIST_SEARCHABLE_FIELDS, LEAD_SOURCES, LEAD_STATUSES, type LeadSource, type LeadStatus } from "./lead-values";

/** Bộ lọc xuất lead (API_SPEC §4): trạng thái, nguồn, sale phụ trách, khoảng thời điểm tạo (đúng giá trị `>=`/`<=` của danh sách). */
export interface LeadExportFilters {
  status?: LeadStatus;
  /** Chip `Đang tư vấn` (BL-022): trạng thái nằm trong danh sách (đã khử trùng). Không đi kèm `status`. */
  statusIn?: LeadStatus[];
  source?: LeadSource;
  assignedTo?: string;
  /** Chip `Mới (chưa giao)`: chỉ lead chưa có sale phụ trách. Không đi kèm `assignedTo`. */
  unassigned?: true;
  /** ISO 8601 có múi giờ (vd `2026-10-01T12:00:00.000Z`, giá trị DatePicker của Payload); chuẩn hoá về UTC. */
  createdFrom?: string;
  createdTo?: string;
  /** Từ khoá ô tìm kiếm của danh sách, nguyên văn (không trim), ≤ `MAX_SEARCH_LENGTH`). Server tự dựng điều kiện tìm, không nhận where thô. */
  search?: string;
}

export interface FilterIssue {
  path: string[];
  message: string;
}

export type ParsedLeadExportFilters = { ok: true; filters: LeadExportFilters } | { ok: false; issues: FilterIssue[] };

export const MAX_SEARCH_LENGTH = 100;
export const SEARCH_TOO_LONG_MESSAGE = `Từ khoá tìm kiếm tối đa ${MAX_SEARCH_LENGTH} ký tự`;
const MAX_TIMESTAMP_LENGTH = 40;
// Bắt buộc có múi giờ: không có thì `Date.parse` hiểu theo giờ máy chủ, lệch so với danh sách.
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Ngày lịch có thật (loại 2026-02-30: `Date.parse` tự cuộn sang tháng sau nên so lại từng phần). */
function isRealCalendarDay(day: string): boolean {
  const [year, month, date] = day.split("-").map(Number) as [number, number, number];
  const check = new Date(Date.UTC(year, month - 1, date));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === date;
}

/** Mốc thời gian ISO hợp lệ -> chuỗi ISO UTC; không hợp lệ -> `undefined`. */
function normalizeTimestamp(value: string): string | undefined {
  if (value.length > MAX_TIMESTAMP_LENGTH || !TIMESTAMP_PATTERN.test(value)) return undefined;
  const time = Date.parse(value);
  if (Number.isNaN(time) || !isRealCalendarDay(value.slice(0, 10))) return undefined;
  return new Date(time).toISOString();
}

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T => (values as readonly string[]).includes(value);

const MAX_STATUS_IN_VALUES = LEAD_STATUSES.length;

/** `statusIn=a,b`: mỗi phần tử thuộc danh sách (không rỗng), tối đa số trạng thái; trùng thì gộp. Sai -> `undefined`. */
function parseStatusList(raw: string): LeadStatus[] | undefined {
  const items = raw.split(",").map((item) => item.trim());
  if (items.length > MAX_STATUS_IN_VALUES || !items.every((item): item is LeadStatus => isOneOf(LEAD_STATUSES, item))) return undefined;
  return [...new Set(items)];
}

/** Chỉ nhận giá trị trong danh sách/định dạng đã biết; tham số rỗng coi như không lọc. Không bao giờ ghép chuỗi người dùng vào truy vấn. */
export function parseLeadExportFilters(params: URLSearchParams): ParsedLeadExportFilters {
  const issues: FilterIssue[] = [];
  const filters: LeadExportFilters = {};
  const read = (name: string) => params.get(name)?.trim() || undefined;

  const status = read("status");
  if (status !== undefined) {
    if (isOneOf(LEAD_STATUSES, status)) filters.status = status;
    else issues.push({ path: ["status"], message: "Trạng thái không hợp lệ" });
  }
  const statusIn = read("statusIn");
  if (statusIn !== undefined) {
    const list = parseStatusList(statusIn);
    if (list === undefined) issues.push({ path: ["statusIn"], message: "Danh sách trạng thái không hợp lệ" });
    else if (status !== undefined) issues.push({ path: ["statusIn"], message: "Không dùng đồng thời status và statusIn" });
    else filters.statusIn = list;
  }
  const source = read("source");
  if (source !== undefined) {
    if (isOneOf(LEAD_SOURCES, source)) filters.source = source;
    else issues.push({ path: ["source"], message: "Nguồn không hợp lệ" });
  }
  const assignedTo = read("assignedTo");
  if (assignedTo !== undefined) {
    if (isUuid(assignedTo)) filters.assignedTo = assignedTo;
    else issues.push({ path: ["assignedTo"], message: "Mã nhân viên không hợp lệ" });
  }
  const unassigned = read("unassigned");
  if (unassigned !== undefined) {
    if (unassigned !== "1") issues.push({ path: ["unassigned"], message: "unassigned chỉ nhận giá trị 1" });
    else if (assignedTo !== undefined) issues.push({ path: ["unassigned"], message: "Không dùng đồng thời assignedTo và unassigned" });
    else filters.unassigned = true;
  }
  for (const name of ["createdFrom", "createdTo"] as const) {
    const value = read(name);
    if (value === undefined) continue;
    const timestamp = normalizeTimestamp(value);
    if (timestamp) filters[name] = timestamp;
    else issues.push({ path: [name], message: "Thời điểm phải có dạng ISO 8601 kèm múi giờ, vd 2026-10-01T12:00:00.000Z" });
  }
  // Không trim: danh sách Payload gửi từ khoá nguyên văn (chỉ drizzle tách theo U+0020), trim ở đây làm file xuất rộng hơn danh sách (vd chỉ có NBSP).
  const search = params.get("search") ?? "";
  if (search !== "") {
    if (search.length <= MAX_SEARCH_LENGTH) filters.search = search;
    else issues.push({ path: ["search"], message: SEARCH_TOO_LONG_MESSAGE });
  }
  // So theo thời điểm, không so chuỗi ISO: năm > 9999 chuẩn hoá thành `+010000-…` đứng trước `9999-…` theo ký tự.
  if (filters.createdFrom && filters.createdTo && Date.parse(filters.createdFrom) > Date.parse(filters.createdTo)) {
    issues.push({ path: ["createdFrom"], message: "Thời điểm bắt đầu phải trước hoặc bằng thời điểm kết thúc" });
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true, filters };
}

export function buildLeadExportWhere(filters: LeadExportFilters): Where {
  const conditions: Where[] = [];
  if (filters.status) conditions.push({ status: { equals: filters.status } });
  if (filters.statusIn) conditions.push({ status: { in: filters.statusIn } });
  if (filters.source) conditions.push({ source: { equals: filters.source } });
  if (filters.assignedTo) conditions.push({ assignedTo: { equals: filters.assignedTo } });
  if (filters.unassigned) conditions.push({ assignedTo: { exists: false } });
  if (filters.createdFrom) conditions.push({ createdAt: { greater_than_equal: filters.createdFrom } });
  if (filters.createdTo) conditions.push({ createdAt: { less_than_equal: filters.createdTo } });
  const where: Where = conditions.length > 0 ? { and: conditions } : {};
  if (!filters.search) return where;
  // Cùng hàm Payload dùng để ghép ô tìm kiếm + bộ lọc của danh sách; hook `expandPhoneSearch` tự mở rộng nhánh SĐT khi find/count.
  return mergeListSearchAndWhere({
    collectionConfig: { admin: { listSearchableFields: [...LEAD_LIST_SEARCHABLE_FIELDS] } } as unknown as SanitizedCollectionConfig,
    search: filters.search,
    where,
  });
}

type PlainRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is PlainRecord => typeof value === "object" && value !== null && !Array.isArray(value);

/** Kết quả chuyển where của danh sách: `ok: false` = có điều kiện không ánh xạ được (xuất sẽ ra nhiều lead hơn danh sách đang thấy). */
export type LeadExportQuery = { ok: true; query: string } | { ok: false; reason: string };

// Tên toán tử lấy đúng nhãn tiếng Việt Payload hiển thị trong bộ lọc (`@payloadcms/translations` vi: equals / isIn / exists / isGreaterThanOrEqualTo / isLessThanOrEqualTo).
export const UNSUPPORTED_FILTER_MESSAGE =
  'Chỉ xuất được khi bộ lọc dùng: Trạng thái, Nguồn hoặc Sale phụ trách với "bằng"; Trạng thái với "có trong" (các trạng thái của lead); Sale phụ trách với "tồn tại" = Sai (lead chưa giao); ' +
  'Ngày tạo với "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng" (mỗi phía một lần). ' +
  'Không hỗ trợ nhiều nhóm điều kiện "hoặc" và các toán tử khác. Hãy đổi bộ lọc rồi xuất lại.';

/**
 * Payload WhereBuilder luôn ghi `{ or: [ { and: [...] } ] }`; chấp nhận đúng 1 nhánh `or`, `and` lồng nhau, điều kiện đơn.
 * Trả `false` nếu gặp thứ không ánh xạ được (nhiều nhánh `or`, giá trị lạ) để người gọi chặn thay vì xuất toàn bộ.
 */
function collectConditions(where: unknown, into: PlainRecord[]): boolean {
  if (where === undefined || where === null) return true;
  if (!isRecord(where)) return false;
  for (const [key, value] of Object.entries(where)) {
    if (key === "or") {
      if (!Array.isArray(value) || value.length > 1) return false;
      if (value.length === 1 && !collectConditions(value[0], into)) return false;
    } else if (key === "and") {
      if (!Array.isArray(value)) return false;
      if (!value.every((child) => collectConditions(child, into))) return false;
    } else if (isRecord(value)) {
      into.push({ field: key, ...value });
    } else {
      return false;
    }
  }
  return true;
}

const EQUALS_FIELDS = new Set(["status", "source", "assignedTo"]);

/** `status in`: mảng, hoặc chuỗi `a,b` / 1 phần tử như qs đọc từ URL; mỗi giá trị thuộc `LEAD_STATUSES`, không rỗng, khử trùng. */
function statusListParam(value: unknown): string | undefined {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : undefined;
  // Payload không trim giá trị `in` (" won" ra danh sách rỗng) → có khoảng trắng thì khoá nút thay vì xuất `won`.
  if (items === undefined || !items.every((item): item is string => typeof item === "string" && item === item.trim())) return undefined;
  return parseStatusList(items.join(","))?.join(",");
}

/** `[tên tham số, giá trị]` của một điều kiện hỗ trợ; `undefined` nếu field/toán tử/giá trị không ánh xạ được 1-1. */
function conditionParam(field: string, operator: string, value: unknown): [string, string] | undefined {
  if (EQUALS_FIELDS.has(field) && operator === "equals" && typeof value === "string") return [field, value];
  if (field === "status" && operator === "in") {
    const list = statusListParam(value);
    return list ? ["statusIn", list] : undefined;
  }
  // Payload ghi boolean, đọc lại từ URL thành chuỗi "false"; `exists: true` không hỗ trợ.
  if (field === "assignedTo" && operator === "exists" && (value === false || value === "false")) return ["unassigned", "1"];
  if (field === "createdAt" && (operator === "greater_than_equal" || operator === "less_than_equal") && typeof value === "string") {
    return [operator === "greater_than_equal" ? "createdFrom" : "createdTo", value];
  }
  return undefined;
}

// Cặp tham số loại trừ nhau: server trả 400 khi gặp cả hai, nên client khoá nút thay vì gửi.
const CONFLICTING_PARAMS: Record<string, string> = { status: "statusIn", statusIn: "status", assignedTo: "unassigned", unassigned: "assignedTo" };

/** Một điều kiện -> tham số query; `false` nếu field/toán tử không hỗ trợ hoặc trùng/mâu thuẫn tham số đã có. */
function applyCondition(condition: PlainRecord, params: URLSearchParams): boolean {
  const { field, ...operators } = condition;
  const names = Object.keys(operators);
  if (typeof field !== "string" || names.length !== 1) return false;
  const [operator] = names as [string];
  const mapped = conditionParam(field, operator, operators[operator]);
  if (mapped === undefined) return false;
  const [name, paramValue] = mapped;
  if (!paramValue || params.has(name) || params.has(CONFLICTING_PARAMS[name] ?? "")) return false;
  params.set(name, paramValue);
  return true;
}

/**
 * Bộ lọc đang áp trong danh sách lead của Payload (`where`) + ô tìm kiếm (`search`, Payload giữ riêng khỏi `where`) -> query string của endpoint xuất. Chỉ nhận điều kiện ánh xạ được
 * 1-1 (equals của trạng thái/nguồn/sale, >=/<= thời điểm tạo, giữ nguyên giá trị); điều kiện khác -> `ok: false` để nút chặn, không xuất lặng lẽ toàn
 * bộ lead (over-export PII). Phía server vẫn kiểm lại mọi giá trị.
 */
export function leadExportQueryFromWhere(where: unknown, search?: string): LeadExportQuery {
  const conditions: PlainRecord[] = [];
  if (!collectConditions(where, conditions)) return { ok: false, reason: UNSUPPORTED_FILTER_MESSAGE };
  const params = new URLSearchParams();
  for (const condition of conditions) {
    if (!applyCondition(condition, params)) return { ok: false, reason: UNSUPPORTED_FILTER_MESSAGE };
  }
  // Nguyên văn như Payload gửi cho danh sách (không trim) để file xuất khớp đúng tập danh sách.
  if (search) {
    if (search.length > MAX_SEARCH_LENGTH) return { ok: false, reason: SEARCH_TOO_LONG_MESSAGE };
    params.set("search", search);
  }
  return { ok: true, query: params.toString() };
}
