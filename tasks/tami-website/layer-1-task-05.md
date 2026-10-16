# Task 05: Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — shared lib dùng ở hook/endpoint; định dạng response API
- Blast radius: src/lib/slug.ts (vi bỏ dấu, đ→d; en); src/lib/phone.ts (chuẩn hoá SĐT VN → `+84…`, validate); src/lib/search/normalize.ts (lowercase, bỏ dấu, gộp khoảng trắng); …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- BR-05 (slug)
- BR-15 (chuẩn hoá SĐT)
- ERD §6 (chuẩn hoá tìm kiếm)
- API_SPEC §2 (ok/fail)
- BR-32 (không lưu IP thô)

## Description
Các hàm thuần, có unit test đầy đủ, dùng lại ở hook/endpoint/job.

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-2-task-03`, `layer-2-task-07`, `layer-3-task-02`, `layer-7-task-02`, `layer-8-task-02`, `layer-9-task-02`

## Acceptance Criteria
- [x] `slugify("Căn hộ dịch vụ Quận 1")` → `can-ho-dich-vu-quan-1`; xử lý `đ`, ký tự đặc biệt, gạch nối liên tiếp, độ dài tối đa
- [x] `normalizePhone` chấp nhận `09…`, `+849…`, `849…`, có dấu cách/chấm; từ chối số không hợp lệ
- [x] `normalizeSearchText` cho cùng kết quả với `unaccent(lower())` của Postgres trên bộ mẫu tiếng Việt
- [x] `ok(data)` → `{ success: true, data }`; `fail(status, error, details?)` → `{ success: false, error, details }`
- [x] `ipHash` không đảo ngược được, cùng IP cùng hash trong một môi trường

## Tests cần viết
- Unit cho từng hàm với bảng case (≥ 10 case slug tiếng Việt, ≥ 8 case SĐT)
- Integration nhỏ: so `normalizeSearchText` với `SELECT unaccent(lower($1))` trên DB dev

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-05-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS (reviewer xác minh)
- Verify commands + result: install --frozen-lockfile/lint/typecheck/test (235, integration search-normalize chạy thật không skip)/build = PASS
- Reviewer verdict: STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-1-task-05-round-2-review.md`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: no doc impact
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-05 utils` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/slug.ts (vi bỏ dấu, đ→d; en)
- src/lib/phone.ts (chuẩn hoá SĐT VN → `+84…`, validate)
- src/lib/search/normalize.ts (lowercase, bỏ dấu, gộp khoảng trắng)
- src/lib/http/response.ts (`ok()`, `fail()` theo API_SPEC §2)
- src/lib/security/ip-hash.ts (HMAC-SHA256 với secret)
- src/shared/types/api.ts (khung zod schema + type dùng chung)

## Notes
- Không gom logic nghiệp vụ lead vào đây (để task lead).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-03 (16/10/2026)
- m3: matcher của `src/proxy.ts` bỏ qua mọi path có dấu chấm → slug sinh ra **không được chứa `.`** (bỏ/đổi thành `-`), kèm test.
