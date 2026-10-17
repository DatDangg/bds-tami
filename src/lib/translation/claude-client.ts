import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { TranslationError } from "./errors";

/** Số token tối đa model được sinh mỗi lần (non-streaming): đủ cho một bài dài, và là mức chặn trên của chi phí một lần gọi. */
export const MAX_OUTPUT_TOKENS = 16_000;

/** Hình dạng JSON model phải trả; vẫn được `validateModelOutput` kiểm lại (không tin model). */
export const modelOutputSchema = z.object({
  translations: z.array(z.object({ id: z.string(), text: z.string() })),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export interface ClientRequest {
  model: string;
  system: string;
  userContent: string;
}

export interface ClientResponse {
  output: ModelOutput | null;
  stopReason: string | null;
  usage: TokenUsage;
}

/** Ranh giới mỏng quanh SDK: service chỉ biết giao diện này nên test thay được bằng bản giả, không chạm mạng. */
export interface TranslationClient {
  translate(request: ClientRequest): Promise<ClientResponse>;
}

export interface AnthropicClientOptions {
  apiKey: string;
  /** Chỉ để test (fetch giả, không mạng). */
  fetch?: typeof globalThis.fetch;
  /** SDK mặc định tự thử lại 2 lần với 429/5xx/lỗi mạng; test đặt 0 cho nhanh. */
  maxRetries?: number;
}

function parseModelOutput(content: readonly { type: string; text?: string }[]): ModelOutput | null {
  const text = content.flatMap((block) => (block.type === "text" && typeof block.text === "string" ? [block.text] : [])).join("");
  try {
    const parsed = modelOutputSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Client Claude API (chỉ chạy phía server; khoá không bao giờ vào bundle trình duyệt hay log).
 * Không dùng: assistant prefill, `tool_choice` ép buộc, `temperature`, `thinking` (đều bị model mới từ chối 400).
 * Không đặt `output_config.effort`: không phải model nào trong bảng giá cũng chấp nhận tham số này (Haiku 4.5), mà tác vụ
 * dịch theo đoạn đã được ràng buộc chặt bằng schema nên không cần.
 */
export function createAnthropicClient(options: AnthropicClientOptions): TranslationClient {
  const anthropic = new Anthropic({ apiKey: options.apiKey, fetch: options.fetch, maxRetries: options.maxRetries });
  return {
    async translate(request) {
      // `messages.create` (không phải `.parse`): `.parse` ném lỗi khi JSON hỏng TRƯỚC khi trả `usage`/`stop_reason`, nên lần
      // gọi đã tính tiền (bị cắt `max_tokens`, bị từ chối) sẽ không được ghi vào hạn mức. Schema vẫn lấy từ
      // `zodOutputFormat` (SDK ghi rõ: truyền thẳng vào `.create()` được, chỉ không tự parse); bỏ hàm `parse` đi kèm.
      const { type, schema } = zodOutputFormat(modelOutputSchema);
      const response = await anthropic.messages.create({
        model: request.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: request.system,
        messages: [{ role: "user", content: request.userContent }],
        output_config: { format: { type, schema } },
      });
      const stopReason = response.stop_reason;
      return {
        // Chỉ parse khi hoàn tất bình thường (cắt cụt/từ chối thì text không phải JSON đầy đủ). Hỏng -> null: service ghi chi phí rồi mới ném.
        output: stopReason === "end_turn" ? parseModelOutput(response.content) : null,
        stopReason,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
          cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        },
      };
    },
  };
}

/**
 * Đổi MỌI lỗi từ provider thành `TranslationError` mã cố định. Giá trị này là thứ duy nhất được ghi vào
 * `translation.lastError`: bỏ hẳn message/stack/header/body gốc (có thể chứa khoá API, endpoint, nội dung bài).
 * Cụ thể trước, chung sau (`RateLimitError` v.v. đều kế thừa `APIError`).
 */
export function mapProviderError(error: unknown): TranslationError {
  if (error instanceof TranslationError) return error;
  if (error instanceof Anthropic.RateLimitError) return new TranslationError("rate_limited");
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new TranslationError("auth_failed");
  }
  if (
    error instanceof Anthropic.BadRequestError ||
    error instanceof Anthropic.NotFoundError ||
    error instanceof Anthropic.UnprocessableEntityError
  ) {
    return new TranslationError("bad_request");
  }
  if (error instanceof SyntaxError || error instanceof z.ZodError) return new TranslationError("invalid_output");
  // Lỗi SDK thường (không phải APIError): client này không còn dùng `.parse` nên hiếm, giữ để an toàn.
  if (error instanceof Anthropic.AnthropicError && !(error instanceof Anthropic.APIError)) return new TranslationError("invalid_output");
  // APIConnectionError (gồm timeout), InternalServerError, 529 overloaded, mọi APIError khác và lỗi lạ.
  return new TranslationError("provider_unavailable");
}
