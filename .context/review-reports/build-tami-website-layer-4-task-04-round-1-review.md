Agent: reviewer

# Review — build/tami-website · layer-4-task-04 · round 1

- **Review level:** STRICT
- **Reason:** dữ liệu gửi ra ngoài (Claude API), secret `ANTHROPIC_API_KEY`, hạn mức chi phí, raw SQL, migration DB, prompt injection, đổi env schema dùng chung.
- **Blast radius:** `src/lib/translation/*` (service mới, task layer-9-task-07 sẽ dùng); `src/lib/env.ts` (schema env toàn app: `ANTHROPIC_API_KEY` từ bắt buộc → tuỳ chọn); `src/payload.config.ts` + `src/payload-types.ts` (collection `translation-usage`); DB: bảng `translation_usage` + cột/FK nullable `payload_locked_documents_rels.translation_usage_id`; `package.json`/lockfile (`@anthropic-ai/sdk ^0.135.0`); docs ERD §4.13, ARCHITECTURE "Dịch AI".

## Verify commands + result (reviewer tự chạy, test chỉ dùng SDK mock / fetch giả)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm lint` | exit 0, không lỗi |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 — 77 file / 818 test PASS |
| `pnpm build` | exit 0 |
| Grep `ANTHROPIC\|sk-ant\|anthropic-ai\|api.anthropic.com` trong `.next/static` (Grep tool, sau build) | không có kết quả — khoá/SDK không vào bundle trình duyệt |
| `pnpm payload migrate:status` | skip — không nằm trong danh sách verify command được phép (`migration` không auto-allow). Đã đọc trực tiếp file migration (xem dưới); trạng thái applied/drift dựa trên evidence của builder |

Import `lib/translation` trong `src/`: chỉ `collections/TranslationUsage.ts` (lấy `MONTH_PATTERN`) và test; `test-helpers.ts` chỉ test import.

## Responsive Checklist Gate

N/A — diff không đụng route/component/CSS (chỉ cấu hình admin của collection `translation-usage`, ẩn với người không phải admin).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop not installed |
| oxlint (anti-slop) | skip, oxlint not configured (eslint `pnpm lint` PASS) |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — file ≤ 107 dòng, hàm `translate` ~35 dòng, tên rõ, hằng số có tên (`MAX_OUTPUT_TOKENS`, `MAX_TOTAL_CHARS`…), docs ERD/ARCHITECTURE đã cập nhật; 0 indicator đáng kể |
| ai-friendly-web | N/A — không phải thay đổi public-facing |
| blitzstrike | skip — không có môi trường được phép; không gọi API thật theo chốt của user |

## Đối chiếu SDK đã cài (`node_modules/@anthropic-ai/sdk`)

- `messages.parse`, `zodOutputFormat` (`helpers/zod`), `parsed_output`, `Anthropic.RateLimitError/AuthenticationError/PermissionDeniedError/BadRequestError/NotFoundError/UnprocessableEntityError/APIError/AnthropicError` — dùng đúng API có trong bản cài; typecheck PASS.
- Không prefill, không `tool_choice` ép buộc, không `temperature`, không `thinking`/`budget_tokens`, không `output_config.effort` — OK.
- **Nhưng** `lib/parser.js:29-64`: `parseMessage` gọi `parseOutputFormat` cho mọi text block **không xét `stop_reason`**, và JSON lỗi → `throw new AnthropicError("Failed to parse structured output: …")`. Hệ quả ở MAJOR-1.

## Checklist chính

