import { DIRECTION_ADMIN_LABELS, PROPERTY_TYPE_ADMIN_LABELS, type Direction, type PropertyType } from "../../shared/listing-options";
import { PRODUCT_TYPE_KEYWORDS } from "./projects";
import { findPhrase, normalizeText, parseViNumber, snippetAround } from "./text";
import type { Confidence, FilledValue, ReviewNote } from "./types";

/**
 * Phần trích từng trường của backfill Tin BĐS (BL-052 P3-T05, tách khỏi `property-posts.ts`): regex + quy tắc gộp nhiều nguồn cho loại hình, diện tích,
 * phòng ngủ / tắm, hướng nhà, mặt tiền, số tầng, địa chỉ. Thuần (chỉ chữ vào → kế hoạch một trường ra), không đọc/ghi DB.
 */

export interface TextSource {
  label: string;
  text: string;
  confidence: Confidence;
}

interface Hit<T> {
  value: T;
  source: TextSource;
  index: number;
  length: number;
}

export interface FieldPlan {
  value?: unknown;
  filled: FilledValue[];
  review: ReviewNote[];
}

export const NONE: FieldPlan = { filled: [], review: [] };

const NUM = String.raw`\d+(?:[.,]\d+)*`;
/** Khoảng trắng KHÔNG gồm xuống dòng: mục "Phòng ngủ: 2⏎Phòng tắm: 1" của nội dung không được đọc thành "2 phòng tắm". */
const H = String.raw`[^\S\n]*`;
const START = String.raw`(?<![\p{L}\p{N}])`;
const NUM_START = String.raw`(?<![\p{L}\p{N}.,])`;
const END = String.raw`(?![\p{L}\p{N}])`;
const re = (source: string) => new RegExp(source, "gu");

const MAX_AREA = 100_000;
const MAX_ROOMS = 50;
const MAX_FRONTAGE = 100;
/** Nhà phố / biệt thự hiếm quá 10 tầng; số lớn hơn thường là số tầng của toà nhà → chỉ ghi gợi ý. */
const MAX_FLOORS_FILL = 10;
const MAX_ADDRESS = 200;
/** Loại hình mà "N tầng" là chiều cao toà nhà, không phải số tầng của căn → không trích `floors`. */
export const NO_FLOORS_TYPES: ReadonlySet<string> = new Set<PropertyType>(["apartment", "condotel", "office"]);

/** Mọi lần khớp của `regex` (cờ `gu`, chạy trên chữ đã chuẩn hoá) trong mọi nguồn; `read` trả `null` = bỏ qua lần khớp đó. */
function collect<T>(sources: readonly TextSource[], regex: RegExp, read: (match: RegExpExecArray) => T | null): Hit<T>[] {
  const hits: Hit<T>[] = [];
  for (const source of sources) {
    for (const match of normalizeText(source.text).matchAll(regex)) {
      const value = read(match);
      if (value !== null) hits.push({ value, source, index: match.index, length: match[0].length });
    }
  }
  return hits;
}

const snippetOf = (hit: Hit<unknown>) => snippetAround(hit.source.text, hit.index, hit.length);

/** Một giá trị duy nhất qua mọi nguồn → điền (nguồn tốt nhất = lần khớp đầu, tiêu đề trước); nhiều giá trị khác nhau → cần soát. */
function uniqueValue<T extends string | number>(field: string, hits: readonly Hit<T>[], format: (value: T) => string): FieldPlan {
  const [first] = hits;
  if (!first) return NONE;
  const distinct = [...new Set(hits.map((h) => h.value))];
  if (distinct.length > 1) {
    return { filled: [], review: [{ field, note: `Nhiều giá trị khác nhau (${distinct.map(format).join(" · ")}) — chưa điền`, snippet: snippetOf(first) }] };
  }
  const filled: FilledValue = { field, value: format(first.value), source: first.source.label, snippet: snippetOf(first), confidence: first.source.confidence };
  return { value: first.value, filled: [filled], review: [] };
}

const inRange = (value: number | null, max: number): value is number => value !== null && value > 0 && value <= max;
const readNumber = (max: number) => (match: RegExpExecArray) => {
  const value = parseViNumber(match[1] ?? "");
  return inRange(value, max) ? value : null;
};

