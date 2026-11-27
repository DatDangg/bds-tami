import { randomUUID } from "node:crypto";

import { MAX_OUTPUT_TOKENS, modelOutputSchema, type ModelOutput, type TranslationClient } from "./claude-client";
import { ProviderHttpError } from "./errors";

/** OpenCode Go: endpoint chat completions kiểu OpenAI (xác minh 2026-11-27 qua `GET https://opencode.ai/inference/go/v1/models`). */
export const OPENCODE_GO_BASE_URL = "https://opencode.ai/inference/go/openai/v1";
/** OpenCode yêu cầu client tự định danh bằng User-Agent riêng. */
const USER_AGENT = "tami-translate/1.0";
/** Một lô dịch hiếm khi quá vài chục giây; treo lâu hơn thì coi như provider lỗi tạm thời (job tự thử lại). */
const REQUEST_TIMEOUT_MS = 180_000;

export interface OpenCodeClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Chỉ để test (fetch giả, không mạng). */
  fetch?: typeof globalThis.fetch;
}

interface ChatCompletionResponse {
  choices?: { finish_reason?: string | null; message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } | null };
}

/** `finish_reason` kiểu OpenAI → `stop_reason` kiểu Claude mà service đang hiểu. */
function toStopReason(finishReason: string | null | undefined): string | null {
  if (finishReason === "stop") return "end_turn";
  if (finishReason === "length") return "max_tokens";
  if (finishReason === "content_filter") return "refusal";
  return finishReason ?? null;
}

function parseModelOutput(text: string | null | undefined): ModelOutput | null {
  if (!text) return null;
  try {
    const parsed = modelOutputSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Client OpenCode Go (vd `deepseek-v4.1-flash`), cùng giao diện `TranslationClient` với client Claude. Chỉ chạy phía server.
 * JSON mode (`response_format: json_object`); hình dạng `{translations:[{id,text}]}` nêu trong system prompt và vẫn được service kiểm lại.
 * `reasoning_effort: low`: model suy luận mặc định tốn phần lớn token đầu ra cho reasoning, dịch theo đoạn không cần.
 * `x-opencode-session` ổn định cho một client (một lần dịch): Go chặn request không có session ID.
 */
export function createOpenCodeClient(options: OpenCodeClientOptions): TranslationClient {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl ?? OPENCODE_GO_BASE_URL;
  const sessionId = `tami-translate-${randomUUID()}`;
  return {
    async translate(request) {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
          "x-opencode-session": sessionId,
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: MAX_OUTPUT_TOKENS,
          reasoning_effort: "low",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `${request.system}\n\nReply with ONLY a JSON object: {"translations":[{"id":"<segment id>","text":"<English text>"}]}.` },
            { role: "user", content: request.userContent },
          ],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new ProviderHttpError(response.status);
      const body = (await response.json()) as ChatCompletionResponse;
      const choice = body.choices?.[0];
      const stopReason = toStopReason(choice?.finish_reason);
      const promptTokens = body.usage?.prompt_tokens ?? 0;
      const cacheReadTokens = body.usage?.prompt_tokens_details?.cached_tokens ?? 0;
      return {
        output: stopReason === "end_turn" ? parseModelOutput(choice?.message?.content) : null,
        stopReason,
        usage: {
          inputTokens: Math.max(0, promptTokens - cacheReadTokens),
          outputTokens: body.usage?.completion_tokens ?? 0,
          cacheCreationTokens: 0,
          cacheReadTokens,
        },
      };
    },
  };
}
