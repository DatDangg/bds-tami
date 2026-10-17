import type { ModelOutput } from "./claude-client";
import { TranslationError } from "./errors";
import { applyTextNodes, extractTextNodes, isLexicalRoot, type LexicalRoot } from "./lexical";

/** Một trường cần dịch: chuỗi thuần (text/textarea) hoặc richText Lexical. `key` do bên gọi đặt (thường là tên trường). */
export type TranslationItem =
  | { key: string; kind: "text"; value: string }
  | { key: string; kind: "richText"; value: LexicalRoot };

export type TranslatedValue = string | LexicalRoot;

/** Đoạn chữ gửi đi: `text` đã bỏ khoảng trắng đầu/cuối; khoảng trắng đó được trả lại nguyên văn sau khi dịch. */
export interface Segment {
  id: string;
  text: string;
  leading: string;
  trailing: string;
}

export interface TranslationPlan {
  segments: Segment[];
  assemble(translatedTexts: readonly string[]): Record<string, TranslatedValue>;
}

const MAX_TOTAL_CHARS = 60_000;
const HTML_TAG_PATTERN = /<\/?[a-z!][^>]*>/i;
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s)\]]+/gi;

function splitEdges(raw: string): { leading: string; core: string; trailing: string } {
  const core = raw.trim();
  if (core === "") return { leading: raw, core, trailing: "" };
  const start = raw.indexOf(core);
  return { leading: raw.slice(0, start), core, trailing: raw.slice(start + core.length) };
}

interface ItemPlan {
  key: string;
  rebuild(translatedAt: (segmentIndex: number) => string): TranslatedValue;
}

function planText(key: string, value: string, segments: Segment[]): ItemPlan {
  const edges = splitEdges(value);
  if (edges.core === "") return { key, rebuild: () => value };
  const segmentIndex = segments.length;
  segments.push({ id: `s${segmentIndex}`, text: edges.core, leading: edges.leading, trailing: edges.trailing });
  return { key, rebuild: (translated) => edges.leading + translated(segmentIndex) + edges.trailing };
}

function planRichText(key: string, value: LexicalRoot, segments: Segment[]): ItemPlan {
  const nodeTexts = extractTextNodes(value);
  const nodeSegment = nodeTexts.map((raw) => {
    const edges = splitEdges(raw);
    if (edges.core === "") return undefined;
    segments.push({ id: `s${segments.length}`, text: edges.core, leading: edges.leading, trailing: edges.trailing });
    return segments.length - 1;
  });
  return {
    key,
    rebuild: (translated) =>
      applyTextNodes(
        value,
        nodeTexts.map((raw, nodeIndex) => {
          const segmentIndex = nodeSegment[nodeIndex];
          if (segmentIndex === undefined) return raw;
          const segment = segments[segmentIndex]!;
          return segment.leading + translated(segmentIndex) + segment.trailing;
        }),
      ),
  };
}

/** Gom mọi trường thành danh sách đoạn chữ phẳng (một lần gọi API) và hàm ghép kết quả về đúng cấu trúc từng trường. */
export function planItems(items: readonly TranslationItem[]): TranslationPlan {
  const keys = new Set<string>();
  const segments: Segment[] = [];
  const plans = items.map((item) => {
    if (keys.has(item.key)) throw new TranslationError("invalid_input");
    keys.add(item.key);
    if (item.kind === "text") {
      if (typeof item.value !== "string") throw new TranslationError("invalid_input");
      return planText(item.key, item.value, segments);
    }
    if (!isLexicalRoot(item.value)) throw new TranslationError("invalid_input");
    return planRichText(item.key, item.value, segments);
  });
  if (segments.reduce((sum, segment) => sum + segment.text.length, 0) > MAX_TOTAL_CHARS) {
    throw new TranslationError("invalid_input");
  }
  return {
    segments,
    assemble(translatedTexts) {
      const lookup = (segmentIndex: number) => translatedTexts[segmentIndex]!;
      return Object.fromEntries(plans.map((plan) => [plan.key, plan.rebuild(lookup)]));
    },
  };
}

