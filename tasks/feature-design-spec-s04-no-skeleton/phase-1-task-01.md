# feature-design-spec-s04-no-skeleton · phase-1-task-01 — design-spec: bỏ skeleton cấp route ở trang danh sách (S04 + cùng nguyên tắc)

- Change doc: `spec/changes/archive/2026-10-19-design-spec-s04-no-skeleton.md` (BACKLOG BL-011)
- Nguồn: gap L10-T04 (`tasks/tami-website/layer-10-task-04.md:84`), L9-T08 round 1 M1 (soft-404 đo 9/9 route); user DUYỆT sửa intent 2026-10-19
- Spec: `.context/design-spec.md` §3.2 (Loading skeleton), S02, S04, S08, S10

## Classification / Risk
- Type: **MODIFY** (intent doc — design-spec), doc-only; code đã làm ở L10-T04 (commit trước), không đổi code
- Risk: **LOW** — không đổi code/schema/API; chỉ đổi câu trạng thái chờ trong intent doc cho khớp ràng buộc kỹ thuật đã duyệt

## Spec delta (đã ghi)
- §3.2 "Loading (skeleton)": bỏ "Dùng `loading.tsx` của route + `Suspense` cho lưới" → cấm `loading.tsx` cấp route cho trang danh sách `force-dynamic` (kể cả thư mục cha, soft-404), lưới danh sách dùng phản hồi chờ như S04; skeleton chỉ cho `Suspense` cục bộ khối con.
- S04 States (câu user duyệt): "Đổi bộ lọc/trang/chip: giữ kết quả cũ, mờ 50% + `aria-busy`, link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route".
- S02, S08, S10 States: "skeleton (6 thẻ)" → phản hồi chờ như S04 (cùng mâu thuẫn kỹ thuật: 3 route này nằm trong `LIST_PAGES` của `list-no-loading.test.ts`).
- `tasks/tami-website/layer-15-task-01.md` follow-up "Skeleton 6 thẻ cho /du-an (loading.tsx)" → đánh dấu bỏ (task pending, trái intent mới + test chặn).

## Evidence code khớp intent mới (không cần builder)
- Không có `loading.tsx` nào dưới `src/app` (`find src -name loading.tsx` → 0); test chặn `src/app/(frontend)/[locale]/list-no-loading.test.ts` (LIST_PAGES 8 route, đi ngược tới `src/app`).
- `src/components/layout/PendingRegion.tsx:45-52` `PendingRegion`: giữ nội dung cũ, `opacity-50` + `aria-busy` khi chờ, tắt transition khi reduced motion.
- `src/components/layout/PendingRegion.tsx:55-71` `PendingLink` dùng `useLinkStatus` → `opacity-60` + `cursor-progress` khi link đang chờ; `FormPendingMarker` (`useFormStatus`) cho bộ lọc `next/form`.
- S04 `/cho-thue`: `src/components/rentals/RentalListPage.tsx:139-156` `RentalPendingRegion` (gộp pending bộ lọc client `RentalListNavigation.tsx:42-47` + pending link qua `ListPendingProvider` `:30`); chip danh mục `RentalListPage.tsx:126-132` + hàng "Đang lọc" `ActiveFilters.tsx:67-81` + phân trang `Pagination.tsx:58,99` là `PendingLink`.
- S02/S08/S10/S12/S05: `CategoryListTemplate.tsx:68-78` (chip `PendingLink`) + `:100-109` (`PendingRegion`) — dùng bởi `ProjectListPage.tsx:93`, `PostListPage.tsx:57`, `NewsListPage.tsx:57`, `JobListPage.tsx:118`.
- Test: `src/components/layout/PendingRegion.test.tsx`, `PendingRegionSources.test.tsx`, `src/components/rentals/RentalFilters.test.tsx`.

## Acceptance
- [x] design-spec S04 thay đúng câu user duyệt; S04 không còn skeleton cấp route
- [x] Chỗ khác cùng mâu thuẫn (§3.2, S02, S08, S10) sửa theo cùng nguyên tắc (Quyết định tự chọn); chỗ không chắc (S03, S07 chi tiết) → gap
- [x] Code hiện tại khớp intent mới (evidence trên) — không lệch
- [x] spec-publisher ghi delta (1.4.0 → 1.4.1 PATCH, scopeVersion 4)

## Gap (không sửa intent)
- **S03** (`/du-an/[slug]`) "skeleton hero + thanh mục con" và **S07** (`/cho-thue/[slug]`) "skeleton thư viện + 2 cột": trang chi tiết, không thuộc `LIST_PAGES`; slug lạ/ẩn đã 404 ở proxy (`MISSING_PAGE_RULES`) nên chưa chắc cùng mâu thuẫn soft-404. Code hiện KHÔNG có skeleton chi tiết (lệch intent, có từ trước). Đề xuất: nếu làm, dùng `Suspense` cục bộ hoặc đo HTTP status trước khi thêm `loading.tsx` ở `[slug]`; cần user chốt.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Doc-only; verify: `pnpm vitest run "src/app/(frontend)/[locale]/list-no-loading.test.ts" src/components/layout/PendingRegion.test.tsx src/components/layout/PendingRegionSources.test.tsx` (reviewer chạy).

## Doc impact / Reconcile
- Intent (user duyệt): `.context/design-spec.md` §3.2, S02, S04, S08, S10.
- As-built: `docs/ARCHITECTURE.md` layer-9-task-08 (4) + cập nhật L10-T04 đã mô tả đúng — no doc impact as-built.

## Review
- NORMAL PASS round 1 — `.context/review-reports/feature-design-spec-s04-no-skeleton-phase-1-task-01-round-1-review.md` (0 CRITICAL/MAJOR; 3 MINOR xử lý ở close-out: m1 đường dẫn `src/components/templates/CategoryListTemplate.tsx` trong test-scope + spec/updates, m2 thêm viewport 768, m3 archive change doc).
- Verify reviewer: 4 file vitest (list-no-loading, PendingRegion, PendingRegionSources, RentalFilters) 35/35 PASS; JSON test-scope hợp lệ. Lint/typecheck/build: skip (doc-only).

## Decision log (tự chọn — auto proceed)
- Sửa thêm §3.2, S02, S08, S10 (ngoài câu S04 user duyệt) vì cùng mâu thuẫn kỹ thuật: route nằm trong `LIST_PAGES` của `list-no-loading.test.ts`.
- Không sửa S03/S07 (trang chi tiết): chưa chắc cùng mâu thuẫn → gap.
- Spec bump PATCH 1.4.1 (làm rõ intent khớp hành vi đã có, không hành vi mới).
- Gạch follow-up L15-T01 "Skeleton 6 thẻ /du-an (loading.tsx)" (pending, trái intent mới + test chặn).

## Residual risk
- Chưa đo lại `?page` vượt → HTTP 404 trên app chạy thật trong task này (đã đo ở L9-T08/L10-T04; test tĩnh chặn `loading.tsx`).
- Comment `src/components/layout/PendingRegion.tsx:9` trỏ "design-spec §3.5" (thực tế §3.2/S04) — lỗi chú thích có từ trước, không sửa (doc-only task).
- Gap S03/S07 skeleton trang chi tiết chờ user chốt.
