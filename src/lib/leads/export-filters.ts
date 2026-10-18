import type { Where } from "payload";

import { isUuid } from "../uuid";
import { LEAD_SOURCES, LEAD_STATUSES, type LeadSource, type LeadStatus } from "./lead-values";

/** Bộ lọc xuất lead (API_SPEC §4): trạng thái, nguồn, sale phụ trách, khoảng thời điểm tạo (đúng giá trị `>=`/`<=` của danh sách). */
export interface LeadExportFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  /** ISO 8601 có múi giờ (vd `2026-10-01T12:00:00.000Z`, giá trị DatePicker của Payload); chuẩn hoá về UTC. */
  createdFrom?: string;
  createdTo?: string;
}

export interface FilterIssue {
  path: string[];
  message: string;
}

export type ParsedLeadExportFilters = { ok: true; filters: LeadExportFilters } | { ok: false; issues: FilterIssue[] };

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
  for (const name of ["createdFrom", "createdTo"] as const) {
    const value = read(name);
    if (value === undefined) continue;
    const timestamp = normalizeTimestamp(value);
    if (timestamp) filters[name] = timestamp;
    else issues.push({ path: [name], message: "Thời điểm phải có dạng ISO 8601 kèm múi giờ, vd 2026-10-01T12:00:00.000Z" });
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
  if (filters.source) conditions.push({ source: { equals: filters.source } });
  if (filters.assignedTo) conditions.push({ assignedTo: { equals: filters.assignedTo } });
  if (filters.createdFrom) conditions.push({ createdAt: { greater_than_equal: filters.createdFrom } });
  if (filters.createdTo) conditions.push({ createdAt: { less_than_equal: filters.createdTo } });
  return conditions.length > 0 ? { and: conditions } : {};
}

type PlainRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is PlainRecord => typeof value === "object" && value !== null && !Array.isArray(value);

/** Kết quả chuyển where của danh sách: `ok: false` = có điều kiện không ánh xạ được (xuất sẽ ra nhiều lead hơn danh sách đang thấy). */
export type LeadExportQuery = { ok: true; query: string } | { ok: false; reason: string };

// Tên toán tử lấy đúng nhãn tiếng Việt Payload hiển thị trong bộ lọc (`@payloadcms/translations` vi: equals / isGreaterThanOrEqualTo / isLessThanOrEqualTo).
export const UNSUPPORTED_FILTER_MESSAGE =
  'Chỉ xuất được khi bộ lọc dùng: Trạng thái, Nguồn hoặc Sale phụ trách với "bằng"; Ngày tạo với "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng" (mỗi phía một lần). ' +
  'Không hỗ trợ ô tìm kiếm, nhiều nhóm điều kiện "hoặc" và các toán tử khác. Hãy đổi bộ lọc rồi xuất lại.';

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

/** Một điều kiện -> tham số query; `false` nếu field/toán tử không hỗ trợ hoặc trùng tham số đã có. */
function applyCondition(condition: PlainRecord, params: URLSearchParams): boolean {
  const { field, ...operators } = condition;
  const names = Object.keys(operators);
  if (typeof field !== "string" || names.length !== 1) return false;
  const [operator] = names as [string];
  const value = operators[operator];
  let name: string | undefined;
  let paramValue: string | undefined;
  if (EQUALS_FIELDS.has(field) && operator === "equals" && typeof value === "string") {
    name = field;
    paramValue = value;
  } else if (field === "createdAt" && (operator === "greater_than_equal" || operator === "less_than_equal")) {
    name = operator === "greater_than_equal" ? "createdFrom" : "createdTo";
    paramValue = typeof value === "string" ? value : undefined;
  }
  if (name === undefined || !paramValue || params.has(name)) return false;
  params.set(name, paramValue);
  return true;
}

/**
 * Bộ lọc đang áp trong danh sách lead của Payload (`where`) -> query string của endpoint xuất. Chỉ nhận điều kiện ánh xạ được
 * 1-1 (equals của trạng thái/nguồn/sale, >=/<= thời điểm tạo, giữ nguyên giá trị); điều kiện khác -> `ok: false` để nút chặn, không xuất lặng lẽ toàn
 * bộ lead (over-export PII). Phía server vẫn kiểm lại mọi giá trị.
 */
export function leadExportQueryFromWhere(where: unknown): LeadExportQuery {
  const conditions: PlainRecord[] = [];
  if (!collectConditions(where, conditions)) return { ok: false, reason: UNSUPPORTED_FILTER_MESSAGE };
  const params = new URLSearchParams();
  for (const condition of conditions) {
    if (!applyCondition(condition, params)) return { ok: false, reason: UNSUPPORTED_FILTER_MESSAGE };
  }
  return { ok: true, query: params.toString() };
}
