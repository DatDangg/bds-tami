import { describe, expect, it } from "vitest";

import { mapProviderError } from "./claude-client";
import { ProviderHttpError } from "./errors";
import { createOpenCodeClient, OPENCODE_GO_BASE_URL } from "./opencode-client";
import { translationConfigFromEnv } from "./translation-service";

/** fetch giả: không chạm mạng; ghi lại request client build. */
function fakeFetch(respond: () => Response) {
  const requests: { url: string; headers: Headers; body: Record<string, unknown> }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return respond();
  }) as typeof globalThis.fetch;
  return { impl, requests };
}

const completion = (content: string | null, finishReason = "stop", cached = 0) =>
  new Response(
    JSON.stringify({
      choices: [{ index: 0, finish_reason: finishReason, message: { role: "assistant", content, reasoning_content: "thinking" } }],
      usage: { prompt_tokens: 100, completion_tokens: 40, prompt_tokens_details: { cached_tokens: cached } },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const request = { model: "deepseek-v4.1-flash", system: "SYS", userContent: '{"segments":[{"id":"s0","text":"Xin chào"}]}' };

describe("createOpenCodeClient (fetch giả)", () => {
  it("gửi đúng endpoint, header (Bearer, User-Agent, session), JSON mode, reasoning low; parse kết quả + usage", async () => {
    const { impl, requests } = fakeFetch(() => completion('{"translations":[{"id":"s0","text":"Hello"}]}', "stop", 30));
    const client = createOpenCodeClient({ apiKey: "oc_sk_FAKE", fetch: impl });
    const result = await client.translate(request);
    const twice = await client.translate(request);

    expect(result).toEqual({
      output: { translations: [{ id: "s0", text: "Hello" }] },
      stopReason: "end_turn",
      usage: { inputTokens: 70, outputTokens: 40, cacheCreationTokens: 0, cacheReadTokens: 30 },
    });
    expect(twice.stopReason).toBe("end_turn");
    const [first, second] = requests;
    expect(first!.url).toBe(`${OPENCODE_GO_BASE_URL}/chat/completions`);
    expect(first!.headers.get("authorization")).toBe("Bearer oc_sk_FAKE");
    expect(first!.headers.get("user-agent")).toBe("tami-translate/1.0");
    expect(first!.headers.get("x-opencode-session")).toMatch(/^tami-translate-/);
    expect(second!.headers.get("x-opencode-session")).toBe(first!.headers.get("x-opencode-session"));
    expect(first!.body).toMatchObject({ model: "deepseek-v4.1-flash", reasoning_effort: "low", response_format: { type: "json_object" } });
    const messages = first!.body.messages as { role: string; content: string }[];
    expect(messages[0]!.role).toBe("system");
    expect(messages[0]!.content.startsWith("SYS")).toBe(true);
    expect(messages[1]).toEqual({ role: "user", content: request.userContent });
  });

  it("finish_reason length → max_tokens, content_filter → refusal, không parse output", async () => {
    const length = await createOpenCodeClient({ apiKey: "k", fetch: fakeFetch(() => completion('{"transl', "length")).impl }).translate(request);
    expect(length).toMatchObject({ output: null, stopReason: "max_tokens" });
    const filtered = await createOpenCodeClient({ apiKey: "k", fetch: fakeFetch(() => completion(null, "content_filter")).impl }).translate(request);
    expect(filtered).toMatchObject({ output: null, stopReason: "refusal" });
  });

  it("JSON hỏng hoặc sai hình dạng → output null (service sẽ báo invalid_output)", async () => {
    const broken = await createOpenCodeClient({ apiKey: "k", fetch: fakeFetch(() => completion("not json")).impl }).translate(request);
    expect(broken.output).toBeNull();
    const wrongShape = await createOpenCodeClient({ apiKey: "k", fetch: fakeFetch(() => completion('{"foo":1}')).impl }).translate(request);
    expect(wrongShape.output).toBeNull();
  });

  it("HTTP lỗi → ProviderHttpError chỉ giữ status, map ra mã cố định (không lộ body)", async () => {
    const client = createOpenCodeClient({ apiKey: "k", fetch: fakeFetch(() => new Response("secret body oc_sk_LEAK", { status: 401 })).impl });
    const error = await client.translate(request).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ProviderHttpError);
    expect(String((error as Error).message)).not.toContain("LEAK");

    expect(mapProviderError(new ProviderHttpError(429)).code).toBe("rate_limited");
    expect(mapProviderError(new ProviderHttpError(401)).code).toBe("auth_failed");
    expect(mapProviderError(new ProviderHttpError(403)).code).toBe("auth_failed");
    expect(mapProviderError(new ProviderHttpError(400)).code).toBe("bad_request");
    expect(mapProviderError(new ProviderHttpError(404)).code).toBe("bad_request");
    expect(mapProviderError(new ProviderHttpError(500)).code).toBe("provider_unavailable");
    expect(mapProviderError(new ProviderHttpError(503)).code).toBe("provider_unavailable");
  });
});

describe("translationConfigFromEnv", () => {
  const base = { ANTHROPIC_API_KEY: "ant", OPENCODE_API_KEY: "oc", TRANSLATION_MODEL: "m", TRANSLATION_MONTHLY_BUDGET_USD: 3 };

  it("opencode-go lấy OPENCODE_API_KEY", () => {
    expect(translationConfigFromEnv({ ...base, TRANSLATION_PROVIDER: "opencode-go" })).toEqual({
      provider: "opencode-go",
      apiKey: "oc",
      model: "m",
      monthlyBudgetUsd: 3,
    });
  });

  it("anthropic lấy ANTHROPIC_API_KEY", () => {
    expect(translationConfigFromEnv({ ...base, TRANSLATION_PROVIDER: "anthropic" }).apiKey).toBe("ant");
  });
});
