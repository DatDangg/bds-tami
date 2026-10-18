import { JobCancelledError, type PayloadRequest, type TaskConfig, ValidationError } from "payload";

import { isPublishedForTranslation, isTranslatableCollection, isTranslatableGlobal, leavesOfDoc, type TranslationTargetRef } from "../hooks/translation/translation-targets";
import { readStoredTranslation } from "../hooks/translation/compute-source-hash";
import { isTranslationEnabled, queueTranslation } from "../hooks/translation/enqueue-translation";
import { isFilled } from "../hooks/require-english-fields";
import { parseTranslationEnv } from "../lib/env";
import { CONTENT_ROUTES, type ContentRoute, contentPaths, internalPath } from "../lib/content/content-paths";
import { revalidateFromJob } from "../lib/revalidate/internal-revalidate";
import { TRANSLATION_ERROR_MESSAGES, TranslationError, type TranslationErrorCode } from "../lib/translation/errors";
import { TRANSLATE_CONTENT_SLUG, type TranslateContentInput } from "../lib/translation/job-input";
import { hashLeaves, hasSourceChanged, readAtPath, type SourceHashes, type TranslatableLeaf } from "../lib/translation/leaves";
import { createTranslationService, type TranslationConfig } from "../lib/translation/translation-service";
import { type Context, type Doc, patchTranslationGroup, readDoc, type TranslateContentDeps } from "./translate-content-context";
import { recordFailure } from "./translate-content-failure";
import { saveTranslatedLeaves } from "./translate-content-save";

export { TRANSLATE_CONTENT_SLUG };
export type { TranslateContentDeps };

/** Tổng số lần chạy tối đa của một job (lần đầu + thử lại): ARCHITECTURE §5.4 "thử lại 3 lần (backoff)". Payload tính `retries.attempts` là số lần THỬ LẠI. */
export const TRANSLATE_CONTENT_MAX_RUNS = 3;

/**
 * Chỉ lỗi tạm thời mới đáng thử lại. Mọi mã khác (đầu vào/đầu ra sai, bị từ chối, cắt cụt, hết hạn mức, chưa cấu hình, không được phép,
 * khoá sai, yêu cầu bị từ chối) thử lại vẫn ra kết quả cũ mà mỗi lần gọi API đều tốn tiền.
 */
export const RETRYABLE_TRANSLATION_CODES: readonly TranslationErrorCode[] = ["rate_limited", "provider_unavailable"];

export type TranslateContentOutcome =
  | { outcome: "translated"; fields: number }
  | { outcome: "unchanged" }
  | { outcome: "manual_kept"; viChanged: boolean }
  | { outcome: "skipped"; reason: "not_allowed" | "translation_disabled" | "budget_disabled" | "not_found" | "not_published" | "row_changed" };

function resolveConfig(deps: TranslateContentDeps): TranslationConfig {
  if (deps.config) return deps.config;
  try {
    const env = parseTranslationEnv(process.env);
    return { apiKey: env.ANTHROPIC_API_KEY, model: env.TRANSLATION_MODEL, monthlyBudgetUsd: env.TRANSLATION_MONTHLY_BUDGET_USD };
  } catch {
    throw new TranslationError("not_configured");
  }
}

/** Trường cần dịch lần này: `sourceHash` đổi (hoặc trường mới), hoặc bản `en` còn trống dù nguồn có chữ. `force` = tất cả. */
function selectChangedLeaves(leaves: TranslatableLeaf[], stored: SourceHashes, current: SourceHashes, englishDoc: Doc, force: boolean): TranslatableLeaf[] {
  if (force) return leaves;
  return leaves.filter((leaf) => {
    const sourceChanged = stored[leaf.key] !== current[leaf.key];
    const englishMissing = isFilled(leaf.value) && !isFilled(readAtPath(englishDoc, leaf.path));
    return sourceChanged || englishMissing;
  });
}

/** Đường dẫn EN cần làm mới sau khi dịch: chi tiết (slug en vừa sinh), danh sách, trang chủ nếu nổi bật; global → trang chủ `/en` (cache theo thời gian lo phần còn lại). */
function englishPaths(ctx: Context, saved: Doc): string[] {
  if (ctx.target.kind === "global") return [internalPath("/", "en")];
  const route = (CONTENT_ROUTES as Record<string, ContentRoute | undefined>)[ctx.target.slug];
  if (!route || ctx.target.slug === "pages") return [];
  const slug = typeof saved.slug === "string" && saved.slug !== "" ? saved.slug : undefined;
  // Chỉ bản EN vừa đổi: `contentPaths` luôn thêm cả danh sách/trang chủ vi, mà bản vi không đổi gì.
  return contentPaths(route, { slugs: { en: slug }, featured: Boolean(saved.isFeatured) }).filter((path) => path.startsWith("/en"));
}

