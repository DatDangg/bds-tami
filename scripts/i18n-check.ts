/**
 * `pnpm i18n:check`: so khoá/tham số/gạch dài giữa `src/i18n/messages/vi.json` và `en.json` (logic ở `src/i18n/messages-check.ts`,
 * cũng chạy trong `pnpm test`). Thoát mã 1 nếu có vấn đề.
 */
import { readFileSync } from "node:fs";

import { checkMessages, hasMessageProblems, type MessageTree } from "../src/i18n/messages-check.ts";

const readMessages = (locale: string): MessageTree => JSON.parse(readFileSync(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), "utf8")) as MessageTree;

const result = checkMessages(readMessages("vi"), readMessages("en"));
for (const [label, list] of Object.entries(result)) {
  for (const entry of list) console.error(`${label}: ${entry}`);
}
if (hasMessageProblems(result)) process.exit(1);
console.log("i18n-check: vi.json và en.json khớp nhau.");
