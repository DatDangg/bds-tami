# Task 04: Phản hồi chờ phía trình duyệt cho các trang danh sách (D5)

## Layer
10 — Ráp form lead, admin dịch, hoàn thiện EN (+ task bổ sung từ spec-validation layer 9)

Checkpoint: Sau layer 10 là mốc M2 — dừng cho user duyệt.

## Type
build (initial) — task bổ sung (user duyệt 2026-10-19)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — trang danh sách công khai dùng chung, không được làm hỏng HTTP 404 / ISR
- Blast radius: src/components/layout/Pagination.tsx, chip/tab danh mục, filter của /du-an, /tin-tuc, /tin-bds, /tuyen-dung (+ danh mục); dùng lại `PendingRegion` của /cho-thue
- Doc impact (dự kiến): ARCHITECTURE / ERD nếu lệch
- Decision impact: NO

## Requirements
- design-spec §3.5 (skeleton/trạng thái chờ)
- D5 — `.context/review-reports/spec-validation-build-tami-website-layer-9.md`; quyết định user 2026-10-19

## Description
`loading.tsx` cấp route gây soft-404 (L9-T08 đo 9/9 route) nên bị cấm (test `src/app/(frontend)/[locale]/list-no-loading.test.ts`). Thay bằng phản hồi chờ phía client khi điều hướng: `useLinkStatus` (Next 16) trên link phân trang/chip/tab và vùng kết quả mờ + `aria-busy` (mẫu `PendingRegion` ở `/cho-thue`).

## Dependencies
- `layer-9-task-08` Trang danh mục Cho thuê (bỏ loading.tsx, test chặn) (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: phân trang, template danh mục (dùng kết quả của task này)

## Acceptance Criteria
- [ ] Mọi trang danh sách công khai (`/du-an`, `/tin-tuc` + danh mục, `/tin-bds` + danh mục, `/tuyen-dung`, `/cho-thue` + danh mục) có trạng thái chờ khi bấm phân trang/chip/tab/bộ lọc: vùng kết quả mờ + `aria-busy=true`, link đang chờ có chỉ báo; không chặn thao tác
- [ ] Không thêm `loading.tsx` (test chặn vẫn xanh); `?page=` vượt vẫn trả HTTP 404
- [ ] Tôn trọng `prefers-reduced-motion`; không gây CLS; JS client tối thiểu
- [ ] Ghi gap đề xuất Change Request sửa câu "skeleton khi tải lần đầu" trong design-spec §3.5 (không tự sửa intent doc)

## Tests cần viết
- RTL: link đang chờ → vùng kết quả `aria-busy`
- Mở rộng test chặn `loading.tsx`: đi ngược từ mỗi `page.tsx` danh sách lên `app/` (follow-up review L9-T08 đang ở L13-T03 — làm luôn ở đây, đánh dấu L13 bỏ)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-10-task-04-round-<R>-review.md`

## Migration
- Không dự kiến. Cần schema → dừng báo user.

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
- Doc impact result: pending
- Decision log: user duyệt 2026-10-19 (progress.json decisions)

## Commit / Tracking
- 1 task = 1 commit; trailer theo `.agent/workflows/state-commit.md` §2.8
- Progress: `.context/progress.json`

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/layout/Pagination.tsx
- src/components/layout/PendingRegion.tsx (nếu tách từ /cho-thue)
- các component danh sách/filter liên quan

## Notes
- Đọc: `.context/design-spec.md` §3.5, `src/components/rentals/RentalListPage.tsx` (PendingRegion), task file L9-T08 (bảng đo soft-404).