async function revalidateEnglish(ctx: Context, saved: Doc): Promise<void> {
  const paths = englishPaths(ctx, saved);
  if (paths.length === 0) return;
  try {
    await (ctx.deps.revalidate ?? revalidateFromJob)(paths, ctx.req);
  } catch (error) {
    // Dịch đã trả tiền và đã lưu: KHÔNG ném (job thử lại sẽ thấy "không đổi" và không làm mới được nữa); trang tự hết hạn theo `s-maxage`.
    ctx.req.payload.logger.warn({ errorName: error instanceof Error ? error.name : "UnknownError", count: paths.length }, "Dịch: không làm mới được cache trang EN, chờ hết hạn tự nhiên");
  }
}

async function translateAndSave(ctx: Context, vi: Doc, config: TranslationConfig): Promise<TranslateContentOutcome> {
  const { req, target } = ctx;
  const stored = readStoredTranslation(vi);
  const leaves = leavesOfDoc(req.payload, target, vi);
  const currentHashes = hashLeaves(leaves);
  const force = ctx.input.force === true;

  if (stored.enSource === "manual" && !force) {
    const viChanged = hasSourceChanged(stored.sourceHash, currentHashes);
    if (viChanged && !stored.viChangedAfterManual) await markViChanged(ctx, vi);
    return { outcome: "manual_kept", viChanged };
  }

  const english = (await readDoc(ctx, "en")) ?? {};
  const changed = selectChangedLeaves(leaves, stored.sourceHash, currentHashes, english, force);
  if (changed.length === 0) return { outcome: "unchanged" };

  const service = createTranslationService({ payload: req.payload, config, client: ctx.deps.client, now: () => ctx.now });
  const result = await service.translate({
    target: target.kind === "global" ? { kind: "global", slug: target.slug } : { kind: "collection", slug: target.slug },
    items: changed.map((leaf) => ({ key: leaf.key, ...(leaf.kind === "text" ? { kind: "text" as const, value: leaf.value as string } : { kind: "richText" as const, value: leaf.value as never }) })),
  });

  const translation = {
    ...stored,
    status: target.slug === "pages" ? "pending_review" : "done",
    enSource: "ai",
    viChangedAfterManual: false,
    sourceHash: currentHashes,
    translatedAt: ctx.now.toISOString(),
    model: result.model,
    lastError: null,
  };
  const translated = changed.map((leaf) => ({ leaf, value: result.values[leaf.key] }));
  const saved = await writeOrFail(ctx, () => saveTranslatedLeaves(ctx, { sourceUpdatedAt: vi.updatedAt, translated, translation }));
  if (!saved) return rowChanged(ctx);
  await revalidateEnglish(ctx, saved);
  return { outcome: "translated", fields: changed.length };
}

/**
 * Bản ghi đổi trong lúc gọi API: bỏ lần ghi này (không ghi đè thay đổi của admin). Chi phí đã tính, nhưng `translation` giữ nguyên (`sourceHash` cũ) nên bản ghi vẫn "cần dịch";
 * xếp (hoặc lùi giờ) một job mới cho chính bản ghi để dịch lại từ bản mới nhất, kể cả khi lần lưu của admin không xếp job (vd chỉ đổi link). Log chỉ có định danh.
 */
async function rowChanged(ctx: Context): Promise<TranslateContentOutcome> {
  const { req, target, input } = ctx;
  req.payload.logger.warn({ slug: target.slug, docId: input.docId }, "Dịch: bản ghi đổi trong lúc dịch, bỏ lần ghi này và xếp job dịch lại");
  try {
    await queueTranslation(req, { kind: input.kind, slug: input.slug, docId: input.docId, ...(input.force ? { force: true } : {}) }, { now: () => ctx.now });
  } catch (error) {
    req.payload.logger.error({ errorName: error instanceof Error ? error.name : "UnknownError", slug: target.slug }, "Dịch: không xếp lại được job sau khi bản ghi đổi");
  }
  return { outcome: "skipped", reason: "row_changed" };
}

/** Lỗi ở bước GHI sau khi đã dịch (validate, DB): không thử lại (dịch lại tốn tiền mà kết quả sai vẫn sai); chỉ log tên trường lỗi, không log giá trị. */
async function writeOrFail<T>(ctx: Context, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    const fields = error instanceof ValidationError ? error.data.errors.map((entry) => entry.path) : undefined;
    ctx.req.payload.logger.error({ errorName: error instanceof Error ? error.name : "UnknownError", fields, slug: ctx.target.slug }, "Dịch: không lưu được bản EN");
    throw new TranslationError("invalid_output");
  }
}

const markViChanged = (ctx: Context, vi: Doc) => patchTranslationGroup(ctx, vi, { viChangedAfterManual: true });

