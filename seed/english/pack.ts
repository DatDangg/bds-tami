import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { GlobalSlug, Payload } from "payload";

import { applyToCollectionDoc, applyToGlobal, COLLECTION_KEY_FIELD, type EnglishCollection, GLOBAL_SLUGS, type WriteOptions } from "./apply";
import type { EnglishFile } from "./format";
import { applyExplicitMediaAlts } from "./media";
import { allowsMultipleMatches, classifyKeyMatches, countPackProblems, PACK_NAME_PATTERN, packConfirmProblem, type PackLine } from "./pack-plan";

/**
 * Gói EN (BL-072): `seed/english/packs/<tên>/` cùng định dạng `seed/english/data/*.json`, ghi được trên dev/staging/production.
 * Khác `runSeedEnglish` (BL-064, chỉ DB dev): chỉ ghi bản ghi có khoá trong gói (mỗi khoá khớp đúng 1 bản vi), không ghi đè EN biên tập viên
 * đã nhập (trừ `overwrite`), mặc định dry-run, `apply` cần env `ENGLISH_PACK_CONFIRM` = tên gói. Không bao giờ ghi locale `vi`, không xếp job dịch AI.
 */
export const PACKS_DIR = new URL("./packs/", import.meta.url);
const PACK_GROUPS = [...(Object.keys(COLLECTION_KEY_FIELD) as EnglishCollection[]), "globals", "media"] as const;

export interface RunPackOptions {
  pack: string;
  apply: boolean;
  overwrite: boolean;
  env?: Record<string, string | undefined>;
  /** Mặc định `seed/english/packs/<pack>/`; test truyền thư mục tạm. */
  packDir?: string;
}

export interface PackResult {
  lines: PackLine[];
  problems: number;
  written: number;
}

const isEntryObject = (value: unknown): boolean => typeof value === "object" && value !== null && !Array.isArray(value);

/** Đọc `<nhóm>.json` của gói; tên tệp lạ hoặc JSON sai dạng → ném lỗi (gõ nhầm tên tệp không được âm thầm bị bỏ). */
async function loadPack(dir: string): Promise<Map<string, EnglishFile>> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    throw new Error(`Không tìm thấy gói tại ${dir}`);
  }
  const files = new Map<string, EnglishFile>();
  for (const name of names.filter((entry) => entry.endsWith(".json")).sort()) {
    const group = name.slice(0, -".json".length);
    if (!(PACK_GROUPS as readonly string[]).includes(group)) throw new Error(`${name}: tên nhóm lạ. Dùng: ${PACK_GROUPS.join(" | ")}`);
    let data: unknown;
    try {
      data = JSON.parse(await readFile(`${dir}/${name}`, "utf8"));
    } catch (error) {
      throw new Error(`${name}: không đọc được JSON — ${(error as Error).message}`);
    }
    // media.json: { altVi: altEn } (chuỗi); còn lại: { khoá: { trường: giá trị } }.
    const valid = isEntryObject(data) && Object.values(data as object).every((value) => (group === "media" ? typeof value === "string" : isEntryObject(value)));
    if (!valid) throw new Error(`${name}: sai định dạng (xem seed/english/README.md)`);
    files.set(group, data as EnglishFile);
  }
  if (files.size === 0) throw new Error(`Gói ${dir} không có tệp <nhóm>.json nào`);
  return files;
}

async function planCollection(payload: Payload, slug: EnglishCollection, file: EnglishFile, options: WriteOptions): Promise<PackLine[]> {
  const keyField = COLLECTION_KEY_FIELD[slug];
  const lines: PackLine[] = [];
  for (const [key, entry] of Object.entries(file)) {
    const found = await payload.find({ collection: slug, locale: "vi", where: { [keyField]: { equals: key } }, fallbackLocale: false, depth: 0, overrideAccess: true, limit: 50, pagination: false });
    const docs = found.docs as unknown as Array<Record<string, unknown>>;
    const match = classifyKeyMatches(docs.length, allowsMultipleMatches(slug));
    if (match === "missing") lines.push({ group: slug, key, status: "missing" });
    else if (match === "duplicate") lines.push({ group: slug, key, status: "skip", reason: `khoá trùng ${docs.length}+ bản ghi, không ghi bản nào` });
    else {
      // "multiple" (categories): mỗi bản đi qua kiểm không-ghi-đè riêng; mỗi bản một dòng, ghi scope/id để phân biệt.
      for (const doc of docs) {
        const label = match === "multiple" ? `${key} [${String(doc.scope ?? doc.id)}]` : key;
        lines.push(await applyOne(slug, label, () => applyToCollectionDoc(payload, slug, doc, entry, options)));
      }
    }
  }
  return lines;
}

async function planGlobals(payload: Payload, file: EnglishFile, options: WriteOptions): Promise<PackLine[]> {
  const lines: PackLine[] = [];
  for (const [key, entry] of Object.entries(file)) {
    if (!(GLOBAL_SLUGS as readonly string[]).includes(key)) lines.push({ group: "globals", key, status: "missing", reason: "không phải slug global" });
    else lines.push(await applyOne("globals", key, () => applyToGlobal(payload, key as GlobalSlug, entry, options)));
  }
  return lines;
}

async function applyOne(group: string, key: string, run: () => Promise<"applied" | "unchanged">): Promise<PackLine> {
  try {
    return { group, key, status: (await run()) === "applied" ? "write" : "unchanged" };
  } catch (error) {
    const fields = (error as { data?: { errors?: Array<{ path?: string }> } }).data?.errors?.map((entry) => entry.path).join(", ");
    return { group, key, status: "skip", reason: fields ? `${(error as Error).name}: ${fields}` : (error as Error).message };
  }
}

/** Kế hoạch (dry-run) hoặc ghi thật (`apply`) cho một gói. Ném lỗi khi gói hỏng hoặc `apply` thiếu confirm — TRƯỚC khi đụng DB. */
export async function runEnglishPack(payload: Payload, options: RunPackOptions): Promise<PackResult> {
  if (!PACK_NAME_PATTERN.test(options.pack)) throw new Error(`Tên gói không hợp lệ: "${options.pack}"`);
  const refusal = packConfirmProblem(options.pack, options.apply, options.env ?? process.env);
  if (refusal) throw new Error(refusal);
  const files = await loadPack(options.packDir ?? fileURLToPath(new URL(`${options.pack}/`, PACKS_DIR)));
  const write: WriteOptions = { dryRun: !options.apply, protectExisting: !options.overwrite };

  const lines: PackLine[] = [];
  for (const slug of Object.keys(COLLECTION_KEY_FIELD) as EnglishCollection[]) {
    const file = files.get(slug);
    if (file) lines.push(...(await planCollection(payload, slug, file, write)));
  }
  const globals = files.get("globals");
  if (globals) lines.push(...(await planGlobals(payload, globals, write)));
  const media = files.get("media");
  if (media) lines.push(...(await applyExplicitMediaAlts(payload, media as unknown as Record<string, string>, { dryRun: !options.apply, overwrite: options.overwrite })));

  return { lines, problems: countPackProblems(lines), written: options.apply ? lines.filter((line) => line.status === "write").length : 0 };
}
