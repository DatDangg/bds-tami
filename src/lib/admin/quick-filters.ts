import type { Where } from "payload";

import { rebuildWhere, toBranches } from "@/lib/translation/admin-ui";

/** Một chip: bấm = ghi `conditions` (AND) vào từng nhánh của `where`. */
export interface QuickFilterChip {
  key: string;
  label: string;
  /** Mỗi phần tử là một điều kiện lá trên đúng một trường, vd `{ priceMonthlyVnd: { less_than: 10000000 } }`. */
  conditions: Where[];
  /** Trường chip này thay thế (mọi điều kiện lá trên các trường đó bị bỏ khi chọn); mặc định `group.fields`. */
  replaces?: string[];
}

export interface QuickFilterGroup {
  id: string;
  label: string;
  /** Trường mà mọi chip của nhóm luôn thay thế; bỏ chọn nhóm cũng bỏ điều kiện trên các trường này. */
  fields: string[];
  /** Có nhãn → nhóm hiện thêm nút `Tất cả` (= bỏ lọc nhóm). */
  allLabel?: string;
  chips: QuickFilterChip[];
}

const ARRAY_OPERATORS = new Set(["in", "not_in", "all"]);

/**
 * Chuẩn hoá một giá trị toán tử về dạng so sánh được: URL (qs) trả mọi số/boolean thành chuỗi ("10000000", "false") và mảng 1 phần tử
 * có thể thành chuỗi, còn chip ghi số/boolean thật → so bằng chuỗi; toán tử danh sách so không phụ thuộc thứ tự.
 */
function normalizeOperand(operator: string, value: unknown): string {
  if (ARRAY_OPERATORS.has(operator)) {
    const list = Array.isArray(value) ? value : typeof value === "object" && value !== null ? Object.values(value) : [value];
    return JSON.stringify(list.map(String).sort());
  }
  return JSON.stringify(String(value));
}

/** Khoá chuẩn của một điều kiện lá (`{ field: { op: value } }`); phần tử có `and`/`or` hay không phải object trả `undefined` (không phải lá). */
function leafSignature(entry: Where): string | undefined {
  if ("and" in entry || "or" in entry) return undefined;
  const parts = Object.entries(entry).map(([field, condition]) => {
    if (typeof condition !== "object" || condition === null) return `${field}:${JSON.stringify(String(condition))}`;
    const operators = Object.entries(condition as Record<string, unknown>)
      .map(([operator, value]) => `${operator}=${normalizeOperand(operator, value)}`)
      .sort();
    return `${field}:${operators.join(",")}`;
  });
  return parts.length ? parts.sort().join("|") : undefined;
}

const touchesAnyField = (entry: Where, fields: readonly string[]): boolean => leafSignature(entry) !== undefined && Object.keys(entry).some((field) => fields.includes(field));

const replacedFields = (group: QuickFilterGroup, chip?: QuickFilterChip): string[] => chip?.replaces ?? group.fields;

/** Mọi điều kiện lá của mọi chip trong nhóm: rời chip nào cũng bỏ đúng điều kiện đó kể cả trên trường phụ (vd Lead `assignedTo` chưa có). */
const groupConditionSignatures = (group: QuickFilterGroup): Set<string> =>
  new Set(group.chips.flatMap((chip) => chip.conditions.map(leafSignature)).filter((signature): signature is string => signature !== undefined));

/** Chip đang sáng: mọi nhánh có đúng (không thừa, không thiếu) các điều kiện lá trên trường chip thay thế = điều kiện của chip. `""` nếu không. */
export function currentChip(where: Where | undefined, group: QuickFilterGroup): string {
  const branches = toBranches(where);
  if (branches.length === 0) return "";
  const match = group.chips.find((chip) => {
    const fields = replacedFields(group, chip);
    const expected = chip.conditions.map(leafSignature).sort();
    return branches.every((entries) => {
      const present = entries.filter((entry) => touchesAnyField(entry, fields)).map(leafSignature).sort();
      return present.length === expected.length && present.every((signature, index) => signature === expected[index]);
    });
  });
  return match?.key ?? "";
}

/** Có nhánh nào đang chứa điều kiện lá trên trường của nhóm (bộ lọc tay hay chip) — `Tất cả` chỉ sáng khi không có. */
export function hasGroupCondition(where: Where | undefined, group: QuickFilterGroup): boolean {
  return toBranches(where).some((entries) => entries.some((entry) => touchesAnyField(entry, group.fields)));
}

