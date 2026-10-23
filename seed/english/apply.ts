import type { CollectionSlug, GlobalSlug, Payload } from "payload";

import { APPROVE_ENGLISH_CONTEXT_KEY } from "../../src/hooks/pages/approve-english";
import { computeSourceHash } from "../../src/hooks/translation/compute-source-hash";
import { leavesOfDoc, TRANSLATION_JOB_CONTEXT_KEY, type TranslationTargetRef } from "../../src/hooks/translation/translation-targets";
import { buildEnglishWrite, readAtPath } from "../../src/lib/translation/leaves";
import { type EnglishEntry, type EnglishFile, missingRequired, resolveEntry, type ResolvedEntry, sameLeafValue } from "./format";
import { existingEnglishConflicts } from "./pack-plan";

type Doc = Record<string, unknown>;

export interface ApplyStats {
  /** Bản ghi có ghi (nội dung EN đổi hoặc vừa bật hasEnglish). */
  applied: number;
  /** Bản ghi đã khớp dữ liệu, không ghi. */
  unchanged: number;
  /** Khoá dữ liệu không tìm thấy bản ghi (đổi tên/xoá bản vi). */
  missing: string[];
  /** Bản ghi bị bỏ vì dữ liệu lệch bản vi hoặc DB từ chối. */
  mismatched: string[];
}

/** Tuỳ chọn của gói EN (BL-072); mặc định `{}` = hành vi BL-064 (`seed:english`) không đổi. */
export interface WriteOptions {
  /** Chỉ lập kế hoạch + kiểm, không ghi DB. */
  dryRun?: boolean;
  /** Bỏ cả bản ghi khi EN hiện tại đã có chữ khác dữ liệu (không ghi đè biên tập viên). */
  protectExisting?: boolean;
}

export const newStats = (): ApplyStats => ({ applied: 0, unchanged: 0, missing: [], mismatched: [] });

/** Trường dùng làm khoá khớp bản ghi (chữ `vi`). */
export const COLLECTION_KEY_FIELD = {
  categories: "name",
  developers: "name",
  services: "title",
  "job-postings": "title",
  pages: "title",
  projects: "title",
  rentals: "title",
  "property-posts": "title",
  news: "title",
} as const;
export type EnglishCollection = keyof typeof COLLECTION_KEY_FIELD;
export const GLOBAL_SLUGS = ["homepage", "site-settings", "header", "footer"] as const;

/** Lần ghi do seed: hook xếp job dịch AI + nhận diện "sửa tay" đều bỏ qua khi có cờ này; cờ duyệt cho phép bật `hasEnglish` của trang pháp lý. */
const WRITE_CONTEXT = { [TRANSLATION_JOB_CONTEXT_KEY]: true, [APPROVE_ENGLISH_CONTEXT_KEY]: true } as const;
const READ = { fallbackLocale: false, depth: 0, overrideAccess: true } as const;

function translationMeta(payload: Payload, target: TranslationTargetRef, vi: Doc): Doc {
  const stored = (vi.translation ?? {}) as Doc;
  return {
    ...stored,
    status: "done",
    // `manual`: job dịch AI không bao giờ dịch đè bản viết tay (xem translate-content.ts `stored.enSource === "manual"`).
    enSource: "manual",
    viChangedAfterManual: false,
    sourceHash: computeSourceHash(payload, target, vi),
    translatedAt: new Date().toISOString(),
    lastError: null,
  };
}

const requiredFields = (payload: Payload, slug: string): readonly string[] => {
  const config = payload.collections[slug as CollectionSlug]?.config;
  return (config?.custom as { englishRequiredFields?: readonly string[] } | undefined)?.englishRequiredFields ?? ["title", "slug"];
};

/**
 * Trường EN bắt buộc còn thiếu nếu ghi `translated` lên bản EN hiện tại (tính TRƯỚC khi ghi để không để nội dung nửa vời).
 * `slug` bỏ qua vì hook sinh từ tiêu đề EN; hậu kiểm sau ghi vẫn còn làm lưới an toàn.
 */
export function missingBeforeWrite(required: readonly string[], en: Doc, translated: ResolvedEntry["translated"]): string[] {
  const planned: Doc = { ...en };
  for (const { leaf, value } of translated) {
    const [first] = leaf.path;
    if (leaf.path.length === 1 && typeof first === "string") planned[first] = value;
  }
  return missingRequired(required.filter((field) => field !== "slug"), planned);
}

/** Lá nào của bản `vi` có dữ liệu mà bản `en` hiện tại chưa khớp; `null` + `problems` khi dữ liệu không ghép được. */
function planWrite(
  payload: Payload,
  target: TranslationTargetRef,
  vi: Doc,
  en: Doc,
  entry: EnglishEntry,
  required: readonly string[] = [],
  protectExisting = false,
): { write: Doc | null; problems: string[] } {
  const { translated, problems } = resolveEntry(leavesOfDoc(payload, target, vi), entry);
  if (problems.length > 0) return { write: null, problems };
  const conflicts = protectExisting ? existingEnglishConflicts(translated, en, false) : [];
  if (conflicts.length > 0) return { write: null, problems: [`EN đã có, khác gói: ${conflicts.join(", ")} (thêm "overwrite" nếu muốn ghi đè)`] };
  const missing = en.hasEnglish === true ? [] : missingBeforeWrite(required, en, translated);
  if (missing.length > 0) return { write: null, problems: [`thiếu trường EN bắt buộc: ${missing.join(", ")}`] };
  const changed = translated.filter(({ leaf, value }) => !sameLeafValue(readAtPath(en, leaf.path), value));
  if (changed.length === 0) return { write: {}, problems };
  const write = buildEnglishWrite(en, changed);
  return write ? { write, problems } : { write: null, problems: ["hàng array không còn khớp bản vi"] };
}

