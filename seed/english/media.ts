import type { Payload } from "payload";

import { TRANSLATION_JOB_CONTEXT_KEY } from "../../src/hooks/translation/translation-targets";
import { parseTemplatedAlt, templatedAltEn } from "./format";

export interface MediaAltStats {
  applied: number;
  unchanged: number;
  /** Alt `vi` không theo mẫu và không có trong `media.json`, hoặc theo mẫu nhưng bản ghi gốc chưa có tiêu đề EN. */
  unresolved: string[];
}

const TITLE_COLLECTIONS = ["projects", "rentals", "property-posts", "news"] as const;
const READ = { fallbackLocale: false, depth: 0, overrideAccess: true, pagination: false, limit: 0 } as const;

/** Tiêu đề `vi` → tiêu đề EN của mọi bản ghi có ảnh theo mẫu `<tiêu đề> - ảnh N` (bản ghi chưa có EN thì không có trong map). */
async function titleEnglishByVietnamese(payload: Payload): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const collection of TITLE_COLLECTIONS) {
    const select = { title: true } as never;
    const vi = (await payload.find({ collection, locale: "vi", select, ...READ })).docs as unknown as Array<{ id: string; title?: string | null }>;
    const en = (await payload.find({ collection, locale: "en", select, ...READ })).docs as unknown as Array<{ id: string; title?: string | null }>;
    const enById = new Map(en.map((doc) => [doc.id, doc.title?.trim() ?? ""]));
    for (const doc of vi) {
      const titleEn = enById.get(doc.id);
      if (doc.title && titleEn) map.set(doc.title, titleEn);
    }
  }
  return map;
}

/**
 * Alt EN của media (D7): alt `vi` theo mẫu → `<tiêu đề EN> - photo N` / `additional photo N` / `cover image`; alt khác lấy từ `explicit` (`data/media.json`, khoá = alt `vi`).
 * Chỉ ghi locale `en` của `alt`, khi khác giá trị hiện có.
 */
export async function applyMediaAlts(payload: Payload, explicit: Record<string, string>): Promise<MediaAltStats> {
  const titles = await titleEnglishByVietnamese(payload);
  const select = { alt: true } as never;
  const vi = (await payload.find({ collection: "media", locale: "vi", select, ...READ })).docs as unknown as Array<{ id: string; alt?: string | null }>;
  const en = (await payload.find({ collection: "media", locale: "en", select, ...READ })).docs as unknown as Array<{ id: string; alt?: string | null }>;
  const enById = new Map(en.map((doc) => [doc.id, doc.alt?.trim() ?? ""]));

  const stats: MediaAltStats = { applied: 0, unchanged: 0, unresolved: [] };
  for (const doc of vi) {
    const altVi = doc.alt?.trim();
    if (!altVi) continue;
    const target = explicit[altVi] ?? templatedTarget(altVi, titles);
    if (!target) {
      stats.unresolved.push(altVi);
    } else if (enById.get(doc.id) === target) {
      stats.unchanged++;
    } else {
      await payload.update({ collection: "media", id: doc.id, locale: "en", data: { alt: target }, depth: 0, overrideAccess: true, context: { [TRANSLATION_JOB_CONTEXT_KEY]: true } });
      stats.applied++;
    }
  }
  return stats;
}

function templatedTarget(altVi: string, titles: Map<string, string>): string | null {
  const parsed = parseTemplatedAlt(altVi);
  const titleEn = parsed ? titles.get(parsed.titleVi) : undefined;
  return parsed && titleEn ? templatedAltEn(titleEn, parsed.suffixEn) : null;
}
