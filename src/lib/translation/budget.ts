import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { TranslationError } from "./errors";

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface UsageForCost {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

// Nguồn: Anthropic pricing, skill claude-api cache 2026-10-06; kiểm lại trước khi đặt budget production.
/** Giá ước tính, USD cho 1 triệu token (input/output). Chỉ để tính hạn mức, không phải hoá đơn. Haiku 5.5: giá cho prompt ≤ 100K token. */
export const MODEL_PRICES_USD_PER_MILLION = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
} as const satisfies Record<string, { input: number; output: number }>;

/** Model không có trong bảng: lấy mức cao nhất của từng chiều, để hạn mức không bị vượt âm thầm (thà dừng sớm). */
const CONSERVATIVE_PRICE = {
  input: Math.max(...Object.values(MODEL_PRICES_USD_PER_MILLION).map((price) => price.input)),
  output: Math.max(...Object.values(MODEL_PRICES_USD_PER_MILLION).map((price) => price.output)),
};

const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

export function isPricedModel(model: string): model is keyof typeof MODEL_PRICES_USD_PER_MILLION {
  return Object.hasOwn(MODEL_PRICES_USD_PER_MILLION, model);
}

/** Chi phí ước tính (USD, làm tròn 6 chữ số) của một lần gọi từ `response.usage`. */
export function estimateCostUsd(model: string, usage: UsageForCost): number {
  const price = isPricedModel(model) ? MODEL_PRICES_USD_PER_MILLION[model] : CONSERVATIVE_PRICE;
  const inputEquivalent =
    usage.inputTokens + usage.cacheCreationTokens * CACHE_WRITE_MULTIPLIER + usage.cacheReadTokens * CACHE_READ_MULTIPLIER;
  const cost = (inputEquivalent * price.input + usage.outputTokens * price.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/** Tháng tính hạn mức theo UTC (cùng chu kỳ tính phí của provider), dạng `YYYY-MM`. */
export function monthKey(now: Date): string {
  return now.toISOString().slice(0, 7);
}

/**
 * Chi phí ước tính đã dùng trong tháng. Chưa có dòng = 0.
 * Hạn mức kiểm TRƯỚC khi gọi: đã chạm/vượt (`>=`) thì dừng. Hạn mức 0 nghĩa là tắt dịch. Một lần gọi đang bay có thể
 * vượt hạn mức một chút (tối đa chi phí của 1 lần gọi, bị chặn bởi `max_tokens`); nhiều lần gọi song song cũng vậy.
 */
export async function assertWithinBudget(payload: Payload, month: string, budgetUsd: number): Promise<void> {
  const { docs } = await payload.find({
    collection: "translation-usage",
    where: { month: { equals: month } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const spent = docs[0]?.estimatedCostUsd ?? 0;
  if (spent >= budgetUsd) throw new TranslationError("budget_exceeded");
}

/**
 * Cộng dồn một lần gọi vào dòng của tháng bằng MỘT câu `INSERT ... ON CONFLICT (month) DO UPDATE SET x = x + EXCLUDED.x`.
 * Lý do không dùng find rồi update của Payload: hai job chạy song song cùng đọc giá trị cũ rồi ghi đè nhau (mất một lần
 * cộng) hoặc cùng thấy chưa có dòng rồi vi phạm unique. Một câu SQL nguyên tử dựa vào unique index của `month` nên luôn
 * cộng đúng. Chạy trên pool, không nằm trong transaction của bên gọi: tiền đã tiêu thì phải ghi nhận dù bên gọi rollback.
 */
export async function recordUsage(payload: Payload, month: string, usage: UsageForCost, costUsd: number): Promise<void> {
  const inputTokens = usage.inputTokens + usage.cacheCreationTokens + usage.cacheReadTokens;
  const adapter = payload.db as unknown as PostgresAdapter;
  await adapter.drizzle.execute(sql`
    INSERT INTO translation_usage (month, input_tokens, output_tokens, requests, estimated_cost_usd)
    VALUES (${month}, ${inputTokens}, ${usage.outputTokens}, 1, ${costUsd})
    ON CONFLICT (month) DO UPDATE SET
      input_tokens = translation_usage.input_tokens + EXCLUDED.input_tokens,
      output_tokens = translation_usage.output_tokens + EXCLUDED.output_tokens,
      requests = translation_usage.requests + 1,
      estimated_cost_usd = translation_usage.estimated_cost_usd + EXCLUDED.estimated_cost_usd,
      updated_at = now()
  `);
}

const budgetAlertKey = (month: string) => `translation-budget-alert:${month}`;

/**
 * Giành quyền gửi email "vượt hạn mức" của tháng: `INSERT ... ON CONFLICT (key) DO NOTHING` trên `payload_kv` (unique `key`) nên đúng MỘT bên thắng dù
 * nhiều job chạy song song. Trả `true` = bên gọi được gửi. Không cần bảng/cột mới; chạy trên pool như `recordUsage`.
 */
export async function claimBudgetAlert(payload: Payload, month: string): Promise<boolean> {
  const adapter = payload.db as unknown as PostgresAdapter;
  const result = await adapter.drizzle.execute(sql`
    INSERT INTO payload_kv ("key", "data") VALUES (${budgetAlertKey(month)}, '{}'::jsonb)
    ON CONFLICT ("key") DO NOTHING
    RETURNING "id"
  `);
  return result.rows.length > 0;
}

/** Nhả quyền gửi khi việc xếp email thất bại, để lần chạm hạn mức sau còn thử lại được. */
export async function releaseBudgetAlert(payload: Payload, month: string): Promise<void> {
  const adapter = payload.db as unknown as PostgresAdapter;
  await adapter.drizzle.execute(sql`DELETE FROM payload_kv WHERE "key" = ${budgetAlertKey(month)}`);
}