/**
 * `where` mới: trong từng nhánh giữ các điều kiện khác, bỏ điều kiện cũ của nhóm (mọi toán tử trên trường chip thay thế + điều kiện chip của nhóm
 * trên trường phụ) rồi thêm điều kiện của chip `key` (`""` = chỉ bỏ). Dạng đầu vào/đầu ra như `withTranslationFilter`.
 */
export function withChip(where: Where | undefined, group: QuickFilterGroup, key: string): Where {
  const chip = group.chips.find((candidate) => candidate.key === key);
  const fields = replacedFields(group, chip);
  const groupSignatures = groupConditionSignatures(group);
  const branches = toBranches(where);
  const rebuilt = (branches.length ? branches : [[]]).map((entries) => {
    const others = entries.filter((entry) => {
      const signature = leafSignature(entry);
      return !(touchesAnyField(entry, fields) || (signature !== undefined && groupSignatures.has(signature)));
    });
    return chip ? [...others, ...chip.conditions] : others;
  });
  return rebuildWhere(where, rebuilt);
}

const cond = (field: string, operator: string, value: unknown): Where => ({ [field]: { [operator]: value } });

const MILLION = 1_000_000;

/** Chip danh sách Lead (BL-022): `Mới (chưa giao)` thay cả `status` lẫn `assignedTo`; chip khác chỉ thay `status` (giữ Sale phụ trách chọn tay). `spam` chỉ ở `Tất cả`. */
export const LEAD_QUICK_FILTER_GROUPS: QuickFilterGroup[] = [
  {
    id: "status",
    label: "Trạng thái",
    fields: ["status"],
    allLabel: "Tất cả",
    // Giá trị chuỗi "false" (không phải boolean): WhereBuilder của Payload đọc `value || undefined` nên giá trị falsy bị bỏ khi ghi lại where.
    chips: [
      { key: "new", label: "Mới (chưa giao)", replaces: ["status", "assignedTo"], conditions: [cond("status", "equals", "new"), cond("assignedTo", "exists", "false")] },
      { key: "consulting", label: "Đang tư vấn", conditions: [cond("status", "in", ["contacted", "consulting"])] },
      { key: "won", label: "Đã chốt", conditions: [cond("status", "equals", "won")] },
      { key: "lost", label: "Không thành", conditions: [cond("status", "equals", "lost")] },
    ],
  },
];

/** Chip danh sách Tin cho thuê (BL-022, bảng trong change doc §1). `hidden` chỉ thấy ở `Tất cả`; tin thiếu số PN / giá không lọt chip nào của nhóm đó. */
export const RENTAL_QUICK_FILTER_GROUPS: QuickFilterGroup[] = [
  {
    id: "status",
    label: "Trạng thái",
    fields: ["status"],
    allLabel: "Tất cả",
    chips: [
      { key: "published", label: "Đang cho thuê", conditions: [cond("status", "equals", "published")] },
      { key: "rented", label: "Đã thuê", conditions: [cond("status", "equals", "rented")] },
      { key: "draft", label: "Nháp", conditions: [cond("status", "equals", "draft")] },
    ],
  },
  {
    id: "bedrooms",
    label: "Số phòng ngủ",
    fields: ["bedrooms"],
    allLabel: "Tất cả",
    // "0" chuỗi (không phải số 0) cùng lý do: WhereBuilder bỏ giá trị falsy; Payload ép về số cho trường number.
    chips: [
      { key: "studio", label: "Studio", conditions: [cond("bedrooms", "equals", "0")] },
      { key: "1", label: "1 PN", conditions: [cond("bedrooms", "equals", 1)] },
      { key: "2", label: "2 PN", conditions: [cond("bedrooms", "equals", 2)] },
      { key: "3plus", label: "3 PN+", conditions: [cond("bedrooms", "greater_than_equal", 3)] },
    ],
  },
  {
    id: "price",
    label: "Khoảng giá",
    fields: ["priceMonthlyVnd"],
    chips: [
      { key: "lt10", label: "Dưới 10tr", conditions: [cond("priceMonthlyVnd", "less_than", 10 * MILLION)] },
      { key: "10to20", label: "10 – 20tr", conditions: [cond("priceMonthlyVnd", "greater_than_equal", 10 * MILLION), cond("priceMonthlyVnd", "less_than", 20 * MILLION)] },
      { key: "20to50", label: "20 – 50tr", conditions: [cond("priceMonthlyVnd", "greater_than_equal", 20 * MILLION), cond("priceMonthlyVnd", "less_than_equal", 50 * MILLION)] },
      { key: "gt50", label: "Trên 50tr", conditions: [cond("priceMonthlyVnd", "greater_than", 50 * MILLION)] },
    ],
  },
];
