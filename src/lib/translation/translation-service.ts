import type { Logger } from "pino";
import type { Payload } from "payload";

import { EnvValidationError, parseTranslationEnv } from "../env";
import { logger as appLogger } from "../logger";
import { assertTranslatable, type TranslationTarget } from "./allowlist";
import { assertWithinBudget, estimateCostUsd, isPricedModel, monthKey, recordUsage } from "./budget";
import { createAnthropicClient, mapProviderError, type TranslationClient } from "./claude-client";
import { TranslationError } from "./errors";
import { buildSystemPrompt, buildUserContent, type GlossaryEntry, loadGlossary } from "./prompt";
import { planItems, type Segment, splitIntoBatches, type TranslatedValue, type TranslationItem, validateModelOutput } from "./segments";

export interface TranslationConfig {
  /** Thiếu = dịch trả `not_configured`, app vẫn chạy. */
  apiKey?: string;
  model: string;
  monthlyBudgetUsd: number;
}

export interface TranslationServiceDeps {
  payload: Payload;
  /** Mặc định đọc từ env (`ANTHROPIC_API_KEY`, `TRANSLATION_MODEL`, `TRANSLATION_MONTHLY_BUDGET_USD`). */
  config?: TranslationConfig;
  /** Mặc định tạo client Claude API lười, chỉ sau khi qua allowlist + hạn mức. Test truyền bản giả. */
  client?: TranslationClient;
  /** Mặc định đọc `site-settings.translationGlossary`. */
  glossary?: readonly GlossaryEntry[];
  logger?: Logger;
  now?: () => Date;
}

export interface TranslationRequest {
  target: TranslationTarget;
  items: readonly TranslationItem[];
}

export interface TranslationResult {
  values: Record<string, TranslatedValue>;
  /** Giá trị cho `translation.model`. */
  model: string;
  costUsd: number;
}

function readConfigFromEnv(): TranslationConfig {
  const env = parseTranslationEnv(process.env);
  return { apiKey: env.ANTHROPIC_API_KEY, model: env.TRANSLATION_MODEL, monthlyBudgetUsd: env.TRANSLATION_MONTHLY_BUDGET_USD };
}

/** Chỉ `end_turn` là kết quả đầy đủ; cắt cụt hoặc bị từ chối thì không lưu gì. */
function assertCompleted(stopReason: string | null): void {
  if (stopReason === "end_turn") return;
  if (stopReason === "refusal") throw new TranslationError("refused");
  if (stopReason === "max_tokens" || stopReason === "model_context_window_exceeded") throw new TranslationError("truncated");
  throw new TranslationError("invalid_output");
}

/**
 * Dịch VI -> EN phía server (BR-08, D7). Thứ tự bắt buộc: allowlist -> kiểm cấu trúc đầu vào -> cấu hình -> hạn mức tháng
 * -> chia lô theo trần đầu ra -> mỗi lô: hạn mức, gọi API, ghi nhận chi phí, kiểm lại kết quả. Mọi lỗi ra ngoài đều là `TranslationError` mã cố
 * định (xem `errors.ts`); chỉ mã đó được phép ghi vào `translation.lastError`. Không log nội dung bài.
 */
export function createTranslationService(deps: TranslationServiceDeps) {
  const { payload } = deps;
  const log = (deps.logger ?? appLogger).child({ component: "translation" });
  const now = deps.now ?? (() => new Date());

  /** Một lô = một request API: kiểm hạn mức -> gọi -> ghi chi phí (mọi nhánh đã có response) -> mới kiểm kết quả. */
  async function translateBatch(batch: Segment[], config: TranslationConfig, month: string, system: string, client: TranslationClient) {
    await assertWithinBudget(payload, month, config.monthlyBudgetUsd);
    const response = await client.translate({ model: config.model, system, userContent: buildUserContent(batch) }).catch((error: unknown) => {
      // Lỗi HTTP/mạng: chưa có usage nên không có gì để ghi.
      const mapped = mapProviderError(error);
      log.error({ code: mapped.code, model: config.model }, "Translation: gọi API thất bại");
      throw mapped;
    });

    const costUsd = estimateCostUsd(config.model, response.usage);
    await recordUsage(payload, month, response.usage, costUsd).catch((error: unknown) => {
      // Dịch đã trả tiền: không ném lỗi (job thử lại sẽ trả tiền lần nữa), nhưng phải để lại dấu vết.
      log.error({ err: error instanceof Error ? error.name : "unknown", month }, "Translation: không ghi nhận được mức dùng");
    });
    log.info(
      { model: config.model, segments: batch.length, inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens, costUsd },
      "Translation: đã dịch",
    );

    assertCompleted(response.stopReason);
    return { texts: validateModelOutput(batch, response.output), costUsd };
  }

  async function translateUnwrapped(request: TranslationRequest): Promise<TranslationResult> {
    assertTranslatable(request.target);
    const plan = planItems(request.items);
    const config = deps.config ?? readConfigFromEnv();
    if (plan.segments.length === 0) return { values: plan.assemble([]), model: config.model, costUsd: 0 };
    if (!deps.client && !config.apiKey) throw new TranslationError("not_configured");
    const batches = splitIntoBatches(plan.segments);

    const month = monthKey(now());
    if (!isPricedModel(config.model)) log.warn({ model: config.model }, "Model dịch không có trong bảng giá, tính theo mức cao nhất");

    const system = buildSystemPrompt(deps.glossary ?? (await loadGlossary(payload)));
    const client = deps.client ?? createAnthropicClient({ apiKey: config.apiKey! });
    const translatedTexts: string[] = [];
    let costUsd = 0;
    for (const batch of batches) {
      const result = await translateBatch(batch, config, month, system, client);
      translatedTexts.push(...result.texts);
      costUsd += result.costUsd;
    }
    return { values: plan.assemble(translatedTexts), model: config.model, costUsd: Math.round(costUsd * 1_000_000) / 1_000_000 };
  }

  /** Lỗi không phải `TranslationError` (DB, env hỏng) bị che thành mã cố định, không để message gốc lọt ra. */
  async function translate(request: TranslationRequest): Promise<TranslationResult> {
    try {
      return await translateUnwrapped(request);
    } catch (error) {
      if (error instanceof TranslationError) throw error;
      log.error({ err: error instanceof Error ? error.name : "unknown" }, "Translation: lỗi nội bộ (DB/cấu hình)");
      throw new TranslationError(error instanceof EnvValidationError ? "not_configured" : "provider_unavailable");
    }
  }

  return { translate };
}

export type TranslationService = ReturnType<typeof createTranslationService>;