export function classify(error: unknown): { code: TranslationErrorCode; retryable: boolean } {
  // Lỗi lạ (DB, mạng nội bộ) coi là tạm thời; message gốc không bao giờ đi tiếp.
  const code = error instanceof TranslationError ? error.code : "provider_unavailable";
  return { code, retryable: RETRYABLE_TRANSLATION_CODES.includes(code) };
}

function resolveTarget(input: TranslateContentInput): TranslationTargetRef | null {
  if (input.kind === "collection" && isTranslatableCollection(input.slug)) return { kind: "collection", slug: input.slug };
  if (input.kind === "global" && isTranslatableGlobal(input.slug)) return { kind: "global", slug: input.slug };
  return null;
}

async function run(ctx: Context): Promise<TranslateContentOutcome> {
  const { req } = ctx;
  if (!(await isTranslationEnabled(req))) return { outcome: "skipped", reason: "translation_disabled" };
  const config = resolveConfig(ctx.deps);
  // Hạn mức 0 = tắt dịch (staging): bỏ qua êm, không gọi API, không đánh dấu lỗi, không email.
  if (config.monthlyBudgetUsd <= 0) return { outcome: "skipped", reason: "budget_disabled" };

  const vi = await readDoc(ctx, "vi");
  if (!vi) return { outcome: "skipped", reason: "not_found" };
  if (!isPublishedForTranslation(ctx.target, vi)) return { outcome: "skipped", reason: "not_published" };
  return translateAndSave(ctx, vi, config);
}

/**
 * Lõi của job `translate-content` (ARCHITECTURE §5.4, BR-07/BR-08). Đọc lại bản ghi lúc chạy (input chỉ có định danh), dịch các trường vi đã đổi sang en
 * rồi ghi bản `en` + `translation` + (trừ `pages`) `hasEnglish` và làm mới cache `/en`. Lỗi: tạm thời (`rate_limited`, `provider_unavailable`) → ném lỗi thường để
 * Payload thử lại theo backoff, tới lần cuối thì ghi `status = failed`; còn lại → ghi `failed` ngay và `JobCancelledError` (không thử lại, không trả tiền lặp).
 * `attempt` = số lần đã chạy trước đó (`job.totalTried`).
 */
export async function translateContent(args: {
  req: PayloadRequest;
  input: TranslateContentInput;
  previousRuns: number;
  deps?: TranslateContentDeps;
}): Promise<TranslateContentOutcome> {
  const { req, input, previousRuns, deps = {} } = args;
  const target = resolveTarget(input);
  if (!target) return { outcome: "skipped", reason: "not_allowed" };
  const ctx: Context = { req, input, target, deps, now: (deps.now ?? (() => new Date()))() };

  try {
    return await run(ctx);
  } catch (error) {
    const { code, retryable } = classify(error);
    const lastRun = previousRuns + 1 >= TRANSLATE_CONTENT_MAX_RUNS;
    req.payload.logger.warn({ code, slug: target.slug, docId: input.docId, retryable, run: previousRuns + 1 }, "Dịch: lần chạy thất bại");
    if (retryable && !lastRun) throw new Error(code);
    await recordFailure(ctx, code);
    if (retryable) throw new Error(code);
    throw new JobCancelledError(TRANSLATION_ERROR_MESSAGES[code]);
  }
}

/** Retry: `attempts` là số lần THỬ LẠI (tổng số lần chạy = attempts + 1), backoff mũ từ 60 giây (≈ 1 phút, 2 phút). */
export const translateContentTask: TaskConfig<"translate-content"> = {
  slug: TRANSLATE_CONTENT_SLUG,
  label: "Dịch nội dung VI → EN bằng AI (Claude API)",
  retries: { attempts: TRANSLATE_CONTENT_MAX_RUNS - 1, backoff: { type: "exponential", delay: 60_000 } },
  inputSchema: [
    { name: "kind", type: "select", required: true, options: ["collection", "global"] },
    { name: "slug", type: "text", required: true },
    { name: "docId", type: "text" },
    { name: "force", type: "checkbox" },
  ],
  outputSchema: [
    { name: "outcome", type: "text", required: true },
    { name: "reason", type: "text" },
    { name: "fields", type: "number" },
  ],
  handler: async ({ input, job, req }) => {
    const outcome = await translateContent({ req, input, previousRuns: job.totalTried ?? 0 });
    // Log chỉ có định danh + kết quả: không nội dung bài, không bản dịch.
    req.payload.logger.info({ slug: input.slug, docId: input.docId, ...outcome }, "Dịch: kết thúc job");
    return { output: { outcome: outcome.outcome, reason: "reason" in outcome ? outcome.reason : undefined, fields: "fields" in outcome ? outcome.fields : undefined } };
  },
};