/** Model chèn URL, markdown link hoặc `<`/`>` mà đoạn nguồn không có (dấu hiệu prompt injection trong nội dung bài). */
function hasInjectedLink(source: string, translated: string): boolean {
  const sourceUrls = new Set(source.match(URL_PATTERN) ?? []);
  if ((translated.match(URL_PATTERN) ?? []).some((url) => !sourceUrls.has(url))) return true;
  if (translated.includes("](") && !source.includes("](")) return true;
  return (translated.includes("<") && !source.includes("<")) || (translated.includes(">") && !source.includes(">"));
}

/**
 * Kiểm lại kết quả model (không tin model): đủ và đúng từng `id`, mỗi đoạn là chuỗi không rỗng, không HTML (nếu nguồn
 * không có), không xuống dòng thêm vào đoạn nguồn một dòng, không dài bất thường. Trả danh sách đã sắp theo `segments`.
 */
export function validateModelOutput(segments: readonly Segment[], output: ModelOutput | null): string[] {
  if (output === null || output.translations.length !== segments.length) throw new TranslationError("invalid_output");
  const byId = new Map<string, string>();
  for (const entry of output.translations) {
    if (byId.has(entry.id)) throw new TranslationError("invalid_output");
    byId.set(entry.id, entry.text);
  }
  return segments.map((segment) => {
    const translated = byId.get(segment.id)?.trim();
    if (translated === undefined || translated === "") throw new TranslationError("invalid_output");
    if (HTML_TAG_PATTERN.test(translated) && !HTML_TAG_PATTERN.test(segment.text)) throw new TranslationError("invalid_output");
    if (translated.includes("\n") && !segment.text.includes("\n")) throw new TranslationError("invalid_output");
    if (hasInjectedLink(segment.text, translated)) throw new TranslationError("invalid_output");
    if (translated.length > segment.text.length * 6 + 200) throw new TranslationError("invalid_output");
    return translated;
  });
}

/**
 * Chia lô để đầu ra (EN + vỏ JSON) luôn nằm trong `max_tokens`. Công thức bảo thủ, mỗi đoạn tốn
 * `ceil(ký tự / CHARS_PER_OUTPUT_TOKEN) + TOKENS_PER_SEGMENT_OVERHEAD` token đầu ra (tiếng Việt có dấu ~2-3 ký tự/token,
 * bản EN ngắn hơn nên 2 là mức dư; vỏ `{"id":"s12","text":""}` ~15 token, lấy 30). Tổng mỗi lô ≤ `OUTPUT_TOKEN_BUDGET_PER_BATCH`
 * (75% của 16.000, chừa dư cho sai số ước lượng). Đoạn đơn lẻ quá lớn không tách được -> `invalid_input`.
 */
export const CHARS_PER_OUTPUT_TOKEN = 2;
export const TOKENS_PER_SEGMENT_OVERHEAD = 30;
export const OUTPUT_TOKEN_BUDGET_PER_BATCH = 12_000;

export function estimateOutputTokens(segment: Segment): number {
  return Math.ceil(segment.text.length / CHARS_PER_OUTPUT_TOKEN) + TOKENS_PER_SEGMENT_OVERHEAD;
}

export function splitIntoBatches(segments: readonly Segment[]): Segment[][] {
  const batches: Segment[][] = [];
  let current: Segment[] = [];
  let currentTokens = 0;
  for (const segment of segments) {
    const tokens = estimateOutputTokens(segment);
    if (tokens > OUTPUT_TOKEN_BUDGET_PER_BATCH) throw new TranslationError("invalid_input");
    if (currentTokens + tokens > OUTPUT_TOKEN_BUDGET_PER_BATCH) {
      batches.push(current);
      current = [];
      currentTokens = 0;
    }
    current.push(segment);
    currentTokens += tokens;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}
