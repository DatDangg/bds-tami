# Task 02: `SearchService` + `GET /api/public/rentals` + index trigram

## Layer
7 — Đăng tin BĐS, SearchService, chi tiết Cho thuê, form ứng tuyển

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — API contract công khai + SQL + hiệu năng p95
- Blast radius: src/lib/search/search-service.ts (interface + PostgresRentalSearch); src/endpoints/public/rentals.ts; src/shared/types/api.ts (RentalSearchParams, RentalCard); …
- Doc impact (dự kiến): API_SPEC §3.3, ERD §5/§6 nếu lệch
- Decision impact: NO

## Requirements
- FR-PUB-04
- NFR-01 (p95 ≤ 500ms)
- API_SPEC §3.3
- ERD §5, §6
- design doc D7

## Description
Tìm và lọc tin cho thuê trên Postgres sau interface `SearchService`, dùng cho trang danh sách và API công khai.

## Dependencies
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-1-task-06` Redis client, rate limit, xác thực Turnstile phía server (dùng kết quả của task này)
- `layer-1-task-05` Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash (dùng kết quả của task này)

Mở khoá cho: `layer-8-task-03`, `layer-13-task-03`

## Acceptance Criteria
- [ ] Tham số đúng API_SPEC §3.3 (locale, q, category gồm danh mục con, province, ward, giá, diện tích, bedrooms `4`=4+, furnishing, sort, page, limit ≤ 48); sai → 400
- [ ] Trả `RentalCard` chỉ trường công khai; **không** trả `address` khi `showExactAddress=false`; không trường nội bộ
- [ ] Chỉ `published`/`rented`... theo `publicWhere`; EN lọc `hasEnglish`
- [ ] Từ khoá chuẩn hoá giống `searchText`, gõ không dấu vẫn ra; truy vấn tham số hoá (không nối chuỗi SQL)
- [ ] Rate limit 60/phút; `Cache-Control: s-maxage=60`, cache key gồm locale
- [ ] Bench với 100.000 tin giả lập: p95 ≤ 500ms trên máy dev (ghi số đo)

## Tests cần viết
- Integration: từng bộ lọc + tổ hợp; `q` có/không dấu cùng kết quả
- Integration: không lộ `address`/`author`/trường nội bộ
- Integration: chuỗi injection trong `q` không lỗi
- Bench script (không chạy trong CI mặc định)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-7-task-02-round-<R>-review.md`

## Migration
- Index GIN trigram + composite bổ sung (SQL trong migration). Additive; tạo index trên bảng rỗng ở thời điểm build nên không khoá lâu. Ghi chú: trên dữ liệu lớn về sau dùng `CREATE INDEX CONCURRENTLY`.
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
- Doc impact result: pending (dự kiến: API_SPEC §3.3, ERD §5/§6 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-7): task-02 search` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/lib/search/search-service.ts (interface + PostgresRentalSearch)
- src/endpoints/public/rentals.ts
- src/shared/types/api.ts (RentalSearchParams, RentalCard)
- migrations/* (GIN `search_text gin_trgm_ops` trên `rentals_locales`)
- scripts/bench/rentals-search.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