/** Trả `applied`/`unchanged`, hoặc ném lỗi (bên gọi gom vào `mismatched`). `dryRun`: `applied` = SẼ ghi, không ghi gì. */
export async function applyToCollectionDoc(payload: Payload, slug: EnglishCollection, vi: Doc, entry: EnglishEntry, options: WriteOptions = {}): Promise<"applied" | "unchanged"> {
  const target: TranslationTargetRef = { kind: "collection", slug };
  const id = vi.id as string;
  const en = (await payload.findByID({ collection: slug, id, locale: "en", ...READ })) as unknown as Doc;
  const { write, problems } = planWrite(payload, target, vi, en, entry, requiredFields(payload, slug), options.protectExisting);
  if (!write) throw new Error(problems.join("; "));

  let saved = en;
  const common = { collection: slug, id, locale: "en", ...READ, context: WRITE_CONTEXT } as const;
  const hasContentChange = Object.keys(write).length > 0;
  if (options.dryRun) return dryRunResult(payload, slug, en, hasContentChange);
  if (hasContentChange) {
    saved = (await payload.update({ ...common, data: { ...write, translation: translationMeta(payload, target, vi) } as never })) as unknown as Doc;
  }
  if (saved.hasEnglish === true) return hasContentChange ? "applied" : "unchanged";

  // Slug EN do hook sinh ở lần ghi đầu, nên chỉ quyết định bật cờ sau khi đọc bản EN đã lưu (cùng vị từ với hook `requireEnglishFields`).
  const missing = missingRequired(requiredFields(payload, slug), saved);
  if (missing.length > 0) throw new Error(`thiếu trường EN bắt buộc: ${missing.join(", ")}`);
  await payload.update({ ...common, data: { hasEnglish: true, translation: translationMeta(payload, target, vi) } as never });
  return "applied";
}

/** Dry-run: kết quả như khi ghi thật, trừ bước hậu kiểm slug EN (do hook sinh khi ghi). */
function dryRunResult(payload: Payload, slug: EnglishCollection, en: Doc, hasContentChange: boolean): "applied" | "unchanged" {
  if (hasContentChange) return "applied";
  if (en.hasEnglish === true) return "unchanged";
  const missing = missingRequired(requiredFields(payload, slug), en);
  if (missing.length > 0) throw new Error(`thiếu trường EN bắt buộc: ${missing.join(", ")}`);
  return "applied";
}

function describeError(error: unknown): string {
  const fields = (error as { data?: { errors?: Array<{ path?: string }> } }).data?.errors?.map((entry) => entry.path).join(", ");
  return fields ? `${(error as Error).name}: ${fields}` : (error as Error).message;
}

/** Áp `data/<collection>.json` vào mọi bản ghi (chưa xoá mềm) có khoá `vi` trùng. Không bao giờ ghi locale `vi`. */
export async function applyCollection(payload: Payload, slug: EnglishCollection, file: EnglishFile): Promise<ApplyStats> {
  const keyField = COLLECTION_KEY_FIELD[slug];
  const viDocs = (await payload.find({ collection: slug, locale: "vi", ...READ, pagination: false, limit: 0 })).docs as unknown as Doc[];
  const byKey = new Map<string, Doc[]>();
  for (const doc of viDocs) {
    const key = typeof doc[keyField] === "string" ? (doc[keyField] as string) : "";
    byKey.set(key, [...(byKey.get(key) ?? []), doc]);
  }
  const stats = newStats();
  for (const [key, entry] of Object.entries(file)) {
    const docs = byKey.get(key);
    if (!docs) {
      stats.missing.push(key);
      continue;
    }
    for (const doc of docs) {
      try {
        stats[await applyToCollectionDoc(payload, slug, doc, entry)]++;
      } catch (error) {
        stats.mismatched.push(`${key}: ${describeError(error)}`);
      }
    }
  }
  return stats;
}

/** Áp `globals.json` (khoá = slug global). Global không có `hasEnglish` nên chỉ ghi nội dung + nhóm `translation`. */
export async function applyGlobals(payload: Payload, file: EnglishFile): Promise<ApplyStats> {
  const stats = newStats();
  for (const [slug, entry] of Object.entries(file)) {
    if (!(GLOBAL_SLUGS as readonly string[]).includes(slug)) {
      stats.missing.push(slug);
      continue;
    }
    try {
      stats[await applyToGlobal(payload, slug as GlobalSlug, entry)]++;
    } catch (error) {
      stats.mismatched.push(`${slug}: ${describeError(error)}`);
    }
  }
  return stats;
}

export async function applyToGlobal(payload: Payload, slug: GlobalSlug, entry: EnglishEntry, options: WriteOptions = {}): Promise<"applied" | "unchanged"> {
  const target: TranslationTargetRef = { kind: "global", slug };
  const vi = (await payload.findGlobal({ slug, locale: "vi", ...READ })) as unknown as Doc;
  const en = (await payload.findGlobal({ slug, locale: "en", ...READ })) as unknown as Doc;
  const { write, problems } = planWrite(payload, target, vi, en, entry, [], options.protectExisting);
  if (!write) throw new Error(problems.join("; "));
  if (Object.keys(write).length === 0) return "unchanged";
  if (options.dryRun) return "applied";
  await payload.updateGlobal({ slug, locale: "en", ...READ, context: WRITE_CONTEXT, data: { ...write, translation: translationMeta(payload, target, vi) } as never });
  return "applied";
}
