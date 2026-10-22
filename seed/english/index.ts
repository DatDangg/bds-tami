import { readFile } from "node:fs/promises";

import type { Payload } from "payload";

import { checkSeedEnvironment } from "../../src/lib/rentals/sample-amenities";
import { applyCollection, applyGlobals, type ApplyStats, COLLECTION_KEY_FIELD, type EnglishCollection } from "./apply";
import type { EnglishFile } from "./format";
import { applyMediaAlts } from "./media";

/**
 * Seed dữ liệu EN viết sẵn (BL-064): đọc `seed/english/data/*.json`, ghi CHỈ locale `en` (không bao giờ `vi`), bật `hasEnglish`,
 * không xếp job dịch AI, idempotent. Thiếu file dữ liệu của một nhóm = bỏ qua (task sau thêm dần). Xem `seed/english/README.md`.
 */
export const ENGLISH_GROUPS = [...(Object.keys(COLLECTION_KEY_FIELD) as EnglishCollection[]), "globals", "media"] as const;
export type EnglishGroup = (typeof ENGLISH_GROUPS)[number];

const DATA_DIR = new URL("./data/", import.meta.url);

/**
 * Lý do KHÔNG được seed EN, hoặc `null` khi đây là DB dev (spec BL-064: chỉ DB dev, không staging/prod).
 * Dùng `checkSeedEnvironment` (production, NODE_ENV=production, DATABASE_URL trùng staging/prod) nhưng bỏ đường opt-in
 * `ALLOW_STAGING_SEED` và chặn thêm `APP_ENV=staging`: seed này ghi đè EN của biên tập viên khi tiêu đề vi trùng khoá.
 */
export function englishSeedBlockReason(env: Record<string, string | undefined>): string | null {
  if (env.APP_ENV === "staging") return "APP_ENV=staging";
  const check = checkSeedEnvironment({ ...env, ALLOW_STAGING_SEED: undefined });
  return check.allowed ? null : check.reason;
}

export function assertEnglishSeedAllowed(env: Record<string, string | undefined> = process.env): void {
  const reason = englishSeedBlockReason(env);
  if (reason) throw new Error(`Seed dữ liệu EN chỉ chạy trên DB dev, không chạy được vì ${reason}.`);
}

async function readData<T>(group: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(new URL(`${group}.json`, DATA_DIR), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(`Không đọc được seed/english/data/${group}.json: ${(error as Error).message}`);
  }
}

const summary = (stats: ApplyStats) => `ghi ${stats.applied}, không đổi ${stats.unchanged}, thiếu bản vi ${stats.missing.length}, lệch/lỗi ${stats.mismatched.length}`;

function logProblems(payload: Payload, group: string, stats: ApplyStats): void {
  for (const key of stats.missing) payload.logger.warn(`Seed EN ${group}: không có bản ghi vi "${key}" (dữ liệu thừa)`);
  for (const message of stats.mismatched) payload.logger.warn(`Seed EN ${group}: bỏ qua — ${message}`);
}

/** `only` rỗng/thiếu = mọi nhóm. Trả số lệch/lỗi để script đặt exit code. */
export async function runSeedEnglish(payload: Payload, only: readonly string[] = []): Promise<{ problems: number }> {
  assertEnglishSeedAllowed();
  const unknown = only.filter((name) => !(ENGLISH_GROUPS as readonly string[]).includes(name));
  if (unknown.length > 0) throw new Error(`Nhóm không hợp lệ: ${unknown.join(", ")}. Dùng: ${ENGLISH_GROUPS.join(" | ")}`);
  const wants = (group: string) => only.length === 0 || only.includes(group);
  let problems = 0;

  for (const slug of Object.keys(COLLECTION_KEY_FIELD) as EnglishCollection[]) {
    if (!wants(slug)) continue;
    const file = await readData<EnglishFile>(slug);
    if (!file) {
      payload.logger.info(`Seed EN ${slug}: chưa có data/${slug}.json, bỏ qua`);
      continue;
    }
    const stats = await applyCollection(payload, slug, file);
    payload.logger.info(`Seed EN ${slug}: ${summary(stats)}`);
    logProblems(payload, slug, stats);
    problems += stats.mismatched.length;
  }

  if (wants("globals")) {
    const file = await readData<EnglishFile>("globals");
    if (file) {
      const stats = await applyGlobals(payload, file);
      payload.logger.info(`Seed EN globals: ${summary(stats)}`);
      logProblems(payload, "globals", stats);
      problems += stats.mismatched.length;
    } else {
      payload.logger.info("Seed EN globals: chưa có data/globals.json, bỏ qua");
    }
  }

  // Media sau cùng: alt theo mẫu cần tiêu đề EN của dự án/tin vừa được ghi ở trên.
  if (wants("media")) {
    const stats = await applyMediaAlts(payload, (await readData<Record<string, string>>("media")) ?? {});
    payload.logger.info(`Seed EN media alt: ghi ${stats.applied}, không đổi ${stats.unchanged}, chưa có EN ${stats.unresolved.length}`);
    for (const alt of stats.unresolved.slice(0, 20)) payload.logger.info(`Seed EN media alt chưa có EN: "${alt}"`);
  }
  return { problems };
}