- **Rò rỉ key/nội dung:** OK. Key chỉ đọc server (`parseTranslationEnv`), không có trong `.next/static`; log chỉ ghi `code`/`model`/số token/chi phí, lỗi ghi usage chỉ log `error.name`; `lastError` qua `toLastError` chỉ trả mã cố định, lỗi lạ (TypeError/DB/Env) → `provider_unavailable`; test có khoá/endpoint/nội dung giả (`translation-service.test.ts:197-226`).
- **Allowlist:** OK ở mức collection/global/media — là danh sách cho phép, so khớp chính xác (biến thể tên như `Leads`, `leads ` bị chặn), chạy đầu tiên trước DB/glossary/client; `media` chỉ `alt`; `kind: "collection", slug: "media"` bị chặn. Chưa có ràng buộc mức field (xem MINOR-1).
- **Prompt injection:** OK cơ bản — system prompt coi segment là DATA; output qua JSON schema + `validateModelOutput` (đủ/đúng id, không trùng, không rỗng, không thẻ HTML mới, không xuống dòng mới, giới hạn độ dài); text được lưu vào text node Lexical (render escape). Chưa chặn URL/markdown link do model chèn (MINOR-2). Glossary làm phẳng 1 dòng, cắt 200 ký tự, tối đa 200 mục.
- **Budget:** kiểm trước gọi, tháng UTC (ghi rõ trong ERD/.env.example), `>=`, budget 0 = tắt; cache token tính 1.25×/0.1×; model ngoài bảng → giá cao nhất + warn; overshoot do lần gọi đang bay đã ghi chú. Upsert raw SQL tham số hoá (`sql\`\`` của drizzle), tên bảng đúng `translation_usage` (schema mặc định `public`, khớp migration), chạy trên pool ngoài transaction `req` — có chủ đích và có giải thích. Haiku 5.5 bậc giá > 100K token không được mô hình hoá; với trần đầu vào 60K ký tự + glossary ≤ 200 mục thì prompt không chạm 100K token → chấp nhận được. **Lỗ hổng:** lần gọi bị cắt cụt/từ chối không được ghi chi phí (MAJOR-1).
- **Lexical:** chỉ đi theo `children`, chỉ đổi `text`; so khung cây trước/sau (`skeletonOf`) nên format/link/upload/heading/list giữ nguyên, lệch → `invalid_output`; node lạ không có `children` đi qua nguyên vẹn; `block`/`fields` không duyệt (chữ trong block lồng không được dịch — đã ghi nhận, phù hợp phạm vi). Giới hạn độ sâu 40, 2.000 text node.
- **Migration:** additive — `CREATE TABLE translation_usage`, unique index `month` trên bảng mới, `ADD COLUMN` nullable + FK `ON DELETE cascade` trên `payload_locked_documents_rels` (dữ liệu cũ đều NULL nên FK không vi phạm). Không DROP/đổi type/SET NOT NULL trên dữ liệu cũ → không phải `HIGH_RISK_MIGRATION`. `migrations/index.ts` thêm đúng entry.
- **Env:** `ANTHROPIC_API_KEY` thành tuỳ chọn (rỗng → undefined) → `not_configured`; `TRANSLATION_MODEL` bắt buộc; budget `nonnegative`; lỗi env chỉ nêu tên biến. Có test.

## Findings

### [MAJOR-1] Lần gọi đã tính tiền nhưng JSON hỏng (cắt cụt `max_tokens` / từ chối) không được ghi vào `translation-usage` → hạn mức bị vượt âm thầm; mã `truncated`/`refused` không bao giờ xảy ra với SDK thật
- `src/lib/translation/claude-client.ts:58-64` dùng `anthropic.messages.parse(...)`. Theo `node_modules/@anthropic-ai/sdk/lib/parser.js:29-64`, SDK parse text **bất kể `stop_reason`** và ném `AnthropicError` khi JSON không hợp lệ. Khi model bị cắt ở `max_tokens` (JSON dở) hoặc từ chối bằng văn bản thường, `client.translate` ném lỗi **trước khi** trả `usage`/`stopReason`.
- `src/lib/translation/translation-service.ts:80-89`: nhánh `.catch` map lỗi thành `invalid_output` rồi ném luôn → **không gọi `recordUsage`**. Lần gọi đó đã tốn tới `MAX_OUTPUT_TOKENS = 16_000` token output (≈ $0.32 output + input với `claude-opus-5-5` theo bảng giá trong code) mà hạn mức không cộng. Job dịch thử lại (layer-9-task-07) trên cùng bài dài sẽ lặp lại và đốt tiền không giới hạn trong khi `assertWithinBudget` vẫn thấy chưa chạm hạn mức — vi phạm AC "Sau mỗi lần gọi cộng dồn token/requests/chi phí" và mục tiêu chặn chi phí.
- Khả năng xảy ra thực tế cao: `MAX_TOTAL_CHARS = 60_000` (`segments.ts:25`) ký tự tiếng Việt → bản tiếng Anh + bọc JSON `{"id","text"}` dễ vượt 16.000 token output.
- Test cho cảm giác an toàn giả: `translation-service.test.ts:189-195` chỉ kiểm `truncated`/`refused` + ghi chi phí bằng client giả trả `stopReason` có sẵn; `claude-client.test.ts:58-62` xác nhận SDK thật ném lỗi parse nhưng không có test nào cho `stop_reason: "max_tokens"` với JSON dở qua SDK thật.
- **Cách sửa đề xuất:** trong `createAnthropicClient`, gọi `anthropic.messages.create(...)` (cùng `output_config.format` JSON schema, không để SDK parse) hoặc tự bắt lỗi parse; luôn trả `usage` + `stop_reason`, rồi tự `JSON.parse` + `modelOutputSchema.safeParse` → `output: null` khi hỏng. Như vậy service ghi chi phí trước rồi mới `assertCompleted`/validate (đúng thứ tự hiện có). Thêm test `claude-client.test.ts` dùng fetch giả trả `stop_reason: "max_tokens"` + text JSON dở (và `"refusal"` + text thường) → khẳng định `usage` được trả và service ném `truncated`/`refused` **và** `recordUsage` được gọi. Cân nhắc hạ `MAX_TOTAL_CHARS` hoặc tăng `MAX_OUTPUT_TOKENS` cho khớp (đầu ra tiếng Anh + JSON phải vừa trần output).