// ── Diện tích: "85m2", "85 m²", "85 mét vuông", "dt 85m", "Diện tích: 38m²". Chỉ có khoảng "75 – 120m²" → cần soát ──
const AREA_RE = re(`${NUM_START}(${NUM})${H}(?:(?:-|–|—|~|đến)${H}(${NUM})${H})?(?:m²|m2|mét vuông)${END}`);
const AREA_DT_RE = re(`${START}(?:dt|diện tích)(?:${H}(?:đất|sàn|sử dụng|xây dựng|dự kiến))?${H}:?${H}(?:khoảng${H})?(${NUM})${H}m(?![\\p{L}\\p{N}²])`);

type Range = { from: number; to: number };

function readArea(match: RegExpExecArray): number | Range | null {
  const a = parseViNumber(match[1] ?? "");
  const b = match[2] ? parseViNumber(match[2]) : null;
  if (b === null) return inRange(a, MAX_AREA) ? a : null;
  if (!inRange(b, MAX_AREA)) return null;
  // "tầng 3 - 85m2": số đầu quá nhỏ so với số sau → không phải khoảng diện tích, lấy số sau.
  return inRange(a, MAX_AREA) && a < b && a * 20 >= b ? { from: a, to: b } : b;
}

/** Khoảng "75 – 120m²" tính là một giá trị riêng: đi cùng số cụ thể khác → mơ hồ; chỉ có khoảng → cần soát. */
function planArea(sources: readonly TextSource[]): FieldPlan {
  const hits = [...collect(sources, AREA_RE, readArea), ...collect(sources, AREA_DT_RE, readNumber(MAX_AREA))];
  const keyed = hits.map((h) => ({ ...h, value: typeof h.value === "number" ? String(h.value) : `${h.value.from}–${h.value.to}` }));
  const result = uniqueValue("areaM2", keyed, (v) => `${v} m²`);
  const range = hits.find((h): h is Hit<Range> => typeof h.value === "object");
  if (result.value === undefined) return result;
  if (range) return { filled: [], review: [{ field: "areaM2", note: `Chỉ có khoảng diện tích ${range.value.from}–${range.value.to} m² — chưa điền`, snippet: snippetOf(range) }] };
  return { ...result, value: Number(result.value) };
}

// ── Phòng ngủ / phòng tắm: "3PN", "3 phòng ngủ", "3 ngủ", "Phòng ngủ: 3"; "2WC", "2 phòng tắm/vệ sinh", "Phòng tắm: 2" ──
const roomRegexes = (nouns: string, labels: string) => [re(`${NUM_START}(\\d{1,2})${H}(?:${nouns})(?![\\p{L}])`), re(`${START}(?:${labels})${H}:${H}(\\d{1,2})${END}`)];
const BEDROOM_RES = roomRegexes("pn|phòng ngủ|ngủ", "số phòng ngủ|phòng ngủ");
const BATHROOM_RES = roomRegexes("wc|toilet|phòng tắm|phòng vệ sinh|nhà vệ sinh|vệ sinh", "số phòng tắm|phòng tắm|phòng vệ sinh|nhà vệ sinh|wc|toilet");

const planRooms = (field: string, regexes: readonly RegExp[]) => (sources: readonly TextSource[]) =>
  uniqueValue(field, regexes.flatMap((regex) => collect(sources, regex, readNumber(MAX_ROOMS))), String);

// ── Hướng nhà: "hướng Đông Nam", "Hướng: Tây Bắc", "hướng nhà/cửa …", "cửa hướng …", "chính Nam"; loại "Tây tứ trạch", "ban công hướng …" ──
const DIRECTION_WORDS: Record<string, Direction> = { "đông nam": "SE", "đông bắc": "NE", "tây nam": "SW", "tây bắc": "NW", đông: "E", tây: "W", nam: "S", bắc: "N" };
const DIR = Object.keys(DIRECTION_WORDS).join("|");
const NOT_TU_TRACH = String.raw`(?!\s*-?\s*tứ\s*trạch)`;
/** Địa danh bắt đầu bằng chữ chỉ hướng ("Nam Từ Liêm", "Tây Hồ", "Bắc Ninh", "Đông Anh", "Đông Nam Bộ"…): "hướng Bắc Ninh" là chỉ đường, không phải hướng nhà. */
const NOT_PLACE = String.raw`(?!\s+(?:từ liêm|hồ|anh|ninh|định|giang|kạn|hà|sài gòn|trung bộ|nam bộ|bộ|nguyên|triều|thăng long)(?![\p{L}]))`;
const DIRECTION_RE = re(`${START}(?<!ban công\\s+)(?:(?:hướng(?:\\s+(?:nhà|chính|cửa(?:\\s+chính)?))?|cửa(?:\\s+chính)?\\s+hướng)${H}:?${H}|chính\\s+)(${DIR})${NOT_TU_TRACH}${NOT_PLACE}${END}`);
const BALCONY_RE = re(`${START}ban công\\s+(?:hướng${H}:?${H})?(${DIR})${NOT_TU_TRACH}${END}`);
/** Hướng đứng trần trong tiêu đề ("Thạch Bàn - Tây Nam", "liền kề Đông Nam") → chỉ gợi ý; loại địa danh hay gặp ("Nam Từ Liêm", "Tây Hồ"…). */
const BARE_DIRECTION_RE = re(
  `(?:[-–—]\\s*|${START}(?:liền kề|đơn lập|song lập|căn góc|biệt thự|nhà phố|shophouse)\\s+)(${DIR})${NOT_TU_TRACH}${NOT_PLACE}${END}`,
);

