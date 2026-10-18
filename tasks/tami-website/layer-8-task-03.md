# Task 03: Trang Danh sách Cho thuê (S04): bộ lọc trên URL, tìm không dấu, sắp xếp

## Layer
8 — Global trang chủ, dữ liệu lead, danh sách Cho thuê, trang Đăng tin BĐS, sitemap

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — trang chuyển đổi chính, bộ lọc/URL là contract chia sẻ, hiệu năng
- Blast radius: src/app/(frontend)/[locale]/cho-thue/page.tsx; src/components/rentals/RentalFilters.tsx (client), RentalCard.tsx, SortSelect.tsx; src/lib/search/url-params.ts (parse/serialize, dùng chung với API)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-04
- NFR-01
- design-spec S04, §3.5

## Description
`/cho-thue` · `/en/for-rent` render server qua `SearchService`, bộ lọc client cập nhật URL.

## Dependencies
- `layer-7-task-02` `SearchService` + `GET /api/public/rentals` + index trigram (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`, `layer-13-task-03`

## Acceptance Criteria
- [ ] Mọi bộ lọc phản ánh trên URL; mở URL chia sẻ ra đúng kết quả; tham số lạ bị bỏ qua
- [ ] `?q=` từ header search hoạt động
- [ ] Lọc phường phụ thuộc tỉnh; danh mục gồm danh mục con
- [ ] Không có kết quả → trạng thái trống + nút xoá bộ lọc
- [ ] Bộ lọc mobile dạng Sheet; desktop thanh lọc; không cuộn ngang 375px
- [ ] Danh sách có trang `noindex` khi tổ hợp lọc sâu (tránh trùng lặp; trang gốc + lọc danh mục/tỉnh vẫn index)

## Tests cần viết
- Unit url-params: round-trip
- Integration render: URL có lọc → đúng tập kết quả
- RTL: đổi bộ lọc → URL đổi

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

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
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-8): task-03 pubrentlist` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/page.tsx
- src/components/rentals/RentalFilters.tsx (client), RentalCard.tsx, SortSelect.tsx
- src/lib/search/url-params.ts (parse/serialize, dùng chung với API)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 6
- [ ] G27 (LOW): route mới thêm rule vào `MISSING_PAGE_RULES` để slug lạ trả 404 có nội dung (G15), không quay lại 404 rỗng. Report: `.context/review-reports/spec-validation-build-tami-website-layer-6.md`.

## Follow-up từ review layer-7-task-02 (round 1, MINOR)
- [ ] `src/lib/search/rental-search-sql.ts:50`: lọc `ward` chỉ theo slug — slug phường chỉ unique trong tỉnh → giới hạn ward theo province (hoặc bắt buộc gửi kèm `province`, ghi API_SPEC §3.3).
- [ ] `rental-search-sql.ts:27`: danh mục cha đã xoá mềm vẫn khớp → thêm `t."deleted_at" IS NULL`.
- [ ] `rental-search-sql.ts:36-41`: điều kiện công khai chép tay từ `publicWhere` → snapshot test `buildPublicWhere` để khi thêm hẹn giờ `publishedAt` (FR-ADM-16) test đỏ.
- [ ] `scripts/bench/rentals-search.ts`: chặn chạy khi `NODE_ENV=production` / `APP_ENV` staging|production hoặc host DB không phải dev (tránh chèn 100.000 tin giả published).
- [ ] Hook reindex `src/hooks/{wards,projects}/reindex-rentals.ts` chạy đồng bộ trong transaction admin → đẩy sang job nền khi số tin vượt ngưỡng.
- [ ] Đổi tên tỉnh chưa có hook reindex (đang dựa `pnpm reindex:rentals-search`).
- [ ] Gộp `RentalCardData`/`RentalCard` cục bộ của trang chi tiết (L7-T03, `src/lib/rentals/rental-view.ts`, `SimilarRentals`) với DTO `RentalCard` của `GET /api/public/rentals` (`src/shared/types/api.ts`, L7-T02) — một component thẻ dùng chung.

## Follow-up từ spec-validation layer 7 (G29)
- [ ] (từ L7-T03) `src/lib/rentals/rental-queries.ts:71` thẻ tin tương tự: ảnh đầu gallery bị xoá → dùng ảnh kế tiếp; `:74` truyền `locale` khi đọc ảnh bìa.
- [ ] (từ L7-T04) `POST /api/public/job-applications`: thêm `code: "postingClosed"` máy đọc được cho tin hết hạn, `ApplyForm` dựa vào code thay cho quy ước "400 không details"; sửa comment `job-applications.ts:58`, `ApplyForm.tsx:39`, API_SPEC §3.2.
- [ ] (từ L7-T01) test migration `property_posts` chèn thêm dòng `payload_jobs_log` của `expire-offers` để bắt trường hợp bỏ `DELETE FROM payload_jobs_log` trong `down`.
