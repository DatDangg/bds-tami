# Task 04: `TranslationService` (Claude API) + collection `translation-usage` + hạn mức chi phí

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — gửi dữ liệu ra ngoài (Claude API), secret API key, chi phí
- Blast radius: src/lib/translation/translation-service.ts; src/lib/translation/lexical.ts (tách/ghép node chữ, validate lại cấu trúc); src/lib/translation/allowlist.ts (projects, rentals, property-posts, news, services, job-postings, pages, categories, developers, media.alt, globals); …
- Doc impact (dự kiến): ARCHITECTURE §7 nếu allowlist/luồng khác
- Decision impact: NO

## Requirements
- BR-08
- FR-ADM-17
- ARCHITECTURE D7, §7 (Dịch AI)
- ERD §4.13 (`translation-usage`)
- NFR-09

## Description
Service phía server dịch VI → EN: text/textarea và richText Lexical theo từng node chữ (giữ cấu trúc), dùng bảng thuật ngữ, chỉ cho collection công khai trong allowlist, kiểm hạn mức tháng trước khi gọi.

## Dependencies
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)

Mở khoá cho: `layer-9-task-07`

## Acceptance Criteria
- [x] `translation.lastError` (đọc công khai theo PERMISSION §4) chỉ lưu mã lỗi/thông điệp đã lọc — không stack, endpoint, header, API key, nội dung response của provider; có test (review L4-T02 round 2 MINOR-A)
- [x] Dùng `@anthropic-ai/sdk`, model từ env `TRANSLATION_MODEL`, key `ANTHROPIC_API_KEY` chỉ đọc phía server
- [x] Gọi với collection ngoài allowlist (leads, lead-activities, job-applications, staff, private-files, audit-logs) → throw, không gọi API
- [x] richText: chỉ gửi text node; kết quả ghép lại đúng cấu trúc (heading, list, bold, link, ảnh giữ nguyên); kết quả không hợp lệ → lỗi, không lưu
- [x] Không nhận HTML từ model; output là chuỗi thuần/JSON được validate
- [x] Trước mỗi lần gọi kiểm `translation-usage` tháng hiện tại; vượt `TRANSLATION_MONTHLY_BUDGET_USD` → dừng, trả lỗi `budget_exceeded`
- [x] Sau mỗi lần gọi cộng dồn token/requests/chi phí ước tính (upsert theo `month`)
- [x] Áp `translationGlossary` (tên riêng TAMI HOMES, tên dự án giữ nguyên)
- [x] Log không chứa nội dung bài

## Tests cần viết
- Unit (SDK mock): richText nhiều loại node → cấu trúc giữ nguyên, chỉ text đổi
- Unit: collection `leads` → throw trước khi gọi SDK
- Unit: vượt hạn mức → không gọi SDK
- Unit: model trả JSON sai cấu trúc → lỗi
- Không có test gọi API thật trong CI

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-04-round-<R>-review.md`

## Migration
- Bảng `translation_usage` (unique `month`). Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 2 (builder sau reviewer round 1 FAIL)
- Last failure type: MAJOR-1 — `messages.parse` ném lỗi trước khi trả usage, lần gọi cắt cụt/từ chối không ghi chi phí; `truncated`/`refused` không đạt được với SDK thật
- Attempt 2 fix: `claude-client.ts` dùng `messages.create` (+ `output_config.format` lấy `type`/`schema` từ `zodOutputFormat` — đối chiếu `node_modules/@anthropic-ai/sdk/helpers/zod.js` v0.135.0, SDK ghi truyền thẳng vào `.create()` được) nên luôn có `usage`+`stop_reason`; tự `JSON.parse`+zod `safeParse` chỉ khi `end_turn`, hỏng -> `output: null`; service ghi chi phí rồi mới `assertCompleted`/validate. Chia lô theo trần đầu ra (`segments.ts#splitIntoBatches`: mỗi đoạn ≈ ceil(ký tự/2)+30 token, ≤ 12.000/lô = 75% của max_tokens 16.000; kiểm hạn mức + ghi chi phí từng lô; đoạn đơn > trần -> invalid_input). MINOR-2: chặn URL/markdown link/`<`/`>` mà nguồn không có. MINOR-3: `translate` bọc lỗi DB/env thành `TranslationError` (`not_configured`/`provider_unavailable`). MINOR-1: thêm AC vào layer-9-task-07. Bảng giá: comment nguồn.
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: builder tự kiểm 9/9 AC đạt (reviewer STRICT PASS). Test dùng SDK giả/fetch giả, không gọi API thật.
  - lastError lọc: `errors.ts` (`toLastError` chỉ trả mã cố định), `claude-client.ts#mapProviderError`; test `translation-service.test.ts` (lỗi SDK chứa khoá/stack/endpoint giả) + `claude-client.test.ts` (SDK thật + fetch giả: 429/401/403/400/404/500/529/lỗi mạng/JSON sai schema)
  - Allowlist: `allowlist.ts`, kiểm đầu tiên trong `translate` (trước DB/glossary/client)
  - richText: `lexical.ts` + `segments.ts` (chỉ text node; so khung cây trước/sau; kết quả sai -> invalid_output)
  - Hạn mức: `budget.ts` (kiểm trước, `>=`; upsert SQL nguyên tử `ON CONFLICT (month)`); integration `tests/integration/translation-usage.test.ts` (25 lần song song, RBAC, e2e)
  - Glossary + TAMI HOMES: `prompt.ts`; log không có nội dung bài: test với pino ghi vào bộ nhớ