### [MINOR-1] Allowlist chỉ ở mức collection/global, không ở mức field
- `src/lib/translation/allowlist.ts:23-41` + `segments.ts:6-8`: `items` do bên gọi tự chọn với `key` tuỳ ý; service không thể chặn việc gửi field nội bộ của collection công khai (vd field liên hệ nội bộ của `job-postings`, `notificationEmails`/`translationGlossary` của `site-settings`). AC hiện tại (mức collection) đạt; rủi ro chuyển sang task gọi service.
- **Đề xuất:** ghi AC cho `layer-9-task-07`: chỉ lấy field `localized: true` công khai từ config collection (danh sách field cho phép theo collection), có test field nội bộ không bị gửi; hoặc thêm tham số field allowlist vào `assertTranslatable`.

### [MINOR-2] Không phát hiện URL/markdown link do model chèn thêm
- `src/lib/translation/segments.ts:101-116` chặn thẻ HTML/xuống dòng/độ dài nhưng chấp nhận `[x](https://…)` hay URL mới không có trong nguồn. Ảnh hưởng thấp (lưu thành text thuần, render escape, không thành link), nhưng nội dung bài là đầu vào có thể bị chèn chỉ dẫn.
- **Đề xuất:** nếu đoạn dịch chứa URL/`](` không có trong đoạn nguồn → `invalid_output`.

### [MINOR-3] Docstring nói "mọi lỗi ra ngoài đều là `TranslationError`" nhưng không đúng
- `src/lib/translation/translation-service.ts:58-60`: lỗi DB từ `assertWithinBudget`/`loadGlossary` và `EnvValidationError` từ `readConfigFromEnv` ném nguyên bản. `toLastError` vẫn che thành `provider_unavailable` nên không rò rỉ, nhưng bên gọi tin docstring có thể ghi `error.message` thẳng vào `lastError`.
- **Đề xuất:** bọc các bước này để luôn ném `TranslationError` (vd `provider_unavailable`/`not_configured`), hoặc sửa docstring nói rõ chỉ `toLastError(...)` được ghi vào `lastError`.

## Residual risk

- Bảng giá `MODEL_PRICES_USD_PER_MILLION` (`budget.ts:16-23`) không đối chiếu được với nguồn giá chính thức trong repo — cần người xác nhận trước khi bật hạn mức thật trên prod.
- `migrate:status`/drift không tự kiểm (lệnh không được phép); dựa vào evidence builder (applied batch 10, `migrate:create` lần 2 không sinh file) + đọc file migration.
- Không chạy API thật (theo chốt user) — hành vi `refusal`/`max_tokens` của API thật chỉ suy ra từ mã nguồn SDK đã cài.

## Verdict

**FAIL** — 1 MAJOR (MAJOR-1: chi phí lần gọi bị cắt cụt/từ chối không được ghi nhận, hạn mức bị bỏ qua; mã `truncated`/`refused` không đạt được với SDK thật). Builder sửa MAJOR-1 (kèm test qua SDK thật + fetch giả); MINOR-1..3 nên xử lý hoặc ghi follow-up.