const directionLabel = (d: Direction) => `${DIRECTION_ADMIN_LABELS[d]} (${d})`;
const readDirection = (match: RegExpExecArray) => DIRECTION_WORDS[match[1] ?? ""] ?? null;

function planDirection(sources: readonly TextSource[]): FieldPlan {
  const result = uniqueValue("houseDirection", collect(sources, DIRECTION_RE, readDirection), directionLabel);
  const notes: ReviewNote[] = [];
  if (result.value === undefined && result.review.length === 0) {
    const [bare] = collect(sources.slice(0, 1), BARE_DIRECTION_RE, readDirection);
    if (bare) notes.push({ field: "houseDirection", note: `Gợi ý: ${directionLabel(bare.value)} (không có chữ "hướng" đi trước, chưa điền)`, snippet: snippetOf(bare) });
  }
  const balconies = new Map(collect(sources, BALCONY_RE, readDirection).map((h) => [h.value, h]));
  for (const balcony of [...balconies.values()].reverse()) {
    const note = balcony.value === result.value ? "trùng hướng nhà đã trích, soát lại" : "không dùng làm hướng nhà";
    notes.push({ field: "houseDirection", note: `Hướng ban công ${directionLabel(balcony.value)} — ${note}`, snippet: snippetOf(balcony) });
  }
  return { ...result, review: [...result.review, ...notes] };
}

// ── Mặt tiền: "mặt tiền 5m", "MT: 11m", "mặt tiền rộng 5,5 m", "MT 4x18m", "5m mặt tiền" ──
const FRONTAGE_RES = [
  re(`${START}(?<!cách\\s+)(?:mặt tiền|mt)${H}(?:rộng${H})?:?${H}(${NUM})${H}(?:m(?![\\p{L}\\p{N}²])|mét(?![\\p{L}])|x)`),
  re(`${NUM_START}(?<!cách\\s+)(${NUM})${H}m${H}mặt tiền(?![\\p{L}])`),
];

// ── Số tầng: "4 tầng", "3.5 tầng", "Số tầng: 4", "1 trệt 3 lầu" → 4 (lửng không tính); loại "tầng hầm / lửng / thượng" ──
const FLOOR_NUM = String.raw`\d{1,2}(?:[.,]5)?`;
const FLOOR_RES = [re(`${NUM_START}(${FLOOR_NUM})${H}tầng(?!${H}(?:hầm|lửng|thượng))(?![\\p{L}])`), re(`${START}số tầng${H}:${H}(${FLOOR_NUM})${END}`)];
/** "1 tum", "+ tum", "tầng tum": số tầng đã trích thường chưa gồm tum → ghi chú soát. */
const TUM_RE = re(`${START}tum${END}`);
const TRET_LAU_RE = re(`${START}(?:1${H})?trệt${H},?${H}(?:\\+${H})?(?:\\d${H}lửng${H},?${H}(?:\\+${H})?)?(\\d{1,2})${H}lầu(?![\\p{L}])`);