- Verify commands + result (builder, attempt 1): `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi 0 cảnh báo · `pnpm typecheck` OK · `pnpm test` 77 file / 818 test PASS (sau lần sửa cuối) · `pnpm build` OK. Migration `20261017_043315_translation_usage` (additive, không DROP) đã apply trên DB dev, `migrate:status` Yes (batch 10), `migrate:create` lần 2 không sinh file (không drift).
- Verify attempt 2: `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi · `pnpm typecheck` OK · `pnpm test` 77 file / 827 test PASS (sau lần sửa cuối) · `pnpm build` OK. Test mới: claude-client (a) max_tokens+JSON cụt, (b) refusal, (c) end_turn sai schema/không JSON — qua SDK thật + fetch giả, service ghi chi phí; service: output null vẫn ghi chi phí, lỗi HTTP không ghi, URL/markdown/`<>` chèn, lỗi DB che mã, chia lô (+kiểm budget/ghi chi phí từng lô), lô 2 cụt, đoạn quá lớn.
- Reviewer verdict: round 1 FAIL (MAJOR-1 messages.parse làm mất usage khi JSON hỏng) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-4-task-04-round-2-review.md`). Residual: MINOR-A retry policy, MINOR-B chặn nhầm `<`/URL dấu câu, MINOR-C test chia lô → AC `layer-9-task-07`; bảng giá `budget.ts` phải đối chiếu trước khi đặt budget production; chưa thử API thật (user chốt mock)
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-4.md`)

## Doc / Decision Impact
- Doc impact result: đã reconcile as-built: `docs/ERD.md` §4.13 (translation-usage: tháng UTC, upsert nguyên tử, bảng giá, hạn mức 0) và `docs/ARCHITECTURE.md` hàng "Dịch AI" (allowlist as-built, lastError chỉ mã, thiếu key vẫn chạy). Không đổi API_SPEC/DESIGN.
- Decision log: `messages.create` + `output_config.format` (từ `zodOutputFormat`) thay `messages.parse` để luôn có usage; chia lô ≤12k token ước tính; upsert usage `ON CONFLICT (month)` raw SQL; `TRANSLATION_MODEL` mẫu `claude-opus-5-5`, budget mẫu 0 = tắt; model ngoài bảng giá tính giá cao nhất

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-04 tsvc` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/translation/translation-service.ts
- src/lib/translation/lexical.ts (tách/ghép node chữ, validate lại cấu trúc)
- src/lib/translation/allowlist.ts (projects, rentals, property-posts, news, services, job-postings, pages, categories, developers, media.alt, globals)
- src/lib/translation/budget.ts
- src/collections/TranslationUsage.ts
- migrations/*

## Notes
- Đọc skill `claude-api` khi viết code SDK.
- Job `translate-content` và hook ở task translate-job.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
