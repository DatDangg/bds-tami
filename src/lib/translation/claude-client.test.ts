import { describe, expect, it } from "vitest";

import type { Payload } from "payload";
import { vi } from "vitest";

import { createAnthropicClient, mapProviderError, type ClientResponse } from "./claude-client";
import { createTranslationService } from "./translation-service";
import { TranslationError } from "./errors";

/** fetch giả: không bao giờ chạm mạng; ghi lại request đã build bởi SDK thật. */
function fakeFetch(respond: () => Response) {
  const requests: { url: string; headers: Headers; body: Record<string, unknown> }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return respond();
  }) as typeof globalThis.fetch;
  return { impl, requests };
}

const messageResponse = (text: string, stopReason = "end_turn") =>
  new Response(
    JSON.stringify({
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: "claude-opus-5-5",
      content: [{ type: "text", text }],
      stop_reason: stopReason,
      stop_sequence: null,
      usage: { input_tokens: 120, output_tokens: 34, cache_creation_input_tokens: 5, cache_read_input_tokens: 7 },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const errorResponse = (status: number, message: string) =>
  new Response(JSON.stringify({ type: "error", error: { type: "api_error", message } }), { status, headers: { "content-type": "application/json" } });

const news = { kind: "collection", slug: "news" } as const;

/** Service thật + client trả đúng response đã lấy qua SDK thật, DB giả đếm số lần ghi chi phí. */
function serviceWith(response: ClientResponse) {
  const execute = vi.fn(async (): Promise<unknown> => ({ rows: [] }));
  const payload = { find: vi.fn(async () => ({ docs: [] })), findGlobal: vi.fn(async () => ({})), db: { drizzle: { execute } } } as unknown as Payload;
  const service = createTranslationService({
    payload,
    client: { translate: async () => response },
    config: { apiKey: "k", model: "claude-opus-5-5", monthlyBudgetUsd: 10 },
    glossary: [],
  });
  return { service, execute };
}

const request = { model: "claude-opus-5-5", system: "SYS", userContent: '{"segments":[]}' };

describe("createAnthropicClient (SDK thật, fetch giả)", () => {
  it("gửi đúng tham số: model, max_tokens, system, JSON schema; không temperature/thinking/tool_choice/prefill; khoá ở header", async () => {
    const { impl, requests } = fakeFetch(() => messageResponse('{"translations":[{"id":"s0","text":"Hello"}]}'));
    const client = createAnthropicClient({ apiKey: "sk-ant-test-FAKE", fetch: impl, maxRetries: 0 });
    const result = await client.translate(request);
    expect(result).toEqual({
      output: { translations: [{ id: "s0", text: "Hello" }] },
      stopReason: "end_turn",
      usage: { inputTokens: 120, outputTokens: 34, cacheCreationTokens: 5, cacheReadTokens: 7 },
    });
    const sent = requests[0]!;
    expect(sent.url).toContain("/v1/messages");
    expect(sent.headers.get("x-api-key")).toBe("sk-ant-test-FAKE");
    expect(sent.body).toMatchObject({ model: "claude-opus-5-5", max_tokens: 16_000, system: "SYS", messages: [{ role: "user", content: '{"segments":[]}' }] });
    expect(sent.body).not.toHaveProperty("temperature");
    expect(sent.body).not.toHaveProperty("thinking");
    expect(sent.body).not.toHaveProperty("tool_choice");
    expect(sent.body).not.toHaveProperty("stream");
    expect((sent.body.messages as unknown[]).length).toBe(1);
    expect(JSON.stringify((sent.body as { output_config: unknown }).output_config)).toContain("translations");
  });

  it("khoá shape output_config: chỉ { format: { type: json_schema, schema } }, schema đòi translations[{id,text}] và không cho trường thừa (MINOR-C)", async () => {
    const { impl, requests } = fakeFetch(() => messageResponse('{"translations":[]}'));
    await createAnthropicClient({ apiKey: "k", fetch: impl, maxRetries: 0 }).translate(request);
    const outputConfig = structuredClone((requests[0]!.body as { output_config: { format: { schema: Record<string, unknown> } } }).output_config);
    // `description` ở gốc schema là ghi chú do SDK/zod tự sinh (không thuộc hợp đồng với API): bỏ ra khỏi phép so.
    delete outputConfig.format.schema.description;
    expect(outputConfig).toEqual({
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            translations: {
              type: "array",
              items: { type: "object", properties: { id: { type: "string" }, text: { type: "string" } }, required: ["id", "text"], additionalProperties: false },
            },
          },
          required: ["translations"],
          additionalProperties: false,
        },
      },
    });
  });

  const usage = { inputTokens: 120, outputTokens: 34, cacheCreationTokens: 5, cacheReadTokens: 7 };
  const run = (text: string, stopReason: string) =>
    createAnthropicClient({ apiKey: "k", fetch: fakeFetch(() => messageResponse(text, stopReason)).impl, maxRetries: 0 }).translate(request);

  it("(a) max_tokens + JSON cắt cụt -> KHÔNG ném, trả usage + stopReason, output null; service ghi chi phí rồi ném truncated", async () => {
    const response = await run('{"translations":[{"id":"s0","text":"Hel', "max_tokens");
    expect(response).toEqual({ output: null, stopReason: "max_tokens", usage });
    const { service, execute } = serviceWith(response);
    await expect(service.translate({ target: news, items: [{ key: "t", kind: "text", value: "a" }] })).rejects.toMatchObject({ code: "truncated" });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("(b) refusal + text thường -> trả usage, service ghi chi phí rồi ném refused", async () => {
    const response = await run("Tôi không thể giúp việc này.", "refusal");
    expect(response).toEqual({ output: null, stopReason: "refusal", usage });
    const { service, execute } = serviceWith(response);
    await expect(service.translate({ target: news, items: [{ key: "t", kind: "text", value: "a" }] })).rejects.toMatchObject({ code: "refused" });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("(c) end_turn + JSON sai schema / không phải JSON -> output null, service ghi chi phí rồi ném invalid_output", async () => {
    for (const text of ['{"nope":1}', "không phải json"]) {
      const response = await run(text, "end_turn");
      expect(response).toEqual({ output: null, stopReason: "end_turn", usage });
      const { service, execute } = serviceWith(response);
      await expect(service.translate({ target: news, items: [{ key: "t", kind: "text", value: "a" }] })).rejects.toMatchObject({ code: "invalid_output" });
      expect(execute).toHaveBeenCalledTimes(1);
    }
  });

  it("HTTP 429/401/403/400/404/500/529 -> mã cố định, thông điệp provider (chứa khoá giả) không lọt ra", async () => {
    const secret = "sk-ant-api03-LEAK-999";
    const expected: [number, string][] = [[429, "rate_limited"], [401, "auth_failed"], [403, "auth_failed"], [400, "bad_request"], [404, "bad_request"], [500, "provider_unavailable"], [529, "provider_unavailable"]];
    for (const [status, code] of expected) {
      const { impl } = fakeFetch(() => errorResponse(status, `bad key ${secret}`));
      const client = createAnthropicClient({ apiKey: secret, fetch: impl, maxRetries: 0 });
      const mapped = mapProviderError(await client.translate(request).catch((error: unknown) => error));
      expect(mapped).toBeInstanceOf(TranslationError);
      expect(mapped.code).toBe(code);
      expect(`${mapped.message} ${JSON.stringify(mapped)} ${mapped.stack}`).not.toContain(secret);
    }
  });

  it("lỗi mạng -> provider_unavailable", async () => {
    const impl = (async () => {
      throw new TypeError("fetch failed https://api.anthropic.com");
    }) as typeof globalThis.fetch;
    const client = createAnthropicClient({ apiKey: "k", fetch: impl, maxRetries: 0 });
    const mapped = mapProviderError(await client.translate(request).catch((error: unknown) => error));
    expect(mapped.code).toBe("provider_unavailable");
    expect(mapped.message).not.toContain("anthropic.com");
  });
});
