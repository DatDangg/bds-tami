/** Cây chuỗi giao diện (cùng dạng `vi.json` / `en.json`). */
export interface MessageTree {
  [key: string]: string | MessageTree;
}

export interface MessagesCheckResult {
  /** Khoá có ở `vi` mà thiếu ở `en` (chuỗi EN chưa dịch: UI sẽ hiện khoá thô). */
  missingInEn: string[];
  /** Khoá có ở `en` mà không có ở `vi` (khoá thừa/đổi tên dở). */
  extraInEn: string[];
  /** Chuỗi chứa em-dash/en-dash (quy ước UI: không dùng gạch dài), dạng `<locale>:<khoá>`. */
  dashes: string[];
  /** Khoá có ở cả hai bản nhưng khác tham số ICU (`{count}`...): dịch sai tên tham số làm vỡ chuỗi lúc chạy. */
  placeholderMismatches: string[];
}

const LONG_DASH = /[–—]/;
/** Tên tham số ICU: `{count}` hoặc `{count, plural, ...}`; `{one ...}` là nhánh của plural nên không tính. */
const PLACEHOLDER = /\{([a-zA-Z0-9_]+)\s*[,}]/g;

/** Duỗi cây lồng nhau thành `{ "page.home.title": "..." }`. */
export function flattenMessages(tree: MessageTree, prefix = ""): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") flat[path] = value;
    else Object.assign(flat, flattenMessages(value, path));
  }
  return flat;
}

function placeholdersOf(message: string): string {
  return [...new Set([...message.matchAll(PLACEHOLDER)].map((found) => found[1]))].sort().join(",");
}

/** So khoá và tham số của hai bản dịch; `vi` là nguồn chuẩn. Dùng cho `pnpm test` và `scripts/i18n-check.ts`. */
export function checkMessages(vi: MessageTree, en: MessageTree): MessagesCheckResult {
  const viFlat = flattenMessages(vi);
  const enFlat = flattenMessages(en);
  const dashes = [
    ...Object.entries(viFlat).filter(([, text]) => LONG_DASH.test(text)).map(([key]) => `vi:${key}`),
    ...Object.entries(enFlat).filter(([, text]) => LONG_DASH.test(text)).map(([key]) => `en:${key}`),
  ];
  return {
    missingInEn: Object.keys(viFlat).filter((key) => !(key in enFlat)),
    extraInEn: Object.keys(enFlat).filter((key) => !(key in viFlat)),
    dashes,
    placeholderMismatches: Object.keys(viFlat).filter((key) => key in enFlat && placeholdersOf(viFlat[key] ?? "") !== placeholdersOf(enFlat[key] ?? "")),
  };
}

export function hasMessageProblems(result: MessagesCheckResult): boolean {
  return Object.values(result).some((list) => list.length > 0);
}
