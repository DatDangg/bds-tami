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
- [ ] `translation.lastError` (đọc công khai theo PERMISSION §4) chỉ lưu mã lỗi/thông điệp đã lọc — không stack, endpoint, header, API key, nội dung response của provider; có test (review L4-T02 round 2 MINOR-A)
- [ ] Dùng `@anthropic-ai/sdk`, model từ env `TRANSLATION_MODEL`, key `ANTHROPIC_API_KEY` chỉ đọc phía server
- [ ] Gọi với collection ngoài allowlist (leads, lead-activities, job-applications, staff, private-files, audit-logs) → throw, không gọi API
- [ ] richText: chỉ gửi text node; kết quả ghép lại đúng cấu trúc (heading, list, bold, link, ảnh giữ nguyên); kết quả không hợp lệ → lỗi, không lưu
- [ ] Không nhận HTML từ model; output là chuỗi thuần/JSON được validate
- [ ] Trước mỗi lần gọi kiểm `translation-usage` tháng hiện tại; vượt `TRANSLATION_MONTHLY_BUDGET_USD` → dừng, trả lỗi `budget_exceeded`
- [ ] Sau mỗi lần gọi cộng dồn token/requests/chi phí ước tính (upsert theo `month`)
- [ ] Áp `translationGlossary` (tên riêng TAMI HOMES, tên dự án giữ nguyên)
- [ ] Log không chứa nội dung bài

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
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: ARCHITECTURE §7 nếu allowlist/luồng khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-04 tsvc` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

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