function planFloors(sources: readonly TextSource[]): FieldPlan {
  const hits = [...FLOOR_RES.flatMap((regex) => collect(sources, regex, readNumber(99))), ...collect(sources, TRET_LAU_RE, (m) => 1 + Number(m[1]))];
  const tall = hits.find((h) => h.value > MAX_FLOORS_FILL);
  if (tall) return { filled: [], review: [{ field: "floors", note: `Số tầng ${tall.value} (trên ${MAX_FLOORS_FILL} — có thể là số tầng toà nhà) — chưa điền`, snippet: snippetOf(tall) }] };
  const result = uniqueValue("floors", hits, (v) => `${v} tầng`);
  const [first] = hits;
  if (result.value === undefined || !first) return result;
  const notes: ReviewNote[] = [];
  if (!Number.isInteger(result.value)) notes.push({ field: "floors", note: `Số tầng lẻ ${result.value} (thường là có lửng / tum) — soát lại`, snippet: snippetOf(first) });
  const tum = collect(sources, TUM_RE, () => true)[0];
  if (tum) notes.push({ field: "floors", note: `Có "tum" — soát số tầng ${result.value} có tính tum không`, snippet: snippetOf(tum) });
  return { ...result, review: [...result.review, ...notes] };
}

// ── Loại hình: từ khoá như Dự án (P1-T07); tiêu đề trước, chỉ xuống tóm tắt / nội dung khi tiêu đề không có từ khoá ──
/** Cùng khớp hai loại thì loại cụ thể hơn thắng ("nhà phố shophouse" → shophouse, "biệt thự nghỉ dưỡng" → resort). */
const MORE_SPECIFIC: [specific: PropertyType, general: PropertyType][] = [
  ["shophouse", "townhouse"],
  ["condotel", "apartment"],
  ["resort", "villa"],
];

function planPropertyType(sources: readonly TextSource[]): FieldPlan {
  for (const tier of [sources.slice(0, 1), sources.slice(1)]) {
    const found = new Map<PropertyType, Hit<PropertyType>>();
    for (const source of tier) {
      for (const type of Object.keys(PRODUCT_TYPE_KEYWORDS) as PropertyType[]) {
        const hit = found.has(type) ? null : findPhrase(source.text, PRODUCT_TYPE_KEYWORDS[type]);
        if (hit) found.set(type, { value: type, source, ...hit });
      }
    }
    for (const [specific, general] of MORE_SPECIFIC) if (found.has(specific)) found.delete(general);
    if (found.size > 0) return uniqueValue("propertyType", [...found.values()], (v) => `${PROPERTY_TYPE_ADMIN_LABELS[v]} (${v})`);
  }
  return NONE;
}

// ── Địa chỉ: dòng "Địa chỉ: …" (không nhận "Địa chỉ văn phòng / liên hệ: …"); cắt ở hết câu đầu ──
const ADDRESS_RE = /^[ \t\-–•*+]*(?:địa chỉ|đ\/c)[ \t]*:[ \t]*(.+)$/gmu;

function planAddress(sources: readonly TextSource[]): FieldPlan {
  const byKey = new Map<string, Hit<string>>();
  for (const source of sources) {
    const text = source.text.normalize("NFC");
    for (const match of normalizeText(text).matchAll(ADDRESS_RE)) {
      const end = match.index + match[0].length;
      const raw = text.slice(end - (match[1]?.length ?? 0), end);
      const value = (raw.split(/(?<=\S)[.;|](?:\s|$)/u)[0] ?? "").trim().replace(/[.,;]+$/u, "");
      const key = normalizeText(value).replace(/\s+/g, " ");
      if (/\p{L}/u.test(value) && value.length <= MAX_ADDRESS && !byKey.has(key)) byKey.set(key, { value, source, index: match.index, length: match[0].length });
    }
  }
  return uniqueValue("address", [...byKey.values()], (v) => v);
}

export type PostField = "propertyType" | "areaM2" | "bedrooms" | "bathrooms" | "houseDirection" | "frontageM" | "floors" | "address";

export const FIELD_PLANNERS: { name: PostField; plan: (sources: readonly TextSource[]) => FieldPlan }[] = [
  { name: "propertyType", plan: planPropertyType },
  { name: "areaM2", plan: planArea },
  { name: "bedrooms", plan: planRooms("bedrooms", BEDROOM_RES) },
  { name: "bathrooms", plan: planRooms("bathrooms", BATHROOM_RES) },
  { name: "houseDirection", plan: planDirection },
  { name: "frontageM", plan: (sources) => uniqueValue("frontageM", FRONTAGE_RES.flatMap((regex) => collect(sources, regex, readNumber(MAX_FRONTAGE))), (v) => `${v} m`) },
  { name: "floors", plan: planFloors },
  { name: "address", plan: planAddress },
];
