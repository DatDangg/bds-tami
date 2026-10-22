import { missingEnglishFields } from "../../src/hooks/require-english-fields";
import { hashLeafValue, type TranslatableLeaf } from "../../src/lib/translation/leaves";
import { applyTextNodes, extractTextNodes, type LexicalRoot } from "../../src/lib/translation/lexical";

/**
 * Định dạng dữ liệu EN viết sẵn (xem `seed/english/README.md`).
 * Một bản ghi = `{ "<đường dẫn trường>": <chuỗi EN> | <mảng chuỗi EN theo thứ tự ô chữ của richText> }`.
 * Đường dẫn trường = tên trường nối bằng dấu chấm, hàng của array/blocks thay bằng CHỈ SỐ hàng (bản `vi`), vd `title`, `amenities.0.name`, `seo.title`.
 */
export type EnglishValue = string | string[];
export type EnglishEntry = Record<string, EnglishValue>;
/** Khoá = tên/tiêu đề `vi` của bản ghi (collection) hoặc slug của global. */
export type EnglishFile = Record<string, EnglishEntry>;

export const leafKey = (leaf: Pick<TranslatableLeaf, "path">): string => leaf.path.map((step) => (typeof step === "string" ? step : String(step.index))).join(".");

/** Số ô chữ có chữ thật; richText không có ô chữ nào (đoạn trống) coi như không có nội dung để dịch. */
const hasText = (texts: readonly string[]) => texts.some((text) => text.trim() !== "");

/** Giá trị của một lá theo định dạng dữ liệu: chuỗi, hoặc mảng chuỗi (richText). `null` khi lá không có chữ. */
export function leafToDataValue(leaf: TranslatableLeaf): EnglishValue | null {
  if (leaf.kind === "text") return typeof leaf.value === "string" && leaf.value.trim() !== "" ? leaf.value : null;
  const texts = extractTextNodes(leaf.value as unknown as LexicalRoot);
  return hasText(texts) ? texts : null;
}

/** Bản ghi ở định dạng dữ liệu: chữ `vi` đứng tại chỗ chuỗi EN (cho `seed:english:export`). */
export function exportEntry(leaves: readonly TranslatableLeaf[]): EnglishEntry {
  const entry: EnglishEntry = {};
  for (const leaf of leaves) {
    const value = leafToDataValue(leaf);
    if (value !== null) entry[leafKey(leaf)] = value;
  }
  return entry;
}

export interface ResolvedEntry {
  translated: Array<{ leaf: TranslatableLeaf; value: unknown }>;
  problems: string[];
}

/**
 * Ghép dữ liệu EN vào các lá của bản `vi` hiện tại. Mọi lỗi (khoá lạ, sai kiểu, số ô chữ richText lệch, chuỗi trống) gom vào `problems`;
 * bên gọi bỏ CẢ bản ghi khi có lỗi (không ghi nửa vời).
 */
export function resolveEntry(leaves: readonly TranslatableLeaf[], entry: EnglishEntry): ResolvedEntry {
  const byKey = new Map(leaves.map((leaf) => [leafKey(leaf), leaf]));
  const translated: ResolvedEntry["translated"] = [];
  const problems: string[] = [];
  for (const [key, value] of Object.entries(entry)) {
    const leaf = byKey.get(key);
    if (!leaf) {
      problems.push(`${key}: không có trường này trong bản vi`);
    } else if (leaf.kind === "text") {
      if (typeof value === "string" && value.trim() !== "") translated.push({ leaf, value });
      else problems.push(`${key}: cần chuỗi EN không rỗng`);
    } else {
      const rich = resolveRichText(leaf, value);
      if (typeof rich === "string") problems.push(`${key}: ${rich}`);
      else translated.push({ leaf, value: rich });
    }
  }
  return { translated, problems };
}

/** Cây Lexical EN, hoặc chuỗi mô tả lỗi. */
function resolveRichText(leaf: TranslatableLeaf, value: EnglishValue): LexicalRoot | string {
  if (!Array.isArray(value) || value.some((text) => typeof text !== "string")) return "richText cần mảng chuỗi";
  const source = leaf.value as unknown as LexicalRoot;
  const expected = extractTextNodes(source).length;
  if (value.length !== expected) return `số ô chữ lệch (dữ liệu ${value.length}, bản vi ${expected})`;
  try {
    return applyTextNodes(source, value);
  } catch {
    return "ghép richText thất bại (khung cây lệch)";
  }
}

/** Hai giá trị lá bằng nhau (richText so theo hash ổn định, không phụ thuộc thứ tự khoá). */
export function sameLeafValue(current: unknown, next: unknown): boolean {
  if (typeof current === "string" || typeof next === "string") return current === next;
  if (typeof current !== "object" || current === null || typeof next !== "object" || next === null) return false;
  return hashLeafValue(current as Record<string, unknown>) === hashLeafValue(next as Record<string, unknown>);
}

/** Trường EN bắt buộc còn thiếu (dùng đúng vị từ của hook `requireEnglishFields`). */
export const missingRequired = (required: readonly string[], english: Record<string, unknown>): string[] => missingEnglishFields(required, english);

// ---- Alt ảnh (D7) ----

const ALT_SUFFIXES: ReadonlyArray<{ pattern: RegExp; english: (match: RegExpMatchArray) => string }> = [
  { pattern: /^ảnh bìa$/, english: () => "cover image" },
  { pattern: /^ảnh bổ sung (\d+)$/, english: (match) => `additional photo ${match[1]}` },
  { pattern: /^ảnh (\d+)$/, english: (match) => `photo ${match[1]}` },
];

/**
 * Alt `vi` dạng `<tiêu đề vi> - ảnh N` / `- ảnh bổ sung N` / `- ảnh bìa` → tiêu đề vi + hậu tố EN. `null` khi alt không theo mẫu (cần dữ liệu tường minh).
 */
export function parseTemplatedAlt(altVi: string): { titleVi: string; suffixEn: string } | null {
  const split = altVi.lastIndexOf(" - ");
  if (split < 0) return null;
  const suffix = altVi.slice(split + 3).trim();
  for (const { pattern, english } of ALT_SUFFIXES) {
    const match = suffix.match(pattern);
    if (match) return { titleVi: altVi.slice(0, split), suffixEn: english(match) };
  }
  return null;
}

export const templatedAltEn = (titleEn: string, suffixEn: string): string => `${titleEn} - ${suffixEn}`;

/** Còn dấu tiếng Việt (dùng để lọc "EN còn tiếng Việt" khi export `missing`). */
export const hasVietnameseMarks = (text: string): boolean => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
