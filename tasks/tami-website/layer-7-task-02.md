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
- [x] Tham số đúng API_SPEC §3.3 (locale, q, category gồm danh mục con, province, ward, giá, diện tích, bedrooms `4`=4+, furnishing, sort, page, limit ≤ 48); sai → 400
- [x] Trả `RentalCard` chỉ trường công khai; **không** trả `address` khi `showExactAddress=false`; không trường nội bộ
- [x] Chỉ `published`/`rented`... theo `publicWhere`; EN lọc `hasEnglish`
- [x] Từ khoá chuẩn hoá giống `searchText`, gõ không dấu vẫn ra; truy vấn tham số hoá (không nối chuỗi SQL)
- [x] Rate limit 60/phút; `Cache-Control: s-maxage=60`, cache key gồm locale
- [x] Bench với 100.000 tin giả lập: p95 ≤ 500ms trên máy dev (ghi số đo)

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
- Attempt: 1 (lần đầu bị user ngắt giữa chừng, redo trên đĩa — không tính attempt)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 6/6 AC + follow-up reindex searchText Done
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm test` (151 file, 1.637) · `pnpm build` PASS; test migration up→down→up; bench `pnpm bench:rentals-search` 100.000 tin p95 80.4ms (≤ 500ms)
- Residual: p95 đo trên dev, đo lại trên staging; `CREATE EXTENSION pg_trgm` cần kiểm quyền user DB staging/prod khi deploy (L12-T01); `s-maxage` chỉ có tác dụng khi có Cloudflare Cache Rule (L15-T01)
- Reviewer verdict: STRICT round 1 PASS (`.context/review-reports/build-tami-website-layer-7-task-02-round-1-review.md`), 6 MINOR → `layer-8-task-03`
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-7.md`

## Doc / Decision Impact
- Doc impact result: API_SPEC §3.3, ERD §6, ARCHITECTURE §4
- Decision log: không có decision mới

## Commit / Tracking
- Commit gợi ý: `feat(layer-7): task-02 search` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/search/search-service.ts (interface + PostgresRentalSearch)
- src/endpoints/public/rentals.ts
- src/shared/types/api.ts (RentalSearchParams, RentalCard)
- migrations/* (GIN `search_text gin_trgm_ops` trên `rentals_locales`)
- scripts/bench/rentals-search.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.


## Bench (builder)
- `pnpm bench:rentals-search` (`scripts/bench/rentals-search.ts`, không chạy trong `pnpm test`): chèn 100.000 tin `BENCH-*` vào DB dev, 12 kịch bản x 40 lần, xoá sạch ở `finally`. Có index trigram: **p95 tổng 80.4ms** (p50 26.4ms); kịch bản chậm nhất ~94.5ms (sort giá tăng, không `q`). Ngưỡng 500ms: ĐẠT. Kịch bản có `q` p95 5-61ms nhờ index GIN.
- Migration `20261018_082231_rentals_search_trgm`: `CREATE EXTENSION IF NOT EXISTS pg_trgm` (contrib image `postgis/postgis`, trusted) + GIN `search_text gin_trgm_ops` trên `rentals_locales`; `down` chỉ `DROP INDEX IF EXISTS`; không backfill. Index composite bổ sung không cần (đã có index đơn cột, p95 đạt).

## Follow-up từ review layer-6-task-02
- [x] `rentals.searchText` cũ khi đổi tên dự án hoặc sửa `wards.legacyNames`: thêm lệnh reindex/backfill searchText + hook trên `projects`/`wards` (hoặc job định kỳ) để làm mới các tin liên quan.
