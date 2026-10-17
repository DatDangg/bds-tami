import type { ClientRequest, ClientResponse, TranslationClient } from "./claude-client";
import type { LexicalRoot } from "./lexical";

/** Lexical nhiều loại node: heading, đoạn có chữ đậm, link (url), list, linebreak, ảnh upload, đoạn rỗng. */
export function sampleLexical(): LexicalRoot {
  return {
    root: {
      type: "root",
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
      children: [
        { type: "heading", tag: "h2", version: 1, children: [{ type: "text", text: "Giới thiệu dự án", format: 0, mode: "normal", style: "", detail: 0, version: 1 }] },
        {
          type: "paragraph",
          version: 1,
          children: [
            { type: "text", text: "Căn hộ ", format: 0, mode: "normal", style: "", detail: 0, version: 1 },
            { type: "text", text: "TAMI HOMES", format: 1, mode: "normal", style: "", detail: 0, version: 1 },
            { type: "linebreak", version: 1 },
            { type: "link", version: 1, fields: { linkType: "custom", url: "https://tami.example/lien-he", newTab: true }, children: [{ type: "text", text: "Liên hệ", format: 2, mode: "normal", style: "", detail: 0, version: 1 }] },
          ],
        },
        {
          type: "list",
          listType: "bullet",
          tag: "ul",
          version: 1,
          children: [{ type: "listitem", value: 1, version: 1, children: [{ type: "text", text: "  Gần trung tâm  ", format: 0, mode: "normal", style: "", detail: 0, version: 1 }] }],
        },
        { type: "upload", relationTo: "media", value: { id: "m1" }, fields: null, version: 1 },
        { type: "paragraph", version: 1, children: [] },
      ],
    },
  };
}

/** Client giả: ghi lại request, trả đúng bản dịch "EN:<text>" cho từng đoạn (trừ khi test ghi đè `respond`). */
export function fakeClient(respond?: (request: ClientRequest) => ClientResponse | Promise<ClientResponse>) {
  const calls: ClientRequest[] = [];
  const client: TranslationClient = {
    async translate(request) {
      calls.push(request);
      if (respond) return respond(request);
      return echoResponse(request);
    },
  };
  return { client, calls };
}

export const ZERO_USAGE = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };

export function echoResponse(request: ClientRequest, overrides: Partial<ClientResponse> = {}): ClientResponse {
  const { segments } = JSON.parse(request.userContent) as { segments: { id: string; text: string }[] };
  return {
    output: { translations: segments.map((segment) => ({ id: segment.id, text: `EN:${segment.text}` })) },
    stopReason: "end_turn",
    usage: { inputTokens: 1000, outputTokens: 500, cacheCreationTokens: 0, cacheReadTokens: 0 },
    ...overrides,
  };
}
