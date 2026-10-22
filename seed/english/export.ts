import type { Payload } from "payload";

import { leavesOfDoc, type TranslationTargetRef } from "../../src/hooks/translation/translation-targets";
import { readAtPath, type TranslatableLeaf } from "../../src/lib/translation/leaves";
import { COLLECTION_KEY_FIELD, type EnglishCollection, GLOBAL_SLUGS } from "./apply";
import { type EnglishEntry, type EnglishFile, exportEntry, hasVietnameseMarks, leafToDataValue } from "./format";

type Doc = Record<string, unknown>;
const READ = { fallbackLocale: false, depth: 0, overrideAccess: true } as const;

/** EN của lá này còn trống hoặc còn tiếng Việt (dấu) — dùng cho chế độ `missing`. */
function needsEnglish(leaf: TranslatableLeaf, en: Doc): boolean {
  const current = readAtPath(en, leaf.path);
  if (current === undefined || current === null || current === "") return true;
  const asData = leafToDataValue({ ...leaf, value: current as never });
  if (asData === null) return true;
  return (Array.isArray(asData) ? asData : [asData]).some(hasVietnameseMarks);
}

function entryOf(target: TranslationTargetRef, payload: Payload, vi: Doc, en: Doc, onlyMissing: boolean): EnglishEntry {
  const leaves = leavesOfDoc(payload, target, vi);
  if (!onlyMissing) return exportEntry(leaves);
  return exportEntry(leaves.filter((leaf) => needsEnglish(leaf, en)));
}

/**
 * Xuất bản `vi` ở đúng định dạng dữ liệu EN: người dịch chỉ thay chuỗi `vi` bằng chuỗi EN, giữ nguyên khoá.
 * `onlyMissing`: chỉ lá mà EN còn trống hoặc còn tiếng Việt (bỏ bản ghi không còn gì cần dịch).
 */
export async function exportGroup(payload: Payload, group: EnglishCollection | "globals", onlyMissing: boolean): Promise<EnglishFile> {
  const out: EnglishFile = {};
  if (group === "globals") {
    for (const slug of GLOBAL_SLUGS) {
      const vi = (await payload.findGlobal({ slug, locale: "vi", ...READ })) as unknown as Doc;
      const en = (await payload.findGlobal({ slug, locale: "en", ...READ })) as unknown as Doc;
      const entry = entryOf({ kind: "global", slug }, payload, vi, en, onlyMissing);
      if (Object.keys(entry).length > 0) out[slug] = entry;
    }
    return out;
  }
  const keyField = COLLECTION_KEY_FIELD[group];
  const target: TranslationTargetRef = { kind: "collection", slug: group };
  const viDocs = (await payload.find({ collection: group, locale: "vi", ...READ, pagination: false, limit: 0, sort: "createdAt" })).docs as unknown as Doc[];
  for (const vi of viDocs) {
    const key = vi[keyField];
    if (typeof key !== "string" || key === "" || key in out) continue;
    const en = (await payload.findByID({ collection: group, id: vi.id as string, locale: "en", ...READ })) as unknown as Doc;
    const entry = entryOf(target, payload, vi, en, onlyMissing);
    if (Object.keys(entry).length > 0) out[key] = entry;
  }
  return out;
}
